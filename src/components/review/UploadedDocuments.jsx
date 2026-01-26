/**
 * Uploaded Documents Component
 * Displays all uploaded files from the entire form
 */

import React, { useState } from 'react';
import { Button, CheckIcon, XIcon, WarningIcon } from '../common';
import useFormStore from '../../stores/formStore';

// File metadata mapping - which section/question each file belongs to
const FILE_METADATA = {
  procurementApproval: {
    label: 'Procurement Approval Document',
    section: 'Section 2: Pre-screening',
  },
  letterhead: {
    label: 'Letterhead with Bank Details',
    section: 'Section 2: Pre-screening',
  },
  cestForm: {
    label: 'CEST Form',
    section: 'Section 2: Pre-screening',
  },
  passportPhoto: {
    label: 'Passport Photo',
    section: 'Section 3: Supplier Classification',
  },
  drivingLicenceFront: {
    label: 'Driving Licence (Front)',
    section: 'Section 3: Supplier Classification',
  },
  drivingLicenceBack: {
    label: 'Driving Licence (Back)',
    section: 'Section 3: Supplier Classification',
  },
  opwContract: {
    label: 'OPW/IR35 Agreement',
    section: 'Section 7: Review & Submit',
  },
};

// Format file size to KB/MB
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format upload date
const formatUploadDate = (isoString) => {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const UploadedDocuments = () => {
  const { uploadedFiles, removeUploadedFile, formData } = useFormStore();
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Determine which uploads are required based on formData
  const requiredUploads = [];

  // Letterhead - ALWAYS REQUIRED
  requiredUploads.push({
    fieldName: 'letterhead',
    label: 'Letterhead with Bank Details',
    section: 'Section 2: Pre-screening',
    required: true,
  });

  // Procurement Approval - Required if engaged with procurement
  if (formData?.procurementEngaged === 'yes') {
    requiredUploads.push({
      fieldName: 'procurementApproval',
      label: 'Procurement Approval Document',
      section: 'Section 2: Pre-screening',
      required: true,
    });
  }

  // CEST Form - Required for Sole Traders
  if (formData?.supplierType === 'sole_trader' || formData?.soleTraderStatus === 'yes') {
    requiredUploads.push({
      fieldName: 'cestForm',
      label: 'CEST Form',
      section: 'Section 2: Pre-screening',
      required: true,
    });
  }

  // Passport/ID - Required for Sole Traders
  if (formData?.supplierType === 'sole_trader' || formData?.soleTraderStatus === 'yes') {
    const hasPassport = uploadedFiles?.passportPhoto?.base64;
    const hasLicenceFront = uploadedFiles?.licenceFront?.base64;
    const hasLicenceBack = uploadedFiles?.licenceBack?.base64;

    if (hasPassport || (hasLicenceFront && hasLicenceBack)) {
      // Show whichever they uploaded
      if (hasPassport) {
        requiredUploads.push({
          fieldName: 'passportPhoto',
          label: 'Passport Photo',
          section: 'Section 3: Supplier Classification',
          required: true,
        });
      } else {
        requiredUploads.push({
          fieldName: 'licenceFront',
          label: 'Driving Licence (Front)',
          section: 'Section 3: Supplier Classification',
          required: true,
        });
        requiredUploads.push({
          fieldName: 'licenceBack',
          label: 'Driving Licence (Back)',
          section: 'Section 3: Supplier Classification',
          required: true,
        });
      }
    } else {
      // Neither uploaded, show passport as required
      requiredUploads.push({
        fieldName: 'passportPhoto',
        label: 'Passport or Driving Licence',
        section: 'Section 3: Supplier Classification',
        required: true,
      });
    }
  }

  const handleDelete = (fieldName) => {
    if (confirmDelete === fieldName) {
      removeUploadedFile(fieldName);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(fieldName);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handlePreview = (file) => {
    if (file.file) {
      // Create a blob URL for preview
      const url = URL.createObjectURL(file.file);
      window.open(url, '_blank');
    } else {
      alert('File preview not available. The file was uploaded in a previous session.');
    }
  };

  return (
    <div
      style={{
        padding: 'var(--space-24)',
        borderRadius: 'var(--radius-base)',
        border: '2px solid var(--color-border)',
        marginBottom: 'var(--space-24)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h4 style={{ marginBottom: 'var(--space-16)', color: 'var(--nhs-blue)' }}>
        Required Documents
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
        {requiredUploads.map((upload) => {
          const file = uploadedFiles?.[upload.fieldName];
          const isUploaded = !!(file?.base64 || file?.data);

          return (
            <div
              key={upload.fieldName}
              className="required-document-item"
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '8px',
                background: isUploaded ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${isUploaded ? '#22c55e' : '#dc2626'}`,
              }}
            >
              <div className="document-info-section">
                <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                  {upload.label}
                </div>
                {file?.name && (
                  <div className="document-filename">
                    {file.name}
                  </div>
                )}
              </div>

              <div className="document-status-section">
                <span
                  className="document-status-badge"
                  style={{
                    color: isUploaded ? '#22c55e' : '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isUploaded ? (
                    <><CheckIcon size={14} color="#22c55e" /> Uploaded</>
                  ) : (
                    <><XIcon size={14} color="#dc2626" /> Required</>
                  )}
                </span>

                {isUploaded && (
                  <div className="document-action-buttons">
                    {file.file && (
                      <Button variant="outline" size="sm" onClick={() => handlePreview(file)}>
                        Preview
                      </Button>
                    )}
                    <Button
                      variant={confirmDelete === upload.fieldName ? 'danger' : 'outline'}
                      size="sm"
                      onClick={() => handleDelete(upload.fieldName)}
                    >
                      {confirmDelete === upload.fieldName ? 'Confirm?' : 'Remove'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requiredUploads.some(u => !uploadedFiles?.[u.fieldName]?.base64) && (
        <div
          style={{
            marginTop: 'var(--space-16)',
            paddingTop: 'var(--space-16)',
            borderTop: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-sm)',
            color: '#dc2626',
          }}
        >
          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#dc2626" /> Warning:</strong> You cannot submit the form until all required documents are uploaded.
        </div>
      )}
    </div>
  );
};

export default UploadedDocuments;
