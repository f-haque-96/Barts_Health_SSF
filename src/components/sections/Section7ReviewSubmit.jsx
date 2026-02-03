/**
 * Section 7: Review & Submit
 * Summary of all form data and final submission
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pdf } from '@react-pdf/renderer';
import { Checkbox, Button, NoticeBox, QuestionLabel, CheckIcon, WarningIcon } from '../common';
import { FormNavigation } from '../layout';
import { section7Schema } from '../../utils/validation';
import { formatCurrency } from '../../utils/helpers';
import { formatFieldValue, formatSupplierType, formatServiceCategory, formatUsageFrequency, formatServiceTypes, formatOrganisationType } from '../../utils/formatters';
import useFormStore from '../../stores/formStore';
import useFormNavigation from '../../hooks/useFormNavigation';
import UploadedDocuments from '../review/UploadedDocuments';
import SupplierFormPDF from '../pdf/SupplierFormPDF';

const ReviewItem = ({ label, value, badge, raw = false }) => {
  if (!value && value !== 0) return null;

  // Format the value unless raw is true (for pre-formatted values)
  const displayValue = raw ? value : formatFieldValue(value);

  return (
    <div className="review-item-row">
      <div className="review-item-label">
        {label}:
      </div>
      <div className="review-item-value">
        {displayValue}
        {badge}
      </div>
    </div>
  );
};

const CRNStatusBadge = ({ crn, verificationData }) => {
  if (!crn) return null;

  const isVerified = verificationData?.verified;
  const companyStatus = verificationData?.company_status?.toLowerCase();
  const isActive = companyStatus === 'active';

  if (isVerified && isActive) {
    return <span className="crn-badge crn-badge--verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckIcon size={12} color="#22c55e" /> Verified</span>;
  }

  if (isVerified && !isActive) {
    return <span className="crn-badge crn-badge--warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={12} color="#f59e0b" /> {companyStatus}</span>;
  }

  return <span className="crn-badge crn-badge--unverified">Verification needed</span>;
};

const ReviewCard = ({ title, children, sectionNumber }) => {
  const { goToSection, getMissingFields, formData } = useFormStore();
  const missingFields = getMissingFields(sectionNumber);
  const isIncomplete = missingFields.length > 0;

  // Check for sole trader warning on Section 2
  const isSoleTrader = formData.supplierType === 'sole_trader' || formData.supplierType === 'individual';
  const needsSoleTraderAttention = sectionNumber === 2 && isSoleTrader && formData.soleTraderStatus !== 'yes';

  // Determine border color and background
  const getBorderColor = () => {
    if (isIncomplete) return '#DA291C';
    if (needsSoleTraderAttention) return '#f59e0b';
    return 'var(--color-border)';
  };

  const getBackgroundColor = () => {
    if (needsSoleTraderAttention && !isIncomplete) return '#fffbeb';
    return 'var(--color-surface)';
  };

  const getHeaderColor = () => {
    if (isIncomplete) return '#DA291C';
    if (needsSoleTraderAttention) return '#b45309';
    return 'var(--nhs-blue)';
  };

  return (
    <div
      className={isIncomplete ? 'section-card section-card--incomplete' : needsSoleTraderAttention ? 'section-card section-card--warning' : 'section-card'}
      style={{
        padding: 'var(--space-24)',
        borderRadius: 'var(--radius-base)',
        border: `2px solid ${getBorderColor()}`,
        marginBottom: 'var(--space-16)',
        backgroundColor: getBackgroundColor(),
        position: 'relative',
      }}
    >
      {/* Attention badge for sole trader warning */}
      {needsSoleTraderAttention && !isIncomplete && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '16px',
          background: '#f59e0b',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          Attention Required
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
        <h4 className={isIncomplete ? 'section-card-header' : ''} style={{ margin: 0, color: getHeaderColor() }}>
          Section {sectionNumber}: {title}
          {isIncomplete && <span style={{ marginLeft: '8px', fontSize: '0.9rem', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#DA291C" /> Incomplete</span>}
          {needsSoleTraderAttention && !isIncomplete && <span style={{ marginLeft: '8px', fontSize: '0.9rem', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#f59e0b" /> Review Q2.2</span>}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToSection(sectionNumber)}
        >
          Edit
        </Button>
      </div>
      <div>{children}</div>
      {isIncomplete && (
        <div className="missing-fields-list">
          <h4>Missing Required Fields:</h4>
          <ul>
            {missingFields.map((field, index) => (
              <li key={index} className="missing-field">{field}</li>
            ))}
          </ul>
        </div>
      )}
      {needsSoleTraderAttention && !isIncomplete && (
        <div style={{
          marginTop: 'var(--space-16)',
          padding: 'var(--space-12)',
          background: '#fef3c7',
          borderRadius: 'var(--radius-base)',
          border: '1px solid #f59e0b',
        }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WarningIcon size={16} color="#f59e0b" />
            <span><strong>Sole Trader selected in Section 3.</strong> Please confirm Q2.2 "Is the supplier a Sole Trader?" is answered as "Yes" and upload the required CEST form.</span>
          </p>
        </div>
      )}
    </div>
  );
};

const Section7ReviewSubmit = () => {
  const { formData, uploadedFiles, getAllFormData, setSubmissionId, resetForm, setCurrentSection, canSubmitForm, getMissingFields } = useFormStore();
  const { handlePrev } = useFormNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [canSubmitWithUploads, setCanSubmitWithUploads] = useState(false);
  const [testSubmissionId, setTestSubmissionId] = useState(() => {
    // Check if there's an existing test submission
    return localStorage.getItem('current-test-submission-id') || null;
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(section7Schema),
    defaultValues: {
      finalAcknowledgement: false,
    },
  });

  const finalAcknowledgement = watch('finalAcknowledgement');

  // Check validation whenever uploads or formData changes
  useEffect(() => {
    const missing = getMissingFields('all');
    setMissingFields(missing);
    setCanSubmitWithUploads(missing.length === 0);
  }, [formData, uploadedFiles, getMissingFields]);

  // Also check on component mount
  useEffect(() => {
    const missing = getMissingFields('all');
    setMissingFields(missing);
    setCanSubmitWithUploads(missing.length === 0);
  }, [getMissingFields]);

  const canSubmit = canSubmitForm() && finalAcknowledgement && canSubmitWithUploads;

  const onSubmit = async () => {
    // Double-check validation before submitting
    const missing = getMissingFields('all');

    if (missing.length > 0) {
      alert('Please complete all required fields and uploads before submitting:\n\n' + missing.join('\n'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare form data for submission
      const allData = getAllFormData();

      // Mock API submission - simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate submission ID
      const submissionId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const submissionDate = new Date().toISOString();

      // Store submission in localStorage (mock database)
      const submission = {
        submissionId,
        submissionDate,
        status: 'pending_review',
        formData: allData.formData,
        uploadedFiles: Object.keys(allData.uploadedFiles),
        submittedBy: allData.formData.nhsEmail,
      };

      // Store in localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(submission));

      // Add to submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      submissions.push({
        submissionId,
        submissionDate,
        submittedBy: allData.formData.nhsEmail,
        status: 'pending_review',
      });
      localStorage.setItem('all_submissions', JSON.stringify(submissions));

      // Update form store
      setSubmissionId(submissionId);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('❌ Submission error:', error);
      setSubmitError(
        'An error occurred while submitting the form. Your progress has been saved. Please try again or contact support at procurement@nhs.net if the problem persists.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Submit Another Form" - Complete reset
  const handleSubmitAnother = () => {
    // Clear all form-related localStorage
    localStorage.removeItem('nhs-supplier-form-storage');
    localStorage.removeItem('supplier-form-uploads');
    localStorage.removeItem('supplier-submissions');
    localStorage.removeItem('all_submissions');

    // Remove individual submission entries
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('submission_')) {
        localStorage.removeItem(key);
      }
    });

    // Reset the store completely
    resetForm();

    // Clear any other state
    setCurrentSection(1);

    // Force page reload for clean state
    window.location.href = '/';
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      // Get all form data
      const allData = getAllFormData();

      // Generate PDF document
      const pdfDoc = (
        <SupplierFormPDF
          formData={allData.formData}
          uploadedFiles={allData.uploadedFiles}
          submissionId={null}
          submissionDate={new Date().toISOString()}
        />
      );

      // Generate blob
      const blob = await pdf(pdfDoc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NHS-Supplier-Form-${allData.formData.companyName || 'Draft'}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again or contact support.');
    }
  };

  // Handle Reset Form - Complete reset of ALL data
  const handleResetForm = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the form?\n\nThis will clear ALL form data and uploaded files. This action cannot be undone.'
    );

    if (confirmed) {
      // Clear ALL form-related localStorage keys
      localStorage.removeItem('nhs-supplier-form-storage'); // Main form storage (Zustand persist)
      localStorage.removeItem('supplier-form-uploads'); // Uploaded files
      localStorage.removeItem('form-storage'); // Legacy key
      localStorage.removeItem('all_submissions'); // Submissions list
      localStorage.removeItem('supplier-submissions'); // Alternative submissions key

      // Clear all individual submission entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('submission_') || key.startsWith('PREVIEW-')) {
          localStorage.removeItem(key);
        }
      });

      // Reset the Zustand store
      resetForm();

      // Force page reload to ensure clean state
      window.location.reload();
    }
  };

  // Handle Preview Authorisation (unified for all preview types)
  const handlePreviewAuthorisation = (type) => {
    const allData = getAllFormData();

    let currentSubmissionId = testSubmissionId;

    // Create new submission only if one doesn't exist
    if (!currentSubmissionId) {
      currentSubmissionId = `PREVIEW-TEST-${Date.now()}`;
      setTestSubmissionId(currentSubmissionId);
      localStorage.setItem('current-test-submission-id', currentSubmissionId);

      const newSubmission = {
        id: currentSubmissionId,
        submissionId: currentSubmissionId,
        formData: allData.formData,
        uploadedFiles: allData.uploadedFiles,
        submittedBy: allData.formData.nhsEmail,
        submissionDate: new Date().toISOString(),
        status: 'pending_review',
        isPreview: true,
        // Initialize review objects as null
        pbpReview: null,
        procurementReview: null,
        opwReview: null,
        contractDrafter: null,
        apReview: null
      };

      localStorage.setItem(`submission_${currentSubmissionId}`, JSON.stringify(newSubmission));
    } else {
      // Load existing submission and update form data (but preserve reviews)
      const existing = localStorage.getItem(`submission_${currentSubmissionId}`);
      if (existing) {
        const parsed = JSON.parse(existing);
        const updated = {
          ...parsed,
          formData: allData.formData,
          uploadedFiles: allData.uploadedFiles,
          // Preserve existing reviews
          pbpReview: parsed.pbpReview,
          procurementReview: parsed.procurementReview,
          opwReview: parsed.opwReview,
          contractDrafter: parsed.contractDrafter,
          apReview: parsed.apReview
        };
        localStorage.setItem(`submission_${currentSubmissionId}`, JSON.stringify(updated));
      }
    }

    // Open the appropriate review page with the SAME submission ID
    // Special handling for requester response page (different URL pattern)
    if (type === 'respond') {
      window.open(`/respond/${currentSubmissionId}`, '_blank');
    } else {
      window.open(`/${type}-review/${currentSubmissionId}`, '_blank');
    }
  };

  // Reset Test Submission
  const handleResetTestSubmission = () => {
    if (testSubmissionId) {
      const confirmed = window.confirm(
        'Are you sure you want to reset the test submission?\n\nThis will clear the current test and all authorisations. The form data will remain.'
      );

      if (confirmed) {
        localStorage.removeItem(`submission_${testSubmissionId}`);
        localStorage.removeItem('current-test-submission-id');
        setTestSubmissionId(null);
        alert('Test submission reset. Click a preview button to create a new test.');
      }
    }
  };

  if (submitSuccess) {
    return (
      <section className="form-section active" id="section-7">
        <NoticeBox type="success">
          <h3 style={{ marginTop: 0 }}>Form Submitted Successfully!</h3>
          <p>
            Your supplier setup form has been submitted and is now being reviewed by the Procurement team.
            You will receive an email confirmation shortly.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>What happens next?</strong>
            <br />
            The Procurement team will review your submission and may contact you if additional information is required.
          </p>
        </NoticeBox>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-32)' }}>
          <Button variant="primary" onClick={handleSubmitAnother}>
            Submit Another Form
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-section active" id="section-7">
      <h3>Review & Submit</h3>
      <p className="section-subtitle">
        Please review all information before submitting. You can edit any section by clicking the "Edit" button.
      </p>

      {/* Section 1: Requester Information */}
      <ReviewCard title="Requester Information" sectionNumber={1}>
        <ReviewItem label="Name" value={`${formData.firstName || ''} ${formData.lastName || ''}`} />
        <ReviewItem label="Job Title" value={formData.jobTitle} />
        <ReviewItem label="Department" value={formData.department} />
        <ReviewItem label="NHS Email" value={formData.nhsEmail} raw />
        <ReviewItem label="Phone" value={formData.phoneNumber} />
      </ReviewCard>

      {/* Section 2: Pre-screening */}
      <ReviewCard title="Pre-screening" sectionNumber={2}>
        {/* Q2.1 Supplier Connection */}
        <ReviewItem label="2.1 Supplier Connection" value={formData.supplierConnection} />
        {formData.supplierConnection === 'yes' && formData.connectionDetails && (
          <div style={{
            marginTop: 'var(--space-12)',
            padding: 'var(--space-12)',
            backgroundColor: '#fbf8ec',
            borderRadius: 'var(--radius-base)',
          }}>
            <strong style={{ color: '#b45309' }}> Connection Details:</strong>
            <p style={{ margin: 'var(--space-8) 0 0 0', color: '#92400e' }}>{formData.connectionDetails}</p>
          </div>
        )}
        {/* Q2.2 Sole Trader Status (moved from Q2.5) */}
        <ReviewItem label="2.2 Sole Trader Status" value={formData.soleTraderStatus} />
        {/* Q2.3 Letterhead (was Q2.2) */}
        <ReviewItem label="2.3 Letterhead Available" value={formData.letterheadAvailable} />
        {/* Q2.4 Justification (was Q2.3) */}
        <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-12)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-base)' }}>
          <strong>2.4 Justification:</strong>
          <p style={{ margin: 'var(--space-8) 0 0 0' }}>{formData.justification}</p>
        </div>
        {/* Q2.5 Usage Frequency (was Q2.4) */}
        <ReviewItem label="2.5 Usage Frequency" value={formatUsageFrequency(formData.usageFrequency)} raw />
        {/* Q2.6 Service Category */}
        <ReviewItem label="2.6 Service Category" value={formatServiceCategory(formData.serviceCategory)} raw />
        {/* Q2.7 Procurement Engaged */}
        <ReviewItem label="2.7 Procurement Engaged" value={formData.procurementEngaged} />
      </ReviewCard>

      {/* Section 3: Supplier Classification */}
      <ReviewCard title="Supplier Classification" sectionNumber={3}>
        <ReviewItem label="Companies House Registered" value={formData.companiesHouseRegistered} />
        <ReviewItem label="Supplier Type" value={formatSupplierType(formData.supplierType)} raw />

        {/* CRN - Only show if applicable (not for sole traders, individuals) */}
        {formData.crn && !['sole_trader', 'individual'].includes(formData.supplierType) && (
          <ReviewItem
            label="CRN"
            value={formData.crn}
            badge={<CRNStatusBadge crn={formData.crn} verificationData={formData.crnVerification} />}
          />
        )}

        {/* Charity Number - Only show for charities */}
        {formData.charityNumber && formData.supplierType === 'charity' && (
          <ReviewItem label="Charity Number" value={formData.charityNumber} />
        )}

        {/* Organisation Type - Only show for public sector */}
        {formData.organisationType && formData.supplierType === 'public_sector' && (
          <ReviewItem label="Organisation Type" value={formatOrganisationType(formData.organisationType)} raw />
        )}

        <ReviewItem label="Annual Value" value={formData.annualValue ? formatCurrency(formData.annualValue) : ''} />
        <ReviewItem label="Employee Count" value={formData.employeeCount} />
      </ReviewCard>

      {/* Section 4: Supplier Details */}
      <ReviewCard title="Supplier Details" sectionNumber={4}>
        <ReviewItem label="Company Name" value={formData.companyName} />
        {formData.tradingName && <ReviewItem label="Trading Name" value={formData.tradingName} />}
        <ReviewItem label="Address" value={formData.registeredAddress} />
        <ReviewItem label="City" value={formData.city} />
        <ReviewItem label="Postcode" value={formData.postcode} />
        <ReviewItem label="Contact Name" value={formData.contactName} />
        <ReviewItem label="Contact Email" value={formData.contactEmail} raw />
        <ReviewItem label="Contact Phone" value={formData.contactPhone} />
        {formData.website && <ReviewItem label="Website" value={formData.website} />}
      </ReviewCard>

      {/* Section 5: Service Description */}
      <ReviewCard title="Service Description" sectionNumber={5}>
        <ReviewItem label="Service Types" value={formatServiceTypes(formData.serviceType)} raw />
        <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-12)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-base)' }}>
          <strong>Service Description:</strong>
          <p style={{ margin: 'var(--space-8) 0 0 0' }}>{formData.serviceDescription}</p>
        </div>
      </ReviewCard>

      {/* Section 6: Financial Information */}
      <ReviewCard title="Financial & Accounts" sectionNumber={6}>
        <ReviewItem label="Overseas Supplier" value={formData.overseasSupplier} />
        {formData.iban && <ReviewItem label="IBAN" value={formData.iban} />}
        <ReviewItem label="Accounts Address Same" value={formData.accountsAddressSame} />
        <ReviewItem label="GHX/DUNS Known" value={formData.ghxDunsKnown} />
        {formData.ghxDunsNumber && <ReviewItem label="GHX/DUNS Number" value={formData.ghxDunsNumber} />}
        <ReviewItem label="CIS Registered" value={formData.cisRegistered} />
        {formData.utrNumber && <ReviewItem label="UTR Number" value={formData.utrNumber} />}
        <ReviewItem label="VAT Registered" value={formData.vatRegistered} />
        {formData.vatNumber && <ReviewItem label="VAT Number" value={formData.vatNumber} />}
        <ReviewItem label="Public Liability Insurance" value={formData.publicLiability} />
        {formData.plCoverage && <ReviewItem label="Coverage" value={formatCurrency(formData.plCoverage)} />}
      </ReviewCard>

      {/* Uploaded Documents */}
      <UploadedDocuments />

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-12)',
        marginTop: 'var(--space-24)',
        padding: 'var(--space-16)',
        backgroundColor: 'var(--color-background)',
        borderRadius: 'var(--radius-base)',
        border: '1px solid var(--color-border)',
        flexWrap: 'wrap',
      }}>
        <Button variant="outline" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
        <Button variant="outline" onClick={handleResetForm} style={{ color: 'var(--color-danger)' }}>
          Reset Form
        </Button>
      </div>

      {/* Authorisation Preview Buttons - Hidden in production, toggle via VITE_ENABLE_TEST_BUTTONS */}
      {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_BUTTONS === 'true') && (
        <div style={{
          marginTop: 'var(--space-16)',
          padding: 'var(--space-16)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-base)',
          border: '1px solid var(--color-border)',
        }}>
          <h4 style={{ margin: '0 0 var(--space-12) 0', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
            Test Authorisation Views
          </h4>
          {testSubmissionId && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-12)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
              Current test submission: <code style={{ backgroundColor: 'var(--color-background)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{testSubmissionId}</code>
              <button
                onClick={handleResetTestSubmission}
                style={{
                  color: 'var(--color-danger)',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Reset
              </button>
            </p>
          )}
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-12)' }}>
            Click each button in order to test the full workflow: PBP → Procurement → OPW (if applicable) → AP Control
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => handlePreviewAuthorisation('pbp')} style={{ color: 'var(--nhs-blue)' }}>
              1. PBP Review
            </Button>
            <Button variant="outline" onClick={() => handlePreviewAuthorisation('procurement')} style={{ color: 'var(--nhs-blue)' }}>
              2. Procurement
            </Button>
            <Button variant="outline" onClick={() => handlePreviewAuthorisation('opw')} style={{ color: 'var(--nhs-blue)' }}>
              3. OPW Panel
            </Button>
            <Button variant="outline" onClick={() => handlePreviewAuthorisation('ap')} style={{ color: 'var(--nhs-blue)' }}>
              4. AP Control
            </Button>
            <Button variant="outline" onClick={() => handlePreviewAuthorisation('respond')} style={{ color: '#ca8a04', borderColor: '#ca8a04', backgroundColor: '#fefce8' }}>
              5. Requester
            </Button>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', marginTop: 'var(--space-8)', marginBottom: 0 }}>
            Use "5. Requester" to view the requester's perspective when PBP requests more information
          </p>
        </div>
      )}

      {/* Final Acknowledgement */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginTop: 'var(--space-32)', paddingTop: 'var(--space-24)', borderTop: '2px solid var(--color-border)' }}>
          {/* Show missing uploads warning */}
          {missingFields.filter(f => f.includes('Upload')).length > 0 && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: '#dc2626', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WarningIcon size={18} color="#dc2626" /> Missing Required Uploads
              </h4>
              <p style={{ margin: '0 0 12px 0' }}>
                The following documents must be uploaded before you can submit:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {missingFields
                  .filter(f => f.includes('Upload'))
                  .map((field, index) => (
                    <li key={index} style={{ color: '#dc2626', marginBottom: '4px' }}>
                      {field.replace(' (Upload Required)', '').replace(' (Upload Required for Sole Traders)', '')}
                    </li>
                  ))
                }
              </ul>
              <p style={{ margin: '12px 0 0 0', fontSize: '0.9rem' }}>
                Please go back to the relevant section and upload the required documents.
              </p>
            </div>
          )}

          {/* Show all missing fields */}
          {missingFields.length > 0 && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: '#92400e', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WarningIcon size={18} color="#f59e0b" /> Please Complete All Required Fields
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {missingFields.map((field, index) => (
                  <li key={index} style={{ color: '#92400e', marginBottom: '4px' }}>
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <NoticeBox type="info">
            <strong>Before submitting:</strong> Please ensure all information is accurate and complete.
            Once submitted, this form will be reviewed by the Procurement team.
          </NoticeBox>

          <Controller
            name="finalAcknowledgement"
            control={control}
            render={({ field }) => (
              <Checkbox
                label={<QuestionLabel section="7" question="1">I confirm that all information provided in this form is accurate and complete to the best of my knowledge</QuestionLabel>}
                name="finalAcknowledgement"
                checked={field.value}
                onChange={field.onChange}
                error={errors.finalAcknowledgement?.message}
                required
              />
            )}
          />

          {!canSubmitForm() && (
            <NoticeBox type="warning" style={{ marginTop: 'var(--space-16)' }}>
              <strong>Please complete all required fields before submitting.</strong>
              <br />
              Go back through the sections and ensure all mandatory fields are filled in.
            </NoticeBox>
          )}

          {submitError && (
            <NoticeBox type="error" style={{ marginTop: 'var(--space-16)' }}>
              {submitError}
            </NoticeBox>
          )}
        </div>

        <FormNavigation
          onNext={handleSubmit(onSubmit)}
          onPrev={handlePrev}
          showNext={true}
          nextDisabled={!canSubmit || isSubmitting}
          nextLabel={canSubmit ? 'Submit Form' : 'Complete Required Fields to Submit'}
        />

        {!canSubmit && missingFields.length > 0 && (
          <p style={{
            textAlign: 'center',
            color: '#dc2626',
            marginTop: '12px',
            fontSize: '0.9rem'
          }}>
            {missingFields.length} required field(s) must be completed before submission
          </p>
        )}
      </form>
    </section>
  );
};

export default Section7ReviewSubmit;
