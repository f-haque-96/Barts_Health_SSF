/**
 * Section 4: Supplier Details
 * Company name, address, and contact information
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Textarea, QuestionLabel, NoticeBox, WarningIcon } from '../common';
import { FormNavigation } from '../layout';
import { section4Schema } from '../../utils/validation';
import { formatPostcode, checkRejectedSuppliers } from '../../utils/helpers';
import useFormStore from '../../stores/formStore';
import useFormNavigation from '../../hooks/useFormNavigation';

const Section4SupplierDetails = () => {
  const { formData, updateFormData, updateMultipleFields } = useFormStore();
  const { handleNext, handlePrev } = useFormNavigation();
  const [rejectionWarning, setRejectionWarning] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(section4Schema),
    defaultValues: {
      companyName: formData.companyName || formData._verifiedCompanyName || '',
      tradingName: formData.tradingName || '',
      registeredAddress: formData.registeredAddress || formData._verifiedAddress || '',
      city: formData.city || formData._verifiedCity || '',
      postcode: formData.postcode || formData._verifiedPostcode || '',
      contactName: formData.contactName || '',
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
      website: formData.website || '',
    },
  });

  const postcode = watch('postcode');
  const companyName = watch('companyName');

  // Check for rejected suppliers when company name changes
  useEffect(() => {
    if (companyName && companyName.length > 3) {
      // Debounce the check to avoid too many lookups
      const timeoutId = setTimeout(() => {
        const result = checkRejectedSuppliers(companyName, formData.nhsEmail);

        if (result.isRejectedSupplier) {
          setRejectionWarning({
            similarity: result.highestSimilarity,
            rejectedSupplierName: result.mostRecentRejection.name,
            rejectionDate: result.mostRecentRejection.rejectionDate,
            hasUserRejection: result.hasUserRejection,
            matchCount: result.matches.length,
          });
        } else {
          setRejectionWarning(null);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      setRejectionWarning(null);
    }
  }, [companyName, formData.nhsEmail]);

  // Auto-populate company name and address from CRN verification if available
  useEffect(() => {
    if (formData._verifiedCompanyName && !formData.companyName) {
      setValue('companyName', formData._verifiedCompanyName);
    }
    if (formData._verifiedAddress && !formData.registeredAddress) {
      setValue('registeredAddress', formData._verifiedAddress);
    }
    if (formData._verifiedCity && !formData.city) {
      setValue('city', formData._verifiedCity);
    }
    if (formData._verifiedPostcode && !formData.postcode) {
      setValue('postcode', formData._verifiedPostcode);
    }
  }, [formData._verifiedCompanyName, formData._verifiedAddress, formData._verifiedCity, formData._verifiedPostcode, formData.companyName, formData.registeredAddress, formData.city, formData.postcode, setValue]);

  // Format postcode as user types
  useEffect(() => {
    if (postcode) {
      const formatted = formatPostcode(postcode);
      if (formatted !== postcode) {
        setValue('postcode', formatted);
      }
    }
  }, [postcode, setValue]);

  const onSubmit = (data) => {
    updateMultipleFields(data);
    handleNext();
  };

  const handleFieldChange = (field, value) => {
    updateFormData(field, value);
  };

  return (
    <section className="form-section active" id="section-4">
      <h3>Supplier Details</h3>
      <p className="section-subtitle">
        Please provide the supplier's company details and primary contact information.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={<QuestionLabel section="4" question="1">Company Name</QuestionLabel>}
          name="companyName"
          {...register('companyName')}
          onChange={(e) => {
            register('companyName').onChange(e);
            handleFieldChange('companyName', e.target.value);
          }}
          error={errors.companyName?.message}
          required
          placeholder="Enter company name"
        />

        {/* Rejected Supplier Warning */}
        {rejectionWarning && (
          <NoticeBox type="error" style={{ marginBottom: 'var(--space-16)' }}>
            <h4 style={{ marginTop: 0, fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WarningIcon size={18} color="#dc2626" />
              Previously Rejected Supplier Detected
            </h4>
            <p style={{ marginBottom: '0.75rem' }}>
              This supplier name is <strong>{rejectionWarning.similarity}% similar</strong> to{' '}
              <strong>&quot;{rejectionWarning.rejectedSupplierName}&quot;</strong>, which was
              previously rejected
              {rejectionWarning.hasUserRejection ? ' by you' : ''}.
            </p>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#991b1b' }}>
              <strong>This supplier has been flagged in our system.</strong> Attempting to set up a
              previously rejected supplier may require additional justification and will be subject
              to heightened scrutiny during the approval process.
            </p>
            {rejectionWarning.matchCount > 1 && (
              <p style={{ marginBottom: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>
                {rejectionWarning.matchCount} similar rejected supplier(s) found in total.
              </p>
            )}
            {rejectionWarning.hasUserRejection && (
              <p
                style={{
                  marginTop: '0.75rem',
                  marginBottom: 0,
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Note:</strong> Our records show you previously attempted to set up this or
                a similar supplier. Please ensure you have addressed the issues from the previous
                rejection before proceeding.
              </p>
            )}
          </NoticeBox>
        )}

        <Input
          label={<QuestionLabel section="4" question="2">Trading Name (if different)</QuestionLabel>}
          name="tradingName"
          {...register('tradingName')}
          onChange={(e) => {
            register('tradingName').onChange(e);
            handleFieldChange('tradingName', e.target.value);
          }}
          error={errors.tradingName?.message}
          placeholder="Enter trading name"
        />

        <Textarea
          label={<QuestionLabel section="4" question="3">Registered Address</QuestionLabel>}
          name="registeredAddress"
          value={watch('registeredAddress') || ''}
          {...register('registeredAddress')}
          onChange={(e) => {
            register('registeredAddress').onChange(e);
            handleFieldChange('registeredAddress', e.target.value);
          }}
          error={errors.registeredAddress?.message}
          required
          rows={3}
          maxLength={300}
          placeholder="Enter full registered address"
        />

        <div className="form-row">
          <Input
            label={<QuestionLabel section="4" question="4">City</QuestionLabel>}
            name="city"
            {...register('city')}
            onChange={(e) => {
              register('city').onChange(e);
              handleFieldChange('city', e.target.value);
            }}
            error={errors.city?.message}
            required
            placeholder="e.g., London"
          />

          <Input
            label={<QuestionLabel section="4" question="5">Postcode</QuestionLabel>}
            name="postcode"
            {...register('postcode')}
            onChange={(e) => {
              register('postcode').onChange(e);
              handleFieldChange('postcode', e.target.value);
            }}
            error={errors.postcode?.message}
            required
            placeholder="e.g., EC1A 1BB"
          />
        </div>

        <div style={{ marginTop: 'var(--space-32)', paddingTop: 'var(--space-24)', borderTop: '2px solid var(--color-border)' }}>
          <h4 style={{ marginBottom: 'var(--space-16)' }}>Primary Contact</h4>

          <Input
            label={<QuestionLabel section="4" question="6">Contact Name</QuestionLabel>}
            name="contactName"
            {...register('contactName')}
            onChange={(e) => {
              register('contactName').onChange(e);
              handleFieldChange('contactName', e.target.value);
            }}
            error={errors.contactName?.message}
            required
            placeholder="Enter primary contact name"
          />

          <div className="form-row">
            <Input
              label={<QuestionLabel section="4" question="7">Contact Email</QuestionLabel>}
              name="contactEmail"
              type="email"
              {...register('contactEmail')}
              onChange={(e) => {
                register('contactEmail').onChange(e);
                handleFieldChange('contactEmail', e.target.value);
              }}
              error={errors.contactEmail?.message}
              required
              placeholder="contact@supplier.com"
            />

            <Input
              label={<QuestionLabel section="4" question="8">Contact Phone</QuestionLabel>}
              name="contactPhone"
              type="tel"
              {...register('contactPhone')}
              onChange={(e) => {
                register('contactPhone').onChange(e);
                handleFieldChange('contactPhone', e.target.value);
              }}
              error={errors.contactPhone?.message}
              required
              placeholder="e.g., 020 7377 7000"
            />
          </div>

          <Input
            label={<QuestionLabel section="4" question="9">Website (Optional)</QuestionLabel>}
            name="website"
            type="url"
            {...register('website')}
            onChange={(e) => {
              register('website').onChange(e);
              handleFieldChange('website', e.target.value);
            }}
            error={errors.website?.message}
            placeholder="https://www.supplier.com"
          />
        </div>

        <FormNavigation
          onNext={handleSubmit(onSubmit)}
          onPrev={handlePrev}
        />
      </form>
    </section>
  );
};

export default Section4SupplierDetails;
