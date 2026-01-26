/**
 * Section 6: Financial & Accounts Information
 * Banking details, insurance, VAT - Most conditional fields
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Textarea, RadioGroup, QuestionLabel } from '../common';
import { FormNavigation } from '../layout';
import { section6BaseSchema, getSection6Schema } from '../../utils/validation';
import {
  formatPostcode,
  formatSortCode,
  formatIBAN,
  formatAccountNumber,
  formatSwiftBic,
  financialValidators,
} from '../../utils/helpers';
import useFormStore from '../../stores/formStore';
import useFormNavigation from '../../hooks/useFormNavigation';

const Section6FinancialInfo = () => {
  const { formData, updateFormData, updateMultipleFields } = useFormStore();
  const { handleNext, handlePrev } = useFormNavigation();

  // State for real-time validation errors
  const [validationErrors, setValidationErrors] = useState({});

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
    resolver: zodResolver(getSection6Schema(formData)),
    defaultValues: {
      overseasSupplier: formData.overseasSupplier || '',
      iban: formData.iban || '',
      swiftCode: formData.swiftCode || '',
      bankRouting: formData.bankRouting || '',
      sortCode: formData.sortCode || '',
      accountNumber: formData.accountNumber || '',
      accountsAddressSame: formData.accountsAddressSame || '',
      accountsAddress: formData.accountsAddress || '',
      accountsCity: formData.accountsCity || '',
      accountsPostcode: formData.accountsPostcode || '',
      accountsPhone: formData.accountsPhone || '',
      accountsEmail: formData.accountsEmail || '',
      ghxDunsKnown: formData.ghxDunsKnown || '',
      ghxDunsNumber: formData.ghxDunsNumber || '',
      cisRegistered: formData.cisRegistered || '',
      utrNumber: formData.utrNumber || '',
      publicLiability: formData.publicLiability || '',
      plCoverage: formData.plCoverage || '',
      plExpiry: formData.plExpiry || '',
      vatRegistered: formData.vatRegistered || '',
      vatNumber: formData.vatNumber || '',
    },
  });

  const watchOverseas = watch('overseasSupplier');
  const watchAccountsAddressSame = watch('accountsAddressSame');
  const watchGhxDuns = watch('ghxDunsKnown');
  const watchCis = watch('cisRegistered');
  const watchPublicLiability = watch('publicLiability');
  const watchVat = watch('vatRegistered');

  // Handler for onBlur validation
  const handleFieldBlur = (fieldName, validatorFn) => (e) => {
    const value = e.target.value;
    if (validatorFn) {
      const error = validatorFn(value);
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

  const onSubmit = (data) => {
    updateMultipleFields(data);
    handleNext();
  };

  const handleFieldChange = (field, value) => {
    updateFormData(field, value);
  };

  return (
    <section className="form-section active" id="section-6">
      <h3>Financial & Accounts Information</h3>
      <p className="section-subtitle">
        Please provide the supplier's banking and financial information.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Overseas Supplier */}
        <Controller
          name="overseasSupplier"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label={<QuestionLabel section="6" question="1">Is this an overseas supplier?</QuestionLabel>}
              name="overseasSupplier"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                handleFieldChange('overseasSupplier', value);
              }}
              error={errors.overseasSupplier?.message}
              required
              horizontal
            />
          )}
        />

        {watchOverseas === 'yes' && (
          <>
            <Input
              label={<QuestionLabel section="6" question="2">IBAN</QuestionLabel>}
              name="iban"
              {...register('iban')}
              onChange={(e) => {
                const formatted = formatIBAN(e.target.value);
                setValue('iban', formatted);
                register('iban').onChange(e);
                handleFieldChange('iban', formatted);
                // Clear validation error on change
                if (validationErrors.iban) {
                  setValidationErrors((prev) => ({ ...prev, iban: null }));
                }
              }}
              onBlur={handleFieldBlur('iban', financialValidators.iban)}
              error={validationErrors.iban || errors.iban?.message}
              required
              placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
            />

            <div className="form-row">
              <Input
                label={<QuestionLabel section="6" question="3">SWIFT/BIC Code</QuestionLabel>}
                name="swiftCode"
                {...register('swiftCode')}
                onChange={(e) => {
                  const formatted = formatSwiftBic(e.target.value);
                  setValue('swiftCode', formatted);
                  register('swiftCode').onChange(e);
                  handleFieldChange('swiftCode', formatted);
                  if (validationErrors.swiftCode) {
                    setValidationErrors((prev) => ({ ...prev, swiftCode: null }));
                  }
                }}
                onBlur={handleFieldBlur('swiftCode', financialValidators.swiftBic)}
                error={validationErrors.swiftCode || errors.swiftCode?.message}
                required
                placeholder="e.g., NWBKGB2L"
              />

              <Input
                label={<QuestionLabel section="6" question="4">Bank Routing Number</QuestionLabel>}
                name="bankRouting"
                {...register('bankRouting')}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setValue('bankRouting', formatted);
                  register('bankRouting').onChange(e);
                  handleFieldChange('bankRouting', formatted);
                  if (validationErrors.bankRouting) {
                    setValidationErrors((prev) => ({ ...prev, bankRouting: null }));
                  }
                }}
                onBlur={handleFieldBlur('bankRouting', financialValidators.routingNumber)}
                error={validationErrors.bankRouting || errors.bankRouting?.message}
                required
                placeholder="e.g., 026009593"
              />
            </div>
          </>
        )}

        {watchOverseas === 'no' && (
          <div className="form-row">
            <Input
              label={<QuestionLabel section="6" question="4">UK Sort Code</QuestionLabel>}
              name="sortCode"
              {...register('sortCode')}
              onChange={(e) => {
                const formatted = formatSortCode(e.target.value.replace(/\D/g, ''));
                setValue('sortCode', formatted);
                register('sortCode').onChange(e);
                handleFieldChange('sortCode', formatted);
                if (validationErrors.sortCode) {
                  setValidationErrors((prev) => ({ ...prev, sortCode: null }));
                }
              }}
              onBlur={handleFieldBlur('sortCode', financialValidators.sortCode)}
              error={validationErrors.sortCode || errors.sortCode?.message}
              required
              placeholder="e.g., 12-34-56"
              maxLength={8}
            />

            <Input
              label={<QuestionLabel section="6" question="5">UK Account Number</QuestionLabel>}
              name="accountNumber"
              {...register('accountNumber')}
              onChange={(e) => {
                const formatted = formatAccountNumber(e.target.value);
                setValue('accountNumber', formatted);
                register('accountNumber').onChange(e);
                handleFieldChange('accountNumber', formatted);
                if (validationErrors.accountNumber) {
                  setValidationErrors((prev) => ({ ...prev, accountNumber: null }));
                }
              }}
              onBlur={handleFieldBlur('accountNumber', financialValidators.accountNumber)}
              error={validationErrors.accountNumber || errors.accountNumber?.message}
              required
              placeholder="e.g., 12345678"
              maxLength={8}
            />
          </div>
        )}

        {/* Accounts Address */}
        <div style={{ marginTop: 'var(--space-24)' }}>
          <Controller
            name="accountsAddressSame"
            control={control}
            render={({ field }) => (
              <RadioGroup
                label={<QuestionLabel section="6" question="6">Is the accounts address the same as the registered address?</QuestionLabel>}
                name="accountsAddressSame"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  handleFieldChange('accountsAddressSame', value);
                }}
                error={errors.accountsAddressSame?.message}
                required
                horizontal
              />
            )}
          />
        </div>

        {watchAccountsAddressSame === 'no' && (
          <>
            <Textarea
              label="Accounts Address"
              name="accountsAddress"
              value={watch('accountsAddress') || ''}
              {...register('accountsAddress')}
              onChange={(e) => {
                register('accountsAddress').onChange(e);
                handleFieldChange('accountsAddress', e.target.value);
              }}
              error={errors.accountsAddress?.message}
              required
              rows={3}
              placeholder="Enter accounts department address"
            />

            <div className="form-row">
              <Input
                label="City"
                name="accountsCity"
                {...register('accountsCity')}
                onChange={(e) => {
                  register('accountsCity').onChange(e);
                  handleFieldChange('accountsCity', e.target.value);
                }}
                error={errors.accountsCity?.message}
                required
                placeholder="e.g., London"
              />

              <Input
                label="Postcode"
                name="accountsPostcode"
                {...register('accountsPostcode')}
                onChange={(e) => {
                  register('accountsPostcode').onChange(e);
                  handleFieldChange('accountsPostcode', e.target.value);
                }}
                error={errors.accountsPostcode?.message}
                required
                placeholder="e.g., EC1A 1BB"
              />
            </div>

            <div className="form-row">
              <Input
                label="Accounts Phone"
                name="accountsPhone"
                type="tel"
                {...register('accountsPhone')}
                onChange={(e) => {
                  register('accountsPhone').onChange(e);
                  handleFieldChange('accountsPhone', e.target.value);
                }}
                error={errors.accountsPhone?.message}
                required
                placeholder="e.g., 020 7377 7000"
              />

              <Input
                label="Accounts Email"
                name="accountsEmail"
                type="email"
                {...register('accountsEmail')}
                onChange={(e) => {
                  register('accountsEmail').onChange(e);
                  handleFieldChange('accountsEmail', e.target.value);
                }}
                error={errors.accountsEmail?.message}
                required
                placeholder="accounts@supplier.com"
              />
            </div>
          </>
        )}

        {/* DUNS Number */}
        <div style={{ marginTop: 'var(--space-24)' }}>
          <Controller
            name="ghxDunsKnown"
            control={control}
            render={({ field }) => (
              <RadioGroup
                label={<QuestionLabel section="6" question="8">Do you know the DUNS number?</QuestionLabel>}
                name="ghxDunsKnown"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  handleFieldChange('ghxDunsKnown', value);
                }}
                error={errors.ghxDunsKnown?.message}
                required
                horizontal
              />
            )}
          />
        </div>

        {watchGhxDuns === 'yes' && (
          <Input
            label={<QuestionLabel section="6" question="9">DUNS Number</QuestionLabel>}
            name="ghxDunsNumber"
            {...register('ghxDunsNumber')}
            onChange={(e) => {
              const formatted = e.target.value.replace(/\D/g, '').slice(0, 9);
              setValue('ghxDunsNumber', formatted);
              register('ghxDunsNumber').onChange(e);
              handleFieldChange('ghxDunsNumber', formatted);
              if (validationErrors.ghxDunsNumber) {
                setValidationErrors((prev) => ({ ...prev, ghxDunsNumber: null }));
              }
            }}
            onBlur={handleFieldBlur('ghxDunsNumber', financialValidators.dunsNumber)}
            error={validationErrors.ghxDunsNumber || errors.ghxDunsNumber?.message}
            required
            placeholder="e.g., 123456789"
            maxLength={9}
          />
        )}

        {/* CIS Registration */}
        <div style={{ marginTop: 'var(--space-24)' }}>
          <Controller
            name="cisRegistered"
            control={control}
            render={({ field }) => (
              <RadioGroup
                label={<QuestionLabel section="6" question="10">Is the supplier registered for CIS (Construction Industry Scheme)?</QuestionLabel>}
                name="cisRegistered"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  handleFieldChange('cisRegistered', value);
                }}
                error={errors.cisRegistered?.message}
                required
                horizontal
              />
            )}
          />
        </div>

        {watchCis === 'yes' && (
          <Input
            label={<QuestionLabel section="6" question="11">UTR Number (Unique Taxpayer Reference)</QuestionLabel>}
            name="utrNumber"
            {...register('utrNumber')}
            onChange={(e) => {
              const formatted = e.target.value.replace(/\D/g, '').slice(0, 10);
              setValue('utrNumber', formatted);
              register('utrNumber').onChange(e);
              handleFieldChange('utrNumber', formatted);
              if (validationErrors.utrNumber) {
                setValidationErrors((prev) => ({ ...prev, utrNumber: null }));
              }
            }}
            onBlur={handleFieldBlur('utrNumber', financialValidators.utrNumber)}
            error={validationErrors.utrNumber || errors.utrNumber?.message}
            required
            placeholder="e.g., 1234567890"
            maxLength={10}
          />
        )}

        {/* Public Liability Insurance */}
        <div style={{ marginTop: 'var(--space-24)' }}>
          <Controller
            name="publicLiability"
            control={control}
            render={({ field }) => (
              <RadioGroup
                label={<QuestionLabel section="6" question="12">Does the supplier have Public Liability Insurance?</QuestionLabel>}
                name="publicLiability"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  handleFieldChange('publicLiability', value);
                }}
                error={errors.publicLiability?.message}
                required
                horizontal
              />
            )}
          />
        </div>

        {watchPublicLiability === 'yes' && (
          <div className="form-row">
            <Input
              label={<QuestionLabel section="6" question="13">Coverage Amount (£)</QuestionLabel>}
              name="plCoverage"
              type="number"
              {...register('plCoverage', { valueAsNumber: true })}
              onChange={(e) => {
                register('plCoverage', { valueAsNumber: true }).onChange(e);
                handleFieldChange('plCoverage', parseFloat(e.target.value));
              }}
              error={errors.plCoverage?.message}
              required
              placeholder="e.g., 5000000"
            />

            <Input
              label={<QuestionLabel section="6" question="14">Expiry Date</QuestionLabel>}
              name="plExpiry"
              type="date"
              {...register('plExpiry')}
              onChange={(e) => {
                register('plExpiry').onChange(e);
                handleFieldChange('plExpiry', e.target.value);
              }}
              error={errors.plExpiry?.message}
              required
            />
          </div>
        )}

        {/* VAT Registration */}
        <div style={{ marginTop: 'var(--space-24)' }}>
          <Controller
            name="vatRegistered"
            control={control}
            render={({ field }) => (
              <RadioGroup
                label={<QuestionLabel section="6" question="15">Is the supplier VAT registered?</QuestionLabel>}
                name="vatRegistered"
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  handleFieldChange('vatRegistered', value);
                }}
                error={errors.vatRegistered?.message}
                required
                horizontal
              />
            )}
          />
        </div>

        {watchVat === 'yes' && (
          <Input
            label={<QuestionLabel section="6" question="16">VAT Registration Number</QuestionLabel>}
            name="vatNumber"
            {...register('vatNumber')}
            onChange={(e) => {
              const formatted = e.target.value.replace(/[^0-9GB]/gi, '').toUpperCase();
              setValue('vatNumber', formatted);
              register('vatNumber').onChange(e);
              handleFieldChange('vatNumber', formatted);
              if (validationErrors.vatNumber) {
                setValidationErrors((prev) => ({ ...prev, vatNumber: null }));
              }
            }}
            onBlur={handleFieldBlur('vatNumber', financialValidators.vatNumber)}
            error={validationErrors.vatNumber || errors.vatNumber?.message}
            required
            placeholder="e.g., GB123456789"
            maxLength={14}
          />
        )}

        <FormNavigation
          onNext={handleSubmit(onSubmit)}
          onPrev={handlePrev}
        />
      </form>
    </section>
  );
};

export default Section6FinancialInfo;
