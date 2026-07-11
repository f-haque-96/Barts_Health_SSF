/**
 * Section 6: Financial & Accounts Information
 * Updated: Mar 2026 - CI compliance
 * Banking details, insurance, VAT - Most conditional fields
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Textarea, RadioGroup, QuestionLabel, NoticeBox, CheckIcon, WarningIcon, InfoIcon } from '../common';
import { FormNavigation } from '../layout';
import { getSection6Schema } from '../../utils/validation';
import {
  formatSortCode,
  formatIBAN,
  formatAccountNumber,
  formatSwiftBic,
  financialValidators,
} from '../../utils/helpers';
import { checkVATNumber, cleanVATNumber, VAT_ERROR_TYPES } from '../../utils/vatCheck';
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
    trigger,
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
      nameOnAccount: formData.nameOnAccount || '',
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
  const watchVatNumber = watch('vatNumber');

  // ===== VAT number verification (HMRC via flow proxy) =====
  // status: 'idle' | 'checking' | 'verified' | 'not_found' | 'unavailable'
  const [vatStatus, setVatStatus] = useState(formData.vatVerification ? 'verified' : 'idle');
  // While the flow uses HMRC's SANDBOX, real VAT numbers always come back
  // not-found — show an honest "test mode" notice instead of a misleading
  // rejection. Unset this flag when the production HMRC connection is live.
  const VAT_SANDBOX_MODE = import.meta.env.VITE_VAT_SANDBOX === 'true';
  const [vatResult, setVatResult] = useState(formData.vatVerification || null);
  const [vatMessage, setVatMessage] = useState('');

  useEffect(() => {
    if (watchVat !== 'yes') return undefined;
    const cleaned = cleanVATNumber(watchVatNumber);
    if (!/^\d{9}(\d{3})?$/.test(cleaned)) {
      setVatStatus('idle');
      setVatResult(null);
      return undefined;
    }
    // Skip re-checking the same number we already verified
    if (vatResult?.vatNumber === cleaned && vatStatus === 'verified') return undefined;

    const timer = setTimeout(async () => {
      setVatStatus('checking');
      const result = await checkVATNumber(cleaned);
      if (result.success) {
        setVatStatus('verified');
        setVatResult(result.data);
        setVatMessage('');
        // Persist for Section 7, review pages and the PDF
        updateFormData('vatVerification', result.data);
      } else if (result.error === VAT_ERROR_TYPES.NOT_FOUND) {
        setVatStatus('not_found');
        setVatResult(null);
        setVatMessage(result.message);
        updateFormData('vatVerification', null);
      } else {
        // NOT_CONFIGURED / NETWORK_ERROR / API_ERROR -> verify manually, don't block
        setVatStatus('unavailable');
        setVatResult(null);
        setVatMessage(result.message);
        updateFormData('vatVerification', null);
      }
    }, 600); // debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchVat, watchVatNumber]);

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
    // Re-validate field if it already has an error (clears error once input is correct)
    if (errors[field]) {
      trigger(field);
    }
  };

  // ===== Stale-conditional-field clearing =====
  // When a controlling answer changes so its dependent fields are hidden,
  // the previously typed values must be CLEARED (form state + store) — not
  // just hidden — or they leak into Section 7, the PDF, review pages and
  // the submission (bug found 11 Jul 2026: Q6.15 'no' still submitted the
  // Q6.16 VAT number).
  const clearFields = React.useCallback((fields) => {
    fields.forEach((f) => {
      setValue(f, '');
      updateFormData(f, '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]);

  useEffect(() => {
    if (watchVat === 'no') {
      if (formData.vatNumber || formData.vatVerification) {
        clearFields(['vatNumber']);
        updateFormData('vatVerification', null);
        setVatStatus('idle');
        setVatResult(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchVat]);

  useEffect(() => {
    if (watchPublicLiability === 'no' && (formData.plCoverage || formData.plExpiry)) {
      clearFields(['plCoverage', 'plExpiry']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPublicLiability]);

  useEffect(() => {
    if (watchGhxDuns === 'no' && formData.ghxDunsNumber) {
      clearFields(['ghxDunsNumber']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchGhxDuns]);

  useEffect(() => {
    if (watchCis === 'no' && formData.utrNumber) {
      clearFields(['utrNumber']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCis]);

  useEffect(() => {
    if (watchAccountsAddressSame === 'yes' &&
        (formData.accountsAddress || formData.accountsCity || formData.accountsPostcode || formData.accountsEmail || formData.accountsPhone)) {
      clearFields(['accountsAddress', 'accountsCity', 'accountsPostcode', 'accountsEmail', 'accountsPhone']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchAccountsAddressSame]);

  useEffect(() => {
    // Overseas 'yes' hides the UK bank fields; 'no' hides the international
    // ones — clear whichever branch just became hidden
    if (watchOverseas === 'yes' &&
        (formData.nameOnAccount || formData.sortCode || formData.accountNumber ||
         formData.accountsAddressSame || formData.accountsAddress)) {
      // The accounts-address question also lives in the UK-only branch
      clearFields(['nameOnAccount', 'sortCode', 'accountNumber',
        'accountsAddressSame', 'accountsAddress', 'accountsCity',
        'accountsPostcode', 'accountsEmail', 'accountsPhone']);
    }
    if (watchOverseas === 'no' && (formData.iban || formData.swiftCode || formData.bankRouting)) {
      clearFields(['iban', 'swiftCode', 'bankRouting']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchOverseas]);

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
              label={<QuestionLabel section="6" question="2" tooltip="International Bank Account Number - Up to 34 characters starting with 2-letter country code">IBAN</QuestionLabel>}
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
                label={<QuestionLabel section="6" question="3" tooltip="Bank Identifier Code for international transfers - 8 or 11 characters">SWIFT/BIC Code</QuestionLabel>}
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
                label={<QuestionLabel section="6" question="4" tooltip="US bank routing number for ACH transfers - 9 digits">Bank Routing Number</QuestionLabel>}
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
          <>
            <Input
              label={<QuestionLabel section="6" question="4">Name on Account</QuestionLabel>}
              name="nameOnAccount"
              {...register('nameOnAccount')}
              onChange={(e) => {
                register('nameOnAccount').onChange(e);
                handleFieldChange('nameOnAccount', e.target.value);
              }}
              error={errors.nameOnAccount?.message}
              required
              placeholder="e.g., ABC Limited"
            />

            <div className="form-row">
              <Input
                label={<QuestionLabel section="6" question="5">UK Sort Code</QuestionLabel>}
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
                label={<QuestionLabel section="6" question="6">UK Account Number</QuestionLabel>}
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
          </>
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
          <>
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

            {/* HMRC verification status */}
            {vatStatus === 'checking' && (
              <p style={{ marginTop: 'var(--space-8)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Checking VAT number with HMRC…
              </p>
            )}
            {vatStatus === 'verified' && vatResult && (
              <NoticeBox type="success" style={{ marginTop: 'var(--space-8)' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckIcon size={14} color="#22c55e" /> VAT number verified (HMRC):
                </strong>{' '}
                {vatResult.name}
                {vatResult.address && (
                  <>
                    <br />
                    <small>{vatResult.address}</small>
                  </>
                )}
              </NoticeBox>
            )}
            {vatStatus === 'not_found' && VAT_SANDBOX_MODE && (
              <NoticeBox type="info" style={{ marginTop: 'var(--space-8)' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <InfoIcon size={14} color="#3b82f6" /> Test mode:
                </strong>{' '}
                VAT verification is currently connected to the HMRC <em>test</em> service,
                which cannot verify real VAT numbers — a valid number will show as not
                found here until the production connection goes live. Please verify the
                number manually at{' '}
                <a href="https://www.gov.uk/check-uk-vat-number" target="_blank" rel="noopener noreferrer">
                  gov.uk/check-uk-vat-number
                </a>{' '}
                and continue.
              </NoticeBox>
            )}
            {vatStatus === 'not_found' && !VAT_SANDBOX_MODE && (
              <NoticeBox type="warning" style={{ marginTop: 'var(--space-8)' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <WarningIcon size={14} color="#f59e0b" /> Not found:
                </strong>{' '}
                {vatMessage}
              </NoticeBox>
            )}
            {vatStatus === 'unavailable' && (
              <NoticeBox type="info" style={{ marginTop: 'var(--space-8)' }}>
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <InfoIcon size={14} color="#3b82f6" /> Verification unavailable:
                </strong>{' '}
                {vatMessage}
              </NoticeBox>
            )}
          </>
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
