/**
 * Section 3: Supplier Classification
 * CRN verification, supplier type selection, and classification details
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, RadioGroup, Select, FileUpload, NoticeBox, Button, Tooltip, QuestionLabel, CheckIcon, InfoIcon, WarningIcon, LockIcon, ExternalLinkIcon, VerificationBadge } from '../common';
import { SupplierIcon } from '../common/SupplierTypeIcons';
import { FormNavigation } from '../layout';
import {
  section3BaseSchema,
  getLimitedCompanySchema,
  getPartnershipSchema,
  getCharitySchema,
  getSoleTraderSchema,
  getPublicSectorSchema,
} from '../../utils/validation';
import {
  SUPPLIER_TYPES,
  EMPLOYEE_COUNTS,
  PAYMENT_METHODS,
  PUBLIC_SECTOR_TYPES,
  FILE_UPLOAD_CONFIG,
} from '../../utils/constants';
import useFormStore from '../../stores/formStore';
import useFormNavigation from '../../hooks/useFormNavigation';
import useCRNVerification from '../../hooks/useCRNVerification';
import clsx from 'clsx';

const Section3Classification = () => {
  const { formData, updateFormData, updateMultipleFields, uploadedFiles, setUploadedFile, removeUploadedFile } = useFormStore();
  const { handleNext, handlePrev } = useFormNavigation();
  const { verify, status: crnStatus, companyData, error: crnError, isVerifying, isValid, isCorsBlocked, isNotFound } = useCRNVerification();

  const [selectedSupplierType, setSelectedSupplierType] = useState(formData.supplierType || '');
  const [companiesHouseValue, setCompaniesHouseValue] = useState(formData.companiesHouseRegistered || '');
  const [idConsentGiven, setIdConsentGiven] = useState(formData.idConsentGiven || false);

  // Dynamically create validation schema based on supplier type
  // Using useMemo ensures the schema updates when dependencies change
  const validationSchema = React.useMemo(() => {
    if (!selectedSupplierType) return section3BaseSchema;

    switch (selectedSupplierType) {
      case 'limited_company':
        return getLimitedCompanySchema();
      case 'partnership':
        return getPartnershipSchema(companiesHouseValue);
      case 'charity':
        return getCharitySchema(companiesHouseValue);
      case 'sole_trader':
        return getSoleTraderSchema();
      case 'public_sector':
        return getPublicSectorSchema();
      default:
        return section3BaseSchema;
    }
  }, [selectedSupplierType, companiesHouseValue]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      companiesHouseRegistered: formData.companiesHouseRegistered || '',
      supplierType: formData.supplierType || '',
      crn: formData.crn || '',
      crnCharity: formData.crnCharity || '',
      charityNumber: formData.charityNumber || '',
      idType: formData.idType || '',
      organisationType: formData.organisationType || '',
      annualValue: formData.annualValue ?? '',
      employeeCount: formData.employeeCount || '',
      limitedCompanyInterest: formData.limitedCompanyInterest || '',
      partnershipInterest: formData.partnershipInterest || '',
    },
  });

  const watchCH = watch('companiesHouseRegistered');
  const watchSupplierType = watch('supplierType');
  const watchCRN = watch('crn');
  const watchCRNCharity = watch('crnCharity');
  const watchIdType = watch('idType');
  const watchLimitedCompanyInterest = watch('limitedCompanyInterest');
  const watchPartnershipInterest = watch('partnershipInterest');

  // Update states when form values change
  useEffect(() => {
    if (watchCH) {
      setCompaniesHouseValue(watchCH);
      updateFormData('companiesHouseRegistered', watchCH);

      // If changing to "Yes", clear sole trader ID consent
      if (watchCH === 'yes') {
        setIdConsentGiven(false);
      }
    }
  }, [watchCH, updateFormData]);

  useEffect(() => {
    if (watchSupplierType) {
      setSelectedSupplierType(watchSupplierType);
      updateFormData('supplierType', watchSupplierType);
    }
  }, [watchSupplierType, updateFormData]);

  // Sync limitedCompanyInterest to formData
  useEffect(() => {
    if (watchLimitedCompanyInterest !== undefined && watchLimitedCompanyInterest !== '') {
      updateFormData('limitedCompanyInterest', watchLimitedCompanyInterest);
    }
  }, [watchLimitedCompanyInterest, updateFormData]);

  // Sync partnershipInterest to formData
  useEffect(() => {
    if (watchPartnershipInterest !== undefined && watchPartnershipInterest !== '') {
      updateFormData('partnershipInterest', watchPartnershipInterest);
    }
  }, [watchPartnershipInterest, updateFormData]);

  // Clear errors for hidden fields when supplier type changes
  // Do NOT call trigger() here — it would validate all fields immediately,
  // showing errors before the user has interacted with them (overriding mode: 'onBlur')
  useEffect(() => {
    if (selectedSupplierType) {
      clearErrors(['limitedCompanyInterest', 'partnershipInterest', 'crn', 'crnCharity', 'charityNumber', 'organisationType', 'idType']);
    }
  }, [selectedSupplierType, validationSchema, clearErrors]);

  // Verify CRN when it changes (for limited company and partnership)
  useEffect(() => {
    if ((watchSupplierType === 'limited_company' || watchSupplierType === 'partnership') && watchCRN && watchCRN.length >= 7) {
      const timer = setTimeout(() => {
        verify(watchCRN);
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [watchCRN, watchSupplierType, verify]);

  // Verify CRN when it changes (for charity with Companies House registration)
  useEffect(() => {
    if (watchSupplierType === 'charity' && companiesHouseValue === 'yes' && watchCRNCharity && watchCRNCharity.length >= 7) {
      const timer = setTimeout(() => {
        verify(watchCRNCharity);
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [watchCRNCharity, watchSupplierType, companiesHouseValue, verify]);

  // Auto-populate company name and address if CRN is verified
  // CRITICAL: Save verification data for ALL statuses (active, dissolved, liquidated, etc.)
  useEffect(() => {
    if (companyData && companyData.name) {
      // Save verified company data for Section 4 auto-population
      updateFormData('_verifiedCompanyName', companyData.name);
      updateFormData('_verifiedAddress', companyData.registeredAddress || '');
      updateFormData('_verifiedCity', companyData.city || '');
      updateFormData('_verifiedPostcode', companyData.postcode || '');
      updateFormData('_verifiedCounty', companyData.county || '');

      // CRITICAL: Always save verification data with status (active, dissolved, liquidated, etc.)
      // This ensures Section 7, review pages, and PDF display the correct badge
      updateFormData('crnVerification', companyData);
    }
  }, [companyData, updateFormData]);

  const onSubmit = (data) => {
    // Validate required files based on supplier type
    const requiredFiles = [];

    if (data.supplierType === 'sole_trader') {
      if (data.idType === 'passport' && !uploadedFiles.passportPhoto) {
        requiredFiles.push('Passport Photo Page');
      }
      if (data.idType === 'driving_licence') {
        if (!uploadedFiles.licenceFront) requiredFiles.push('Driving Licence Front');
        if (!uploadedFiles.licenceBack) requiredFiles.push('Driving Licence Back');
      }
    }

    if (requiredFiles.length > 0) {
      alert(`Please upload the following required documents:\n${requiredFiles.join('\n')}`);
      return;
    }

    // Update form store
    updateMultipleFields(data);

    // Move to next section
    handleNext();
  };

  const handleFieldChange = (field, value) => {
    updateFormData(field, value);
    // Re-validate field if it already has an error (clears error once input is correct)
    if (errors[field]) {
      trigger(field);
    }
  };

  // Get available supplier types based on Companies House registration
  const getAvailableSupplierTypes = () => {
    if (!companiesHouseValue) return [];

    const types = [];

    if (companiesHouseValue === 'yes') {
      types.push(SUPPLIER_TYPES.LIMITED_COMPANY);
      types.push(SUPPLIER_TYPES.PARTNERSHIP);
      types.push(SUPPLIER_TYPES.CHARITY);
    } else {
      types.push(SUPPLIER_TYPES.PARTNERSHIP);
      types.push(SUPPLIER_TYPES.CHARITY);
      types.push(SUPPLIER_TYPES.SOLE_TRADER);
      types.push(SUPPLIER_TYPES.PUBLIC_SECTOR);
    }

    return types;
  };

  return (
    <section className="form-section active" id="section-3">
      <h3>Supplier Classification</h3>
      <p className="section-subtitle">
        Please provide information about the supplier's legal structure and classification.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Companies House Registration */}
        <Controller
          name="companiesHouseRegistered"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label={<QuestionLabel section="3" question="1">Is the supplier registered on Companies House?</QuestionLabel>}
              name="companiesHouseRegistered"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={errors.companiesHouseRegistered?.message}
              required
              horizontal
            />
          )}
        />

        {/* Button BELOW the radios */}
        <div className="companies-house-link">
          <Tooltip content="Opens the Companies House website where you can search for company registration details">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://find-and-update.company-information.service.gov.uk/', '_blank')}
              type="button"
            >
              Check Companies House <ExternalLinkIcon size={12} color="currentColor" style={{ marginLeft: '4px' }} />
            </Button>
          </Tooltip>
        </div>

        {/* Supplier Type Cards */}
        {companiesHouseValue && (
          <>
            <div className="form-group">
              <label className="form-label">
                <QuestionLabel section="3" question="2">Supplier Type</QuestionLabel>
                <span className="required-asterisk">*</span>
              </label>

              <div className="supplier-type-cards">
                {getAvailableSupplierTypes().map((type) => (
                  <Tooltip key={type.value} content={type.tooltip}>
                    <div
                      className={clsx(
                        'supplier-card',
                        selectedSupplierType === type.value && 'selected'
                      )}
                      onClick={() => {
                        setValue('supplierType', type.value);
                        setSelectedSupplierType(type.value);
                        handleFieldChange('supplierType', type.value);

                        // Clear CRN only for types that don't use it
                        // Limited Company and Partnership both use CRN when Companies House = yes
                        if (!['limited_company', 'partnership'].includes(type.value) && companiesHouseValue !== 'yes') {
                          setValue('crn', '');
                          clearErrors('crn');
                          handleFieldChange('crn', '');
                        }

                        // Clear charity-specific fields
                        if (type.value !== 'charity') {
                          setValue('charityNumber', '');
                          setValue('crnCharity', '');
                          clearErrors('charityNumber');
                          clearErrors('crnCharity');
                          handleFieldChange('charityNumber', '');
                          handleFieldChange('crnCharity', '');
                        }

                        // Clear public sector organisation type
                        if (type.value !== 'public_sector') {
                          setValue('organisationType', '');
                          clearErrors('organisationType');
                          handleFieldChange('organisationType', '');
                        }

                        // Clear sole trader ID fields
                        if (type.value !== 'sole_trader') {
                          setValue('idType', '');
                          clearErrors('idType');
                          handleFieldChange('idType', '');
                        }

                        // Clear limited company interest field (but keep CRN)
                        if (type.value !== 'limited_company') {
                          setValue('limitedCompanyInterest', '');
                          clearErrors('limitedCompanyInterest');
                          handleFieldChange('limitedCompanyInterest', '');
                        }

                        // Clear partnership interest field (but keep CRN)
                        if (type.value !== 'partnership') {
                          setValue('partnershipInterest', '');
                          clearErrors('partnershipInterest');
                          handleFieldChange('partnershipInterest', '');
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setValue('supplierType', type.value);
                          setSelectedSupplierType(type.value);
                          handleFieldChange('supplierType', type.value);

                          // Clear CRN only for types that don't use it
                          // Limited Company and Partnership both use CRN when Companies House = yes
                          if (!['limited_company', 'partnership'].includes(type.value) && companiesHouseValue !== 'yes') {
                            setValue('crn', '');
                            clearErrors('crn');
                            handleFieldChange('crn', '');
                          }

                          // Clear charity-specific fields
                          if (type.value !== 'charity') {
                            setValue('charityNumber', '');
                            setValue('crnCharity', '');
                            clearErrors('charityNumber');
                            clearErrors('crnCharity');
                            handleFieldChange('charityNumber', '');
                            handleFieldChange('crnCharity', '');
                          }

                          // Clear public sector organisation type
                          if (type.value !== 'public_sector') {
                            setValue('organisationType', '');
                            clearErrors('organisationType');
                            handleFieldChange('organisationType', '');
                          }

                          // Clear sole trader ID fields
                          if (type.value !== 'sole_trader') {
                            setValue('idType', '');
                            clearErrors('idType');
                            handleFieldChange('idType', '');
                          }

                          // Clear limited company interest field (but keep CRN)
                          if (type.value !== 'limited_company') {
                            setValue('limitedCompanyInterest', '');
                            clearErrors('limitedCompanyInterest');
                            handleFieldChange('limitedCompanyInterest', '');
                          }

                          // Clear partnership interest field (but keep CRN)
                          if (type.value !== 'partnership') {
                            setValue('partnershipInterest', '');
                            clearErrors('partnershipInterest');
                            handleFieldChange('partnershipInterest', '');
                          }
                        }
                      }}
                    >
                      <div className="card-icon">
                        <SupplierIcon type={type.value} size={48} color="var(--nhs-blue)" />
                      </div>
                      <div className="card-title">{type.label}</div>
                      <div className="card-description">{type.description}</div>
                    </div>
                  </Tooltip>
                ))}
              </div>

              {errors.supplierType && (
                <span className="error-message">{errors.supplierType.message}</span>
              )}
            </div>
          </>
        )}

        {/* CRN Field - Only show if Companies House registered AND supplier type is limited_company or partnership */}
        {companiesHouseValue === 'yes' && (selectedSupplierType === 'limited_company' || selectedSupplierType === 'partnership') && (
          <>
            <div className="form-group">
              <Input
                label={<QuestionLabel section="3" question="3">Company Registration Number (CRN)</QuestionLabel>}
                name="crn"
                {...register('crn')}
                onChange={(e) => {
                  register('crn').onChange(e);
                  handleFieldChange('crn', e.target.value);
                }}
                error={errors.crn?.message}
                required
                placeholder="e.g., 12345678"
                maxLength={8}
              />

              {/* CRN Verification Status */}
              {isVerifying && (
                <div style={{ marginTop: 'var(--space-8)', fontSize: 'var(--font-size-sm)', color: 'var(--color-info)' }}>
                  <span className="loading" style={{ width: '14px', height: '14px', marginRight: '8px' }} />
                  Verifying CRN...
                </div>
              )}

              {isValid && companyData && watchCRN && (
                <NoticeBox type="success" style={{ marginTop: 'var(--space-8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckIcon size={14} color="#22c55e" /> Verified:</strong> {companyData.name}
                    </div>
                    <a
                      href={`https://find-and-update.company-information.service.gov.uk/company/${watchCRN.replace(/\s/g, '').toUpperCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                      title="View on Companies House"
                    >
                      <VerificationBadge companyStatus={companyData.status} size="medium" />
                    </a>
                  </div>
                </NoticeBox>
              )}

              {isCorsBlocked && watchCRN && watchCRN.length >= 7 && (
                <NoticeBox type="info" style={{ marginTop: 'var(--space-8)' }}>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><InfoIcon size={14} color="#3b82f6" /> Verification Unavailable:</strong> Unable to verify CRN due to browser restrictions.
                  <br />
                  <small>You can proceed by entering company details manually in the next section. The CRN will still be recorded.</small>
                </NoticeBox>
              )}

              {isNotFound && watchCRN && watchCRN.length >= 7 && (
                <NoticeBox type="warning" style={{ marginTop: 'var(--space-8)' }}>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#f59e0b" /> Company Not Found:</strong> {crnError || 'CRN not found on Companies House.'}
                  <br />
                  <small>Please check the number or enter company details manually in the next section.</small>
                </NoticeBox>
              )}

              {crnStatus === 'invalid' && !isCorsBlocked && !isNotFound && watchCRN && watchCRN.length >= 7 && (
                <NoticeBox type="error" style={{ marginTop: 'var(--space-8)' }}>
                  CRN not found. Please check the number or enter company details manually in the next section.
                </NoticeBox>
              )}

              {crnStatus === 'dissolved' && companyData && watchCRN && (
                <NoticeBox type="warning" style={{ marginTop: 'var(--space-8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#f59e0b" /> Warning:</strong> {companyData.name}
                      <br />
                      <small>This company is dissolved. Please verify with Procurement before proceeding.</small>
                    </div>
                    <a
                      href={`https://find-and-update.company-information.service.gov.uk/company/${watchCRN.replace(/\s/g, '').toUpperCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                      title="View on Companies House"
                    >
                      <VerificationBadge companyStatus={companyData.status} size="medium" />
                    </a>
                  </div>
                </NoticeBox>
              )}
            </div>
          </>
        )}

        {/* Charity: CRN + Charity Number */}
        {selectedSupplierType === 'charity' && (
          <>
            {companiesHouseValue === 'yes' && (
              <div style={{ marginBottom: 'var(--space-16)' }}>
                <Input
                  label="Company Registration Number (CRN)"
                  name="crnCharity"
                  {...register('crnCharity')}
                  onChange={(e) => {
                    register('crnCharity').onChange(e);
                    handleFieldChange('crnCharity', e.target.value);
                  }}
                  error={errors.crnCharity?.message}
                  required
                  placeholder="e.g., 12345678"
                  maxLength={8}
                />

                {/* CRN Verification Status - Same as Limited Company */}
                {isValid && companyData && watchCRNCharity && watchCRNCharity.length >= 7 && (
                  <NoticeBox type="success" style={{ marginTop: 'var(--space-8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckIcon size={14} color="#22c55e" /> Verified:</strong> {companyData.name}
                      </div>
                      <a
                        href={`https://find-and-update.company-information.service.gov.uk/company/${watchCRNCharity.replace(/\s/g, '').toUpperCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                        title="View on Companies House"
                      >
                        <VerificationBadge companyStatus={companyData.status} size="medium" />
                      </a>
                    </div>
                  </NoticeBox>
                )}

                {isCorsBlocked && watchCRNCharity && watchCRNCharity.length >= 7 && (
                  <NoticeBox type="info" style={{ marginTop: 'var(--space-8)' }}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><InfoIcon size={14} color="#3b82f6" /> Verification Unavailable:</strong> Unable to verify CRN due to browser restrictions.
                    <br />
                    <small>You can proceed by entering company details manually in the next section. The CRN will still be recorded.</small>
                  </NoticeBox>
                )}

                {isNotFound && watchCRNCharity && watchCRNCharity.length >= 7 && (
                  <NoticeBox type="warning" style={{ marginTop: 'var(--space-8)' }}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#f59e0b" /> Company Not Found:</strong> {crnError || 'CRN not found on Companies House.'}
                    <br />
                    <small>Please verify the CRN number is correct. You can proceed by entering company details manually in the next section.</small>
                  </NoticeBox>
                )}

                {crnStatus === 'dissolved' && companyData && watchCRNCharity && watchCRNCharity.length >= 7 && (
                  <NoticeBox type="warning" style={{ marginTop: 'var(--space-8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><WarningIcon size={14} color="#f59e0b" /> Company Status:</strong> {companyData.name}
                        <br />
                        <small>This company is dissolved. Please verify with Procurement before proceeding.</small>
                      </div>
                      <a
                        href={`https://find-and-update.company-information.service.gov.uk/company/${watchCRNCharity.replace(/\s/g, '').toUpperCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                        title="View on Companies House"
                      >
                        <VerificationBadge companyStatus={companyData.status} size="medium" />
                      </a>
                    </div>
                  </NoticeBox>
                )}
              </div>
            )}

            <Input
              label="Charity Registration Number"
              name="charityNumber"
              {...register('charityNumber')}
              onChange={(e) => {
                register('charityNumber').onChange(e);
                handleFieldChange('charityNumber', e.target.value);
              }}
              error={errors.charityNumber?.message}
              required
              placeholder="e.g., 1234567"
              maxLength={8}
            />
          </>
        )}

        {/* Sole Trader: ID Upload with Consent - Only show when NOT registered with Companies House */}
        {companiesHouseValue === 'no' && (selectedSupplierType === 'sole_trader' || selectedSupplierType === 'individual') && (
          <div className="id-upload-section">
            <div className="consent-notice">
              <div className="notice-icon"><LockIcon size={24} color="#005EB8" /></div>
              <div className="notice-content">
                <h4>Identification Upload Required</h4>
                <p>As a sole trader, you are required to provide a copy of your passport or driving licence for verification purposes.</p>
                <p className="security-note">
                  <strong>Data Security:</strong> Your identification document will be securely stored only during the approval process.
                  Once your supplier setup is complete, this sensitive document will be <strong>automatically deleted</strong> from our systems.
                </p>
              </div>
            </div>

            <div className="consent-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={idConsentGiven}
                  onChange={(e) => {
                    setIdConsentGiven(e.target.checked);
                    updateFormData('idConsentGiven', e.target.checked); // Persist consent to formData
                  }}
                  required
                />
                <span>
                  I consent to uploading my identification document. I understand that:
                  <ul>
                    <li>My ID will be used solely for verification purposes</li>
                    <li>It will be stored securely during the approval process</li>
                    <li>It will be automatically deleted once my supplier setup is complete</li>
                    <li>Only authorised personnel will have access to view this document</li>
                  </ul>
                </span>
              </label>
            </div>

            {/* Only show file upload after consent is given */}
            {idConsentGiven && (
              <>
                <Controller
                  name="idType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      label={<QuestionLabel section="3" question="4">ID Type</QuestionLabel>}
                      name="idType"
                      options={[
                        { value: 'passport', label: 'Passport' },
                        { value: 'driving_licence', label: 'Driving Licence' },
                      ]}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        handleFieldChange('idType', value);
                      }}
                      error={errors.idType?.message}
                      required
                      horizontal
                    />
                  )}
                />

                {watchIdType === 'passport' && (
                  <FileUpload
                    label="Upload Passport Photo Page"
                    name="passportPhoto"
                    uploadType="image"
                    acceptedTypes={['image/png', 'image/jpeg']}
                    acceptedExtensions={['.png', '.jpg', '.jpeg']}
                    maxSize={FILE_UPLOAD_CONFIG.maxSize}
                    errorMessage="Only PNG or JPEG images are accepted"
                    currentFile={uploadedFiles.passportPhoto}
                    onUpload={(file) => setUploadedFile('passportPhoto', file)}
                    onRemove={() => removeUploadedFile('passportPhoto')}
                    required
                  />
                )}

                {watchIdType === 'driving_licence' && (
                  <>
                    <FileUpload
                      label="Upload Driving Licence (Front)"
                      name="licenceFront"
                      uploadType="image"
                      acceptedTypes={['image/png', 'image/jpeg']}
                      acceptedExtensions={['.png', '.jpg', '.jpeg']}
                      maxSize={FILE_UPLOAD_CONFIG.maxSize}
                      errorMessage="Only PNG or JPEG images are accepted"
                      currentFile={uploadedFiles.licenceFront}
                      onUpload={(file) => setUploadedFile('licenceFront', file)}
                      onRemove={() => removeUploadedFile('licenceFront')}
                      required
                    />

                    <FileUpload
                      label="Upload Driving Licence (Back)"
                      name="licenceBack"
                      uploadType="image"
                      acceptedTypes={['image/png', 'image/jpeg']}
                      acceptedExtensions={['.png', '.jpg', '.jpeg']}
                      maxSize={FILE_UPLOAD_CONFIG.maxSize}
                      errorMessage="Only PNG or JPEG images are accepted"
                      currentFile={uploadedFiles.licenceBack}
                      onUpload={(file) => setUploadedFile('licenceBack', file)}
                      onRemove={() => removeUploadedFile('licenceBack')}
                      required
                    />
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Public Sector: Organisation Type */}
        {selectedSupplierType === 'public_sector' && (
          <Select
            label={<QuestionLabel section="3" question="5">Organisation Type</QuestionLabel>}
            name="organisationType"
            {...register('organisationType')}
            onChange={(e) => {
              register('organisationType').onChange(e);
              handleFieldChange('organisationType', e.target.value);
            }}
            error={errors.organisationType?.message}
            options={PUBLIC_SECTOR_TYPES}
            required
            placeholder="Select organisation type"
          />
        )}

        {/* Common Fields (shown for all types) */}
        {selectedSupplierType && (
          <>
            <div style={{ marginTop: 'var(--space-32)', paddingTop: 'var(--space-24)', borderTop: '2px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: 'var(--space-16)' }}>Financial Classification</h4>

              <Input
                label={<QuestionLabel section="3" question="6">Annual Turnover / Net Assets</QuestionLabel>}
                name="annualValue"
                type="number"
                {...register('annualValue', { valueAsNumber: true })}
                onChange={(e) => {
                  register('annualValue', { valueAsNumber: true }).onChange(e);
                  handleFieldChange('annualValue', parseFloat(e.target.value));
                }}
                error={errors.annualValue?.message}
                required
                placeholder="e.g., 500000"
              />

              <Select
                label={<QuestionLabel section="3" question="7">Number of Employees</QuestionLabel>}
                name="employeeCount"
                {...register('employeeCount')}
                onChange={(e) => {
                  register('employeeCount').onChange(e);
                  handleFieldChange('employeeCount', e.target.value);
                }}
                error={errors.employeeCount?.message}
                options={EMPLOYEE_COUNTS}
                required
                placeholder="Select employee count"
              />

              {/* Q3.8 - Only show for Limited Company */}
              {selectedSupplierType === 'limited_company' && (
                <Controller
                  name="limitedCompanyInterest"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      label={<QuestionLabel section="3" question="8">Does the supplier have more than 5% interest in a Limited Company?</QuestionLabel>}
                      name="limitedCompanyInterest"
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                      ]}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        handleFieldChange('limitedCompanyInterest', value);
                      }}
                      error={errors.limitedCompanyInterest?.message}
                      required
                      horizontal
                    />
                  )}
                />
              )}

              {/* Q3.9 - Only show for Partnership */}
              {selectedSupplierType === 'partnership' && (
                <Controller
                  name="partnershipInterest"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      label={<QuestionLabel section="3" question="9">Does the supplier have more than 60% interest in a Partnership?</QuestionLabel>}
                      name="partnershipInterest"
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                      ]}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        handleFieldChange('partnershipInterest', value);
                      }}
                      error={errors.partnershipInterest?.message}
                      required
                      horizontal
                    />
                  )}
                />
              )}
            </div>
          </>
        )}

        {/* Navigation */}
        <FormNavigation
          onNext={handleSubmit(onSubmit)}
          onPrev={handlePrev}
        />
      </form>
    </section>
  );
};

export default Section3Classification;
