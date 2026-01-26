/**
 * Section 1: Requester Information
 * Collects contact details of the person requesting supplier setup
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, QuestionLabel, InfoIcon } from '../common';
import { FormNavigation } from '../layout';
import { section1Schema } from '../../utils/validation';
import { formatPhoneNumber } from '../../utils/helpers';
import useFormStore from '../../stores/formStore';
import useFormNavigation from '../../hooks/useFormNavigation';

const Section1RequesterInfo = () => {
  const { formData, updateFormData, updateMultipleFields } = useFormStore();
  const { handleNext } = useFormNavigation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(section1Schema),
    defaultValues: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      jobTitle: formData.jobTitle || '',
      department: formData.department || '',
      nhsEmail: formData.nhsEmail || '',
      phoneNumber: formData.phoneNumber || '',
    },
  });

  const phoneNumber = watch('phoneNumber');

  // Format phone number as user types
  React.useEffect(() => {
    if (phoneNumber) {
      const formatted = formatPhoneNumber(phoneNumber);
      if (formatted !== phoneNumber) {
        setValue('phoneNumber', formatted);
      }
    }
  }, [phoneNumber, setValue]);

  const onSubmit = (data) => {
    // Update form store with all data
    updateMultipleFields(data);

    // Move to next section
    handleNext();
  };

  // Update form store on field changes (for auto-save)
  const handleFieldChange = (field, value) => {
    updateFormData(field, value);
  };

  return (
    <section className="form-section active" id="section-1">
      <h3>Requester Information</h3>
      <p className="section-subtitle">
        Please provide your contact details as the person requesting this supplier setup.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name Fields */}
        <div className="form-row">
          <Input
            label={<QuestionLabel section="1" question="1">First Name</QuestionLabel>}
            name="firstName"
            {...register('firstName')}
            onChange={(e) => {
              register('firstName').onChange(e);
              handleFieldChange('firstName', e.target.value);
            }}
            error={errors.firstName?.message}
            required
            placeholder="Enter your first name"
          />

          <Input
            label={<QuestionLabel section="1" question="2">Last Name</QuestionLabel>}
            name="lastName"
            {...register('lastName')}
            onChange={(e) => {
              register('lastName').onChange(e);
              handleFieldChange('lastName', e.target.value);
            }}
            error={errors.lastName?.message}
            required
            placeholder="Enter your last name"
          />
        </div>

        {/* Job Title and Department */}
        <div className="form-row">
          <Input
            label={<QuestionLabel section="1" question="3">Job Title</QuestionLabel>}
            name="jobTitle"
            {...register('jobTitle')}
            onChange={(e) => {
              register('jobTitle').onChange(e);
              handleFieldChange('jobTitle', e.target.value);
            }}
            error={errors.jobTitle?.message}
            required
            placeholder="e.g., Clinical Manager"
          />

          <Input
            label={<QuestionLabel section="1" question="4">Department</QuestionLabel>}
            name="department"
            {...register('department')}
            onChange={(e) => {
              register('department').onChange(e);
              handleFieldChange('department', e.target.value);
            }}
            error={errors.department?.message}
            required
            placeholder="e.g., Surgery"
          />
        </div>

        {/* Contact Details */}
        <div className="form-row">
          <div style={{ flex: 1 }}>
            <Input
              label={<QuestionLabel section="1" question="5">NHS Email Address</QuestionLabel>}
              name="nhsEmail"
              type="email"
              {...register('nhsEmail')}
              onChange={(e) => {
                register('nhsEmail').onChange(e);
                handleFieldChange('nhsEmail', e.target.value);
              }}
              error={errors.nhsEmail?.message}
              required
              placeholder="firstname.lastname@nhs.net"
            />
            <div className="info-box">
              <span className="info-icon"><InfoIcon size={16} color="#3b82f6" /></span>
              <span>This must be your official NHS email address (ending in @nhs.net)</span>
            </div>
          </div>

          <Input
            label={<QuestionLabel section="1" question="6">Phone Number</QuestionLabel>}
            name="phoneNumber"
            type="tel"
            {...register('phoneNumber')}
            onChange={(e) => {
              register('phoneNumber').onChange(e);
              handleFieldChange('phoneNumber', e.target.value);
            }}
            error={errors.phoneNumber?.message}
            required
            placeholder="e.g., 020 7377 7000"
          />
        </div>

        {/* Navigation */}
        <FormNavigation
          onNext={handleSubmit(onSubmit)}
          showPrev={false}
        />
      </form>
    </section>
  );
};

export default Section1RequesterInfo;
