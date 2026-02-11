/**
 * Section 7: Review & Submit
 * Summary of all form data and final submission
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pdf } from '@react-pdf/renderer';
import { Checkbox, Button, NoticeBox, QuestionLabel, CheckIcon, WarningIcon, VerificationBadge } from '../common';
import { FormNavigation } from '../layout';
import { section7Schema } from '../../utils/validation';
import { formatCurrency, scrollToFirstError } from '../../utils/helpers';
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

  // Get company status from verification data
  const companyStatus = verificationData?.status || null;

  // Companies House URL
  const companiesHouseUrl = `https://find-and-update.company-information.service.gov.uk/company/${crn.replace(/\s/g, '').toUpperCase()}`;

  // Wrap badge in link to Companies House
  const badge = <VerificationBadge companyStatus={companyStatus} size="small" showLabel={true} />;

  return (
    <a
      href={companiesHouseUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', cursor: 'pointer' }}
      title="View on Companies House (opens in new tab)"
    >
      {badge}
    </a>
  );
};

const ReviewCard = ({ title, children, sectionNumber }) => {
  const { goToSection, getMissingFields, formData } = useFormStore();
  const missingFields = getMissingFields(sectionNumber);
  const isIncomplete = missingFields.length > 0;

  // Determine border color and background
  const getBorderColor = () => {
    if (isIncomplete) return '#DA291C';
    return 'var(--color-border)';
  };

  const getBackgroundColor = () => {
    return 'var(--color-surface)';
  };

  const getHeaderColor = () => {
    if (isIncomplete) return '#DA291C';
    return 'var(--nhs-blue)';
  };

  return (
    <div
      className={isIncomplete ? 'section-card section-card--incomplete' : 'section-card'}
      style={{
        padding: 'var(--space-24)',
        borderRadius: 'var(--radius-base)',
        border: `2px solid ${getBorderColor()}`,
        marginBottom: 'var(--space-16)',
        backgroundColor: getBackgroundColor(),
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
        <h4 className={isIncomplete ? 'section-card-header' : ''} style={{ margin: 0, color: getHeaderColor() }}>
          Section {sectionNumber}: {title}
          {isIncomplete && <span style={{ marginLeft: '8px', fontSize: '0.9rem', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#DA291C" /> Incomplete</span>}
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

  // ACC-02: Screen reader announcements for form status changes
  const [announcement, setAnnouncement] = useState('');

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

  // ACC-02: Announce form submission success to screen readers
  useEffect(() => {
    if (submitSuccess) {
      setAnnouncement('Form submitted successfully! Thank you for your submission.');
    }
  }, [submitSuccess]);

  // ACC-02: Announce form submission errors to screen readers
  useEffect(() => {
    if (submitError) {
      setAnnouncement(`Error submitting form: ${submitError}`);
    }
  }, [submitError]);

  // ACC-02: Announce validation errors to screen readers
  useEffect(() => {
    if (missingFields.length > 0) {
      setAnnouncement(`Form validation error: ${missingFields.length} required field${missingFields.length === 1 ? '' : 's'} must be completed before submission.`);
    } else if (announcement.includes('validation error')) {
      // Clear validation error announcement when all fields are complete
      setAnnouncement('All required fields completed. Form is ready to submit.');
    }
  }, [missingFields.length]);

  const canSubmit = canSubmitForm() && finalAcknowledgement && canSubmitWithUploads;

  // ACC-03: Handle form validation errors from react-hook-form
  const onError = (errors) => {
    console.error('Form validation errors:', errors);
    scrollToFirstError();
  };

  const onSubmit = async () => {
    // Double-check validation before submitting
    const missing = getMissingFields('all');

    if (missing.length > 0) {
      alert('Please complete all required fields and uploads before submitting:\n\n' + missing.join('\n'));
      // ACC-03: Auto-focus on first error field for accessibility
      scrollToFirstError();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare form data for submission
      const allData = getAllFormData();

      // Retrieve questionnaire uploads from localStorage (if they exist)
      let questionnaireUploads = {};
      try {
        const storedQuestionnaire = localStorage.getItem('questionnaireSubmission');
        if (storedQuestionnaire) {
          const parsedQuestionnaire = JSON.parse(storedQuestionnaire);
          questionnaireUploads = parsedQuestionnaire.uploads || parsedQuestionnaire.uploadedFiles || {};
        }
      } catch (error) {
        console.error('[Section7] Error loading questionnaire uploads:', error);
      }

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
        formData: {
          ...allData.formData,
          // Include final acknowledgement from Section 7 form
          finalAcknowledgement: finalAcknowledgement,
        },
        uploadedFiles: allData.uploadedFiles,
        // Include questionnaire uploads from the modal
        questionnaireUploads: questionnaireUploads,
        questionnaireData: {
          uploads: questionnaireUploads,
          uploadedFiles: questionnaireUploads,
        },
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
      console.error('Submission error:', error);
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

    // Retrieve questionnaire uploads from localStorage (if they exist)
    let questionnaireUploads = {};
    try {
      const storedQuestionnaire = localStorage.getItem('questionnaireSubmission');
      if (storedQuestionnaire) {
        const parsedQuestionnaire = JSON.parse(storedQuestionnaire);
        questionnaireUploads = parsedQuestionnaire.uploads || parsedQuestionnaire.uploadedFiles || parsedQuestionnaire.questionnaireUploads || {};
      }
    } catch (error) {
      console.error('[Preview] Error loading questionnaire uploads:', error);
    }

    let currentSubmissionId = testSubmissionId;

    // Create new submission only if one doesn't exist
    if (!currentSubmissionId) {
      currentSubmissionId = `PREVIEW-TEST-${Date.now()}`;
      setTestSubmissionId(currentSubmissionId);
      localStorage.setItem('current-test-submission-id', currentSubmissionId);

      const newSubmission = {
        id: currentSubmissionId,
        submissionId: currentSubmissionId,
        formData: {
          ...allData.formData,
          // Include final acknowledgement from Section 7 form
          finalAcknowledgement: finalAcknowledgement,
        },
        uploadedFiles: allData.uploadedFiles,
        questionnaireUploads: questionnaireUploads,
        questionnaireData: {
          uploads: questionnaireUploads,
          uploadedFiles: questionnaireUploads
        },
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
          formData: {
            ...allData.formData,
            // Include final acknowledgement from Section 7 form
            finalAcknowledgement: finalAcknowledgement,
          },
          uploadedFiles: allData.uploadedFiles,
          questionnaireUploads: questionnaireUploads,
          questionnaireData: {
            uploads: questionnaireUploads,
            uploadedFiles: questionnaireUploads
          },
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
    // Special handling for pages with different URL patterns
    if (type === 'respond') {
      window.open(`/respond/${currentSubmissionId}`, '_blank');
    } else if (type === 'contract') {
      window.open(`/contract-drafter/${currentSubmissionId}`, '_blank');
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

        <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'center', marginTop: 'var(--space-32)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={handleSubmitAnother}>
            Submit Another Form
          </Button>
          {!import.meta.env.PROD && (
            <Button variant="outline" onClick={() => window.close()}>
              Close
            </Button>
          )}
        </div>

        {/* Development Testing Tools - Shown after successful submission in dev mode */}
        {!import.meta.env.PROD && (
          <div style={{
            marginTop: 'var(--space-24)',
            padding: 'var(--space-16)',
            backgroundColor: '#e0f2fe',
            borderRadius: 'var(--radius-base)',
            border: '2px solid #0284c7',
          }}>
            <h4 style={{ margin: '0 0 var(--space-8) 0', fontSize: 'var(--font-size-md)', color: '#075985', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛠️ Development Testing Tools
            </h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#075985', marginBottom: 'var(--space-12)', fontWeight: '500' }}>
              These buttons are automatically available in development mode. They will NOT appear in production builds.
            </p>
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
              Test authorisation workflow: PBP → Procurement → OPW → Contract Drafter → AP Control
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
              <Button variant="outline" onClick={() => handlePreviewAuthorisation('contract')} style={{ color: '#059669', borderColor: '#059669' }}>
                4. Contract Drafter
              </Button>
              <Button variant="outline" onClick={() => handlePreviewAuthorisation('ap')} style={{ color: 'var(--nhs-blue)' }}>
                5. AP Control
              </Button>
              <Button variant="outline" onClick={() => handlePreviewAuthorisation('respond')} style={{ color: '#ca8a04', borderColor: '#ca8a04', backgroundColor: '#fefce8' }}>
                6. Requester
              </Button>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', marginTop: 'var(--space-8)', marginBottom: 0 }}>
              Use "6. Requester" to view the requester's perspective when PBP requests more information
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="form-section active" id="section-7">
      {/* ACC-02: Visually hidden live region for screen reader announcements */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        {announcement}
      </div>

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
        {/* Q2.2 Personal Service Status (moved from Q2.5) */}
        <ReviewItem
          label="2.2 Is the supplier providing a personal service?"
          value={formData.soleTraderStatus}
          badge={formData.soleTraderStatus === 'yes' && (
            <span style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.85em',
              fontWeight: 'bold',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              border: '1px solid #93c5fd'
            }}>
              OPW RELEVANT
            </span>
          )}
        />
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

        {/* CRN - Limited Company */}
        {formData.crn && formData.supplierType === 'limited_company' && (
          <ReviewItem
            label="CRN"
            value={formData.crn}
            badge={<CRNStatusBadge crn={formData.crn} verificationData={formData.crnVerification} />}
          />
        )}

        {/* Limited Company Interest - Only show for Limited Company */}
        {formData.supplierType === 'limited_company' && formData.limitedCompanyInterest && (
          <ReviewItem
            label="Does the supplier have more than 5% interest in this Limited Company?"
            value={formData.limitedCompanyInterest}
            badge={formData.limitedCompanyInterest === 'yes' && (
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                fontWeight: 'bold',
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7'
              }}>
                IR35 RELEVANT
              </span>
            )}
          />
        )}

        {/* CRN - Partnership */}
        {formData.crn && formData.supplierType === 'partnership' && (
          <ReviewItem
            label="CRN"
            value={formData.crn}
            badge={<CRNStatusBadge crn={formData.crn} verificationData={formData.crnVerification} />}
          />
        )}

        {/* Partnership Interest - Only show for Partnership */}
        {formData.supplierType === 'partnership' && formData.partnershipInterest && (
          <ReviewItem
            label="Does the supplier have more than 60% interest in this Partnership?"
            value={formData.partnershipInterest}
            badge={formData.partnershipInterest === 'yes' && (
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                fontWeight: 'bold',
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7'
              }}>
                IR35 RELEVANT
              </span>
            )}
          />
        )}

        {/* CRN - Charity (registered with Companies House) */}
        {formData.crnCharity && formData.supplierType === 'charity' && (
          <ReviewItem
            label="CRN"
            value={formData.crnCharity}
            badge={<CRNStatusBadge crn={formData.crnCharity} verificationData={formData.crnVerification} />}
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
        {formData.nameOnAccount && <ReviewItem label="Name on Account" value={formData.nameOnAccount} />}
        {formData.sortCode && <ReviewItem label="Sort Code" value={formData.sortCode} />}
        {formData.accountNumber && <ReviewItem label="Account Number" value={formData.accountNumber} />}
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

      {/* Final Acknowledgement */}
      <form onSubmit={handleSubmit(onSubmit, onError)}>
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
          onNext={handleSubmit(onSubmit, onError)}
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
