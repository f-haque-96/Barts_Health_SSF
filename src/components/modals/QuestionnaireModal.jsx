/**
 * Questionnaire Modal
 * Dynamic questionnaire for clinical and non-clinical procurement
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea, RadioGroup, Select, NoticeBox } from '../common';
import useFormStore from '../../stores/formStore';

// ===== Validation Schemas =====

const clinicalQuestionnaireSchema = z.object({
  supplierName: z.string().min(2, 'Supplier name is required').max(200, 'Maximum 200 characters'),
  clinicalServices: z.string().min(10, 'Please provide more detail (minimum 10 characters)').max(500, 'Maximum 500 characters'),
  patientContact: z.enum(['yes', 'no'], { required_error: 'Please select an option' }),
  patientDataAccess: z.enum(['yes', 'no'], { required_error: 'Please select an option' }),
  clinicalQualifications: z.string().min(10, 'Please provide more detail (minimum 10 characters)').max(500, 'Maximum 500 characters'),
  annualValue: z.number().positive('Please enter a valid amount'),
  clinicalAssessment: z.enum(['yes', 'no', 'in_progress'], { required_error: 'Please select an option' }),
  additionalNotes: z.string().max(500, 'Maximum 500 characters').optional(),
});

const nonClinicalQuestionnaireSchema = z.object({
  supplierName: z.string().min(2, 'Supplier name is required').max(200, 'Maximum 200 characters'),
  goodsServices: z.string().min(10, 'Please provide more detail (minimum 10 characters)').max(500, 'Maximum 500 characters'),
  procurementCategory: z.string().min(1, 'Please select a category'),
  annualValue: z.number().positive('Please enter a valid amount'),
  frameworkAgreement: z.enum(['yes', 'no', 'unknown'], { required_error: 'Please select an option' }),
  supplierReason: z.string().min(10, 'Please provide more detail (minimum 10 characters)').max(500, 'Maximum 500 characters'),
  alternativesConsidered: z.enum(['yes', 'no'], { required_error: 'Please select an option' }),
  additionalNotes: z.string().max(500, 'Maximum 500 characters').optional(),
});

// ===== Procurement Categories =====
const procurementCategories = [
  { value: 'facilities', label: 'Facilities Management' },
  { value: 'it_hardware', label: 'IT Hardware' },
  { value: 'it_software', label: 'IT Software/Services' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'training', label: 'Training & Development' },
  { value: 'marketing', label: 'Marketing & Communications' },
  { value: 'catering', label: 'Catering' },
  { value: 'transport', label: 'Transport & Logistics' },
  { value: 'other', label: 'Other' },
];

const QuestionnaireModal = ({ isOpen, onClose, onComplete, type = 'clinical', section2Data = {} }) => {
  const { formData, updateFormData, updatePrescreeningProgress } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [questionnaireUploads, setQuestionnaireUploads] = useState({});

  const isClinical = type === 'clinical';
  const schema = isClinical ? clinicalQuestionnaireSchema : nonClinicalQuestionnaireSchema;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: isClinical
      ? {
          supplierName: '',
          clinicalServices: '',
          patientContact: '',
          patientDataAccess: '',
          clinicalQualifications: '',
          annualValue: '',
          clinicalAssessment: '',
          additionalNotes: '',
        }
      : {
          supplierName: '',
          goodsServices: '',
          procurementCategory: '',
          annualValue: '',
          frameworkAgreement: '',
          supplierReason: '',
          alternativesConsidered: '',
          additionalNotes: '',
        },
  });

  // Upload handler for questionnaire files
  const handleQuestionnaireUpload = async (files) => {
    if (!files || files.length === 0) return;

    for (const file of files) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
        continue;
      }

      // Convert to base64
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });

        setQuestionnaireUploads(prev => ({
          ...prev,
          [file.name]: {
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64,
            uploadedAt: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload "${file.name}". Please try again.`);
      }
    }
  };

  // Remove uploaded file
  const handleRemoveUpload = (fileName) => {
    const { [fileName]: removed, ...rest } = questionnaireUploads;
    setQuestionnaireUploads(rest);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate questionnaire ID
      const questionnaireId = `QUEST-${Date.now()}`;
      const submissionDate = new Date().toISOString();

      // Store questionnaire data in form (including uploads)
      updateFormData(`${type}Questionnaire`, {
        ...data,
        submittedAt: submissionDate,
        questionnaireId,
        status: 'pending_approval',
        uploads: questionnaireUploads,
        uploadedFiles: questionnaireUploads,
      });

      console.log('=== QUESTIONNAIRE SUBMIT ===');
      console.log('Questionnaire Uploads:', questionnaireUploads);

      // Create a submission for PBP review - includes Section 2 data
      const questionnaireSubmission = {
        submissionId: questionnaireId,
        submissionDate: submissionDate,
        status: 'pending_review',
        type: 'questionnaire',
        questionnaireType: type,
        formData: {
          ...formData,
          [`${type}Questionnaire`]: data,
        },
        // Include Section 2 data for PBP reference
        section2Summary: section2Data,
        uploadedFiles: {},
        // Save uploads in multiple formats for compatibility
        questionnaireUploads: questionnaireUploads,
        uploads: questionnaireUploads,
        questionnaireData: {
          ...data,
          uploads: questionnaireUploads,
          uploadedFiles: questionnaireUploads,
        },
        submittedBy: formData.nhsEmail || 'Unknown',
        isQuestionnaire: true,
      };

      console.log('Full questionnaire submission:', questionnaireSubmission);

      // Save to localStorage for PBP review
      localStorage.setItem(`submission_${questionnaireId}`, JSON.stringify(questionnaireSubmission));

      // Also save questionnaire submission separately for backup retrieval
      localStorage.setItem('questionnaireSubmission', JSON.stringify({
        questionnaireId,
        type,
        data,
        section2Summary: section2Data,
        uploads: questionnaireUploads,
        uploadedFiles: questionnaireUploads,
        submittedAt: submissionDate,
      }));

      // Add to submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      submissions.push({
        submissionId: questionnaireId,
        submissionDate: submissionDate,
        submittedBy: formData.nhsEmail || 'Unknown',
        status: 'pending_review',
        type: 'questionnaire',
        questionnaireType: type,
      });
      localStorage.setItem('all_submissions', JSON.stringify(submissions));

      // Update prescreening progress to unlock remaining questions
      updatePrescreeningProgress({
        questionnaireSubmitted: true,
        questionnaireId,
        questionnaireType: type,
        procurementApproved: false, // Will be set to true after PBP approval
      });

      // Also store section2 data with questionnaire info in form store
      updateFormData('questionnaireCompleted', true);
      updateFormData('questionnaireId', questionnaireId);
      updateFormData('section2Summary', section2Data);

      setSubmitSuccess(true);

      // Close modal and show success after delay
      setTimeout(() => {
        setSubmitSuccess(false);
        reset();
        setQuestionnaireUploads({});
        // Call onComplete to signal successful submission
        if (onComplete) {
          onComplete();
        } else {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error('Questionnaire submission error:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSubmitSuccess(false);
      setQuestionnaireUploads({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isClinical ? 'Clinical' : 'Non-Clinical'} Procurement Questionnaire`}
      size="large"
      headerStyle="nhs-blue"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        !submitSuccess && (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <button
              type="button"
              className="btn-primary"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              style={{
                backgroundColor: '#005EB8',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                minWidth: '180px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }}></span>
                  Submitting...
                </>
              ) : (
                'Submit Questionnaire'
              )}
            </button>
          </>
        )
      }
    >
      {submitSuccess ? (
        <NoticeBox type="success">
          <h4 style={{ marginTop: 0 }}>Questionnaire Submitted Successfully!</h4>
          <p>
            Your {isClinical ? 'clinical' : 'non-clinical'} questionnaire has been submitted to the
            Procurement Business Partner (PBP) for assessment.
          </p>
          <p style={{ fontWeight: '600', color: '#166534' }}>
            Please wait for their assessment.
          </p>
          <p style={{ marginBottom: 0, fontStyle: 'italic', color: '#6b7280' }}>
            This window will close automatically...
          </p>
        </NoticeBox>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <NoticeBox type="info" style={{ marginBottom: 'var(--space-24)' }}>
            <strong>Important:</strong> This questionnaire will be reviewed by a Procurement Business
            Partner. Please provide accurate and detailed information.
          </NoticeBox>

          {/* Supplier Name - First Question */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              Supplier/Company Name
              <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
            </label>
            <Controller
              name="supplierName"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <>
                  <input
                    type="text"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Enter the name of the supplier you wish to set up"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '6px', marginBottom: 0 }}>
                    This is the company or individual you are requesting to be set up as a supplier.
                  </p>
                </>
              )}
            />
          </div>

          {/* Clinical Questionnaire Questions */}
          {isClinical && (
            <>
              {/* Question 1 */}
              <Controller
                name="clinicalServices"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="What clinical services will the supplier provide?"
                    {...field}
                    error={errors.clinicalServices?.message}
                    required
                    rows={4}
                    maxLength={500}
                    showCharCount
                    placeholder="Describe the clinical services in detail..."
                  />
                )}
              />

              {/* Question 2 */}
              <Controller
                name="patientContact"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    label="Will the supplier have direct patient contact?"
                    name="patientContact"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.patientContact?.message}
                    required
                    horizontal
                  />
                )}
              />

              {/* Question 3 */}
              <Controller
                name="patientDataAccess"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    label="Does the supplier require access to patient data?"
                    name="patientDataAccess"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.patientDataAccess?.message}
                    required
                    horizontal
                  />
                )}
              />

              {/* Question 4 */}
              <Controller
                name="clinicalQualifications"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="What clinical qualifications or registrations does the supplier hold?"
                    {...field}
                    error={errors.clinicalQualifications?.message}
                    required
                    rows={4}
                    maxLength={500}
                    showCharCount
                    placeholder="e.g., GMC registration, NMC registration, professional memberships..."
                  />
                )}
              />

              {/* Question 5 */}
              <Input
                label="What is the estimated annual contract value? (£)"
                type="number"
                {...register('annualValue', { valueAsNumber: true })}
                error={errors.annualValue?.message}
                required
                placeholder="e.g., 50000"
                style={{ marginBottom: 'var(--space-16)' }}
              />

              {/* Question 6 */}
              <Controller
                name="clinicalAssessment"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    label="Has a clinical impact assessment been completed?"
                    name="clinicalAssessment"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'in_progress', label: 'In Progress' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.clinicalAssessment?.message}
                    required
                    horizontal
                  />
                )}
              />

              {/* Question 7 */}
              <Controller
                name="additionalNotes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="Additional clinical considerations or notes (optional)"
                    {...field}
                    error={errors.additionalNotes?.message}
                    rows={4}
                    maxLength={500}
                    showCharCount
                    placeholder="Any additional information relevant to this clinical procurement..."
                  />
                )}
              />

              {/* File Upload Section */}
              <div className="form-group">
                <label className="form-label">
                  Supporting Documents (Optional)
                </label>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-12)' }}>
                  Upload any relevant quotes, proposals, or supporting documents
                </p>

                <div className="questionnaire-upload-area">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleQuestionnaireUpload(Array.from(e.target.files));
                        e.target.value = ''; // Reset input
                      }
                    }}
                    multiple
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ textAlign: 'center', padding: 'var(--space-20)' }}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#005EB8"
                      strokeWidth="2"
                      style={{ marginBottom: 'var(--space-8)' }}
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)' }}>
                      Click to upload or drag and drop
                    </p>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      PDF, PNG, JPG (Max 5MB each)
                    </span>
                  </div>
                </div>

                {/* Display uploaded files */}
                {Object.keys(questionnaireUploads).length > 0 && (
                  <div className="questionnaire-uploaded-files">
                    {Object.entries(questionnaireUploads).map(([name, file]) => (
                      <div key={name} className="uploaded-file-item">
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          background: '#eff6ff',
                          borderRadius: '6px',
                          color: '#005EB8',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginRight: 'var(--space-8)'
                        }}>
                          {file.type?.includes('pdf') ? 'PDF' : 'FILE'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size"> ({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUpload(name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Non-Clinical Questionnaire Questions */}
          {!isClinical && (
            <>
              {/* Question 1 */}
              <Controller
                name="goodsServices"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="What goods or services will the supplier provide?"
                    {...field}
                    error={errors.goodsServices?.message}
                    required
                    rows={4}
                    maxLength={500}
                    showCharCount
                    placeholder="Describe the goods or services in detail..."
                  />
                )}
              />

              {/* Question 2 */}
              <Controller
                name="procurementCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Which category best describes this procurement?"
                    {...field}
                    options={procurementCategories}
                    placeholder="Select a category"
                    error={errors.procurementCategory?.message}
                    required
                  />
                )}
              />

              {/* Question 3 */}
              <Input
                label="What is the estimated annual contract value? (£)"
                type="number"
                {...register('annualValue', { valueAsNumber: true })}
                error={errors.annualValue?.message}
                required
                placeholder="e.g., 25000"
                style={{ marginBottom: 'var(--space-16)' }}
              />

              {/* Question 4 */}
              <Controller
                name="frameworkAgreement"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    label="Is there an existing framework agreement that could be used?"
                    name="frameworkAgreement"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'unknown', label: 'Unknown' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.frameworkAgreement?.message}
                    required
                    horizontal
                  />
                )}
              />

              {/* Question 5 */}
              <Controller
                name="supplierReason"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="Why is this specific supplier required?"
                    {...field}
                    error={errors.supplierReason?.message}
                    required
                    rows={4}
                    maxLength={500}
                    showCharCount
                    placeholder="Explain why this supplier is the best choice..."
                  />
                )}
              />

              {/* Question 6 */}
              <Controller
                name="alternativesConsidered"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    label="Have alternative suppliers been considered?"
                    name="alternativesConsidered"
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.alternativesConsidered?.message}
                    required
                    horizontal
                  />
                )}
              />

              {/* Question 7 */}
              <Controller
                name="additionalNotes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="Additional notes or information (optional)"
                    {...field}
                    error={errors.additionalNotes?.message}
                    rows={4}
                    maxLength={500}
                    showCharCount
                    placeholder="Any additional information relevant to this procurement..."
                  />
                )}
              />

              {/* File Upload Section */}
              <div className="form-group">
                <label className="form-label">
                  Supporting Documents (Optional)
                </label>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-12)' }}>
                  Upload any relevant quotes, proposals, or supporting documents
                </p>

                <div className="questionnaire-upload-area">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleQuestionnaireUpload(Array.from(e.target.files));
                        e.target.value = ''; // Reset input
                      }
                    }}
                    multiple
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ textAlign: 'center', padding: 'var(--space-20)' }}>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#005EB8"
                      strokeWidth="2"
                      style={{ marginBottom: 'var(--space-8)' }}
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)' }}>
                      Click to upload or drag and drop
                    </p>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      PDF, PNG, JPG (Max 5MB each)
                    </span>
                  </div>
                </div>

                {/* Display uploaded files */}
                {Object.keys(questionnaireUploads).length > 0 && (
                  <div className="questionnaire-uploaded-files">
                    {Object.entries(questionnaireUploads).map(([name, file]) => (
                      <div key={name} className="uploaded-file-item">
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          background: '#eff6ff',
                          borderRadius: '6px',
                          color: '#005EB8',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginRight: 'var(--space-8)'
                        }}>
                          {file.type?.includes('pdf') ? 'PDF' : 'FILE'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size"> ({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUpload(name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </form>
      )}
    </Modal>
  );
};

export default QuestionnaireModal;
