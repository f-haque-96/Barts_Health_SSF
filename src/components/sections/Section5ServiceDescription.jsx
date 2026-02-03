/**
 * Section 5: Service Description & Requirements
 * Service types and detailed description
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox, Textarea, RadioGroup, QuestionLabel } from '../common';
import { FormNavigation } from '../layout';
import { section5Schema } from '../../utils/validation';
import { SERVICE_TYPES } from '../../utils/constants';
import useFormStore from '../../stores/formStore';
import useFormNavigation from '../../hooks/useFormNavigation';

const Section5ServiceDescription = () => {
  const { formData, updateFormData, updateMultipleFields } = useFormStore();
  const { handleNext, handlePrev } = useFormNavigation();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(section5Schema),
    defaultValues: {
      serviceType: formData.serviceType || [],
      serviceDescription: formData.serviceDescription || '',
    },
  });

  const serviceTypes = watch('serviceType') || [];

  const onSubmit = (data) => {
    updateMultipleFields(data);
    handleNext();
  };

  const handleFieldChange = (field, value) => {
    updateFormData(field, value);
  };

  const handleServiceTypeToggle = (typeValue) => {
    const current = serviceTypes || [];
    const updated = current.includes(typeValue)
      ? current.filter((t) => t !== typeValue)
      : [...current, typeValue];

    setValue('serviceType', updated);
    handleFieldChange('serviceType', updated);
  };

  return (
    <section className="form-section active" id="section-5">
      <h3>Service Description & Requirements</h3>
      <p className="section-subtitle">
        Please describe the services or products this supplier will provide.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">
            <QuestionLabel section="5" question="1">Service Type</QuestionLabel>
            <span className="required-asterisk">*</span>
          </label>

          <div className="checkbox-group">
            {SERVICE_TYPES.map((type) => (
              <Checkbox
                key={type.value}
                label={type.label}
                name={`serviceType_${type.value}`}
                checked={serviceTypes.includes(type.value)}
                onChange={() => handleServiceTypeToggle(type.value)}
              />
            ))}
          </div>

          {errors.serviceType && (
            <span className="error-message">{errors.serviceType.message}</span>
          )}
        </div>

        <Controller
          name="serviceDescription"
          control={control}
          render={({ field }) => (
            <Textarea
              label={<QuestionLabel section="5" question="2">Detailed Service Description</QuestionLabel>}
              name="serviceDescription"
              value={field.value}
              onChange={(e) => {
                field.onChange(e);
                handleFieldChange('serviceDescription', e.target.value);
              }}
              onBlur={field.onBlur}
              error={errors.serviceDescription?.message}
              required
              maxLength={350}
              showCharCount
              rows={6}
              placeholder="Please provide a detailed description of the services or products this supplier will provide..."
            />
          )}
        />

        <FormNavigation
          onNext={handleSubmit(onSubmit)}
          onPrev={handlePrev}
        />
      </form>
    </section>
  );
};

export default Section5ServiceDescription;
