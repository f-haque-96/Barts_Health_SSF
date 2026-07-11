/**
 * Section 3: Supplier Classification
 * Updated: Mar 2026 - CI compliance
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

// Supplier Information Pack — Microsoft Form the requester can send to the
// supplier so Sections 3–6 answers arrive in one go instead of email
// back-and-forth. Configured (not hardcoded) so the public repo doesn't
// advertise the form; unset = the helper notice simply doesn't render.
const SUPPLIER_PACK_FORM_URL = import.meta.env.VITE_SUPPLIER_PACK_FORM_URL;
// HTTP-trigger flow that looks a pack up in SSF-SupplierPacks by
// reference + requester email (same proxy pattern as the CRN/VAT checks)
const PACK_FETCH_FLOW_URL = import.meta.env.VITE_PACK_FETCH_FLOW_URL;

const generatePackReference = () =>
  'PACK-' + Array.from({ length: 6 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');

const packYesNo = (v) => {
  const s = String(v || '').trim().toLowerCase();
  if (s.startsWith('y')) return 'yes';
  if (s.startsWith('n')) return 'no'; // covers "No" and "Not applicable"
  return '';
};

// Pack bands ("1-9", "10-49", "50-249", "250+") → EMPLOYEE_COUNTS values.
// Order matters: check the most specific number first.
const packEmployeeBand = (v) => {
  const s = String(v || '');
  if (s.includes('250')) return 'large';
  if (s.includes('50')) return 'medium';
  if (s.includes('10')) return 'small';
  if (s.includes('1')) return 'micro';
  return '';
};

// dd/mm/yyyy (or dd-mm-yyyy) → yyyy-mm-dd for date inputs
const packDate = (v) => {
  const m = String(v || '').match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
};

// Map a supplier pack (SSF-SupplierPacks row shape) to form fields across
// Sections 3–6. Deliberately NEVER mapped: supplier type (drives
// validation/OPW routing — human choice, shown as a hint) and ID documents.
// Bank details ARE mapped (July 2026 decision): they arrive via the pack
// email only (not stored in the SupplierPacks list) and the AP letterhead
// cross-check is unchanged.
const mapPackToFields = (pack) => {
  const postcodeMatch = String(pack.RegisteredAddress || '')
    .match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i);
  const fields = {
    companyName: pack.CompanyName || '',
    tradingName: pack.TradingName || '',
    registeredAddress: pack.RegisteredAddress || '',
    city: pack.City || '',
    postcode: (pack.Postcode || (postcodeMatch ? postcodeMatch[0] : '')).toUpperCase(),
    contactName: pack.ContactName || '',
    contactEmail: pack.ContactEmail || '',
    contactPhone: pack.ContactPhone || '',
    website: pack.Website || '',
    companiesHouseRegistered: packYesNo(pack.CompaniesHouseRegistered),
    crn: String(pack.CRN || '').replace(/\s+/g, ''),
    vatRegistered: packYesNo(pack.VATRegistered),
    vatNumber: String(pack.VATNumber || '').replace(/\s+/g, ''),
    cisRegistered: packYesNo(pack.CISRegistered),
    utrNumber: String(pack.UTRNumber || '').replace(/\s+/g, ''),
    publicLiability: packYesNo(pack.PublicLiability),
    plCoverage: pack.PLCoverage || '',
    plExpiry: packDate(pack.PLExpiry),
    employeeCount: packEmployeeBand(pack.EmployeeCount),
    charityNumber: String(pack.CharityNumber || '').replace(/\s+/g, ''),
    overseasSupplier: packYesNo(pack.OverseasSupplier),
    // Bank details (email-only transit; typed values verified by AP against
    // the letterhead exactly as before)
    nameOnAccount: pack.NameOnAccount || '',
    sortCode: pack.SortCode || '',
    accountNumber: String(pack.AccountNumber || '').replace(/\s+/g, ''),
    iban: String(pack.IBAN || '').replace(/\s+/g, ''),
    swiftCode: String(pack.SWIFTCode || '').replace(/\s+/g, ''),
    ...(pack.DUNSNumber
      ? { ghxDunsKnown: 'yes', ghxDunsNumber: pack.DUNSNumber }
      : {}),
  };
  // Never blank out something the requester already typed
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== '' && v != null)
  );
};

// Keys of the machine-readable block at the end of the F8 "Supplier pack
// received" email → pack-row field names. The requester pastes that block
// into Section 3 and everything fills. Keep in sync with the F8 flow body.
const PACK_BLOCK_KEYS = {
  COMPANY: 'CompanyName', TRADING: 'TradingName',
  ORG_TYPE: 'OrganisationType', CH_REGISTERED: 'CompaniesHouseRegistered',
  CRN: 'CRN', CHARITY_NO: 'CharityNumber',
  VAT_REGISTERED: 'VATRegistered', VAT_NO: 'VATNumber',
  ADDRESS: 'RegisteredAddress', CITY: 'City', POSTCODE: 'Postcode',
  CONTACT_NAME: 'ContactName', CONTACT_EMAIL: 'ContactEmail',
  CONTACT_PHONE: 'ContactPhone', WEBSITE: 'Website',
  EMPLOYEES: 'EmployeeCount', CIS: 'CISRegistered', UTR: 'UTRNumber',
  PL_INSURANCE: 'PublicLiability', PL_COVER: 'PLCoverage', PL_EXPIRY: 'PLExpiry',
  INSURANCE_NOTES: 'InsuranceDetails', DUNS: 'DUNSNumber',
  OVERSEAS: 'OverseasSupplier', ACCOUNT_NAME: 'NameOnAccount',
  SORT_CODE: 'SortCode', ACCOUNT_NO: 'AccountNumber',
  IBAN: 'IBAN', SWIFT: 'SWIFTCode',
};

const parsePackBlock = (text) => {
  const pack = {};
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*:\s*(.*)\s*$/);
    if (m && PACK_BLOCK_KEYS[m[1]]) {
      pack[PACK_BLOCK_KEYS[m[1]]] = m[2].trim();
    }
  }
  return pack;
};

const Section3Classification = () => {
  const { formData, updateFormData, updateMultipleFields, uploadedFiles, setUploadedFile, removeUploadedFile } = useFormStore();
  const { handleNext, handlePrev } = useFormNavigation();
  const { verify, status: crnStatus, companyData, error: crnError, isVerifying, isValid, isCorsBlocked, isNotFound } = useCRNVerification();

  const [selectedSupplierType, setSelectedSupplierType] = useState(formData.supplierType || '');
  const [companiesHouseValue, setCompaniesHouseValue] = useState(formData.companiesHouseRegistered || '');
  const [idConsentGiven, setIdConsentGiven] = useState(formData.idConsentGiven || false);
  const [packCopied, setPackCopied] = useState(false);
  const [packFetchStatus, setPackFetchStatus] = useState('idle'); // idle | fetching | done | notfound | error
  const [packFilledCount, setPackFilledCount] = useState(0);
  const [packInsuranceNote, setPackInsuranceNote] = useState('');
  const [packPasteOpen, setPackPasteOpen] = useState(false);
  const [packPasteText, setPackPasteText] = useState('');
  // The supplier's own description of their organisation type — shown as a
  // HINT only; the supplier-type card stays a requester decision because it
  // drives validation, document requirements and OPW routing
  const [packTypeHint, setPackTypeHint] = useState('');

  // Assign this draft a supplier-pack reference once (persists with the draft)
  useEffect(() => {
    if (SUPPLIER_PACK_FORM_URL && !formData.supplierPackReference) {
      updateFormData('supplierPackReference', generatePackReference());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyPackEmail = async () => {
    const requesterEmail = formData.nhsEmail || 'your @nhs.net email';
    const template =
`Subject: Supplier details needed — Barts Health NHS Trust supplier setup

Hi,

We are setting you up as a supplier to Barts Health NHS Trust. Please complete our short Supplier Information Pack — it takes about 5 minutes and needs no sign-in:

${SUPPLIER_PACK_FORM_URL}

In the first question, quote this reference code: ${formData.supplierPackReference}
When asked for the requester's NHS email, enter: ${requesterEmail}

IMPORTANT: do NOT enter bank details on the form. Please send your bank details on company letterhead (plus your insurance certificate, if applicable) directly to me at ${requesterEmail}.

Thank you`;
    try {
      await navigator.clipboard.writeText(template);
      setPackCopied(true);
      setTimeout(() => setPackCopied(false), 3000);
    } catch {
      window.prompt('Copy the supplier email below:', template);
    }
  };

  // Pull the supplier's submitted pack from SSF-SupplierPacks (via the
  // lookup flow) and prefill Sections 3–6. The requester reviews every
  // value as they continue — prefill never bypasses validation or the
  // CRN/VAT verification checks, which run on the filled values as normal.
  const handleFetchPack = async () => {
    setPackFetchStatus('fetching');
    try {
      const sep = PACK_FETCH_FLOW_URL.includes('?') ? '&' : '?';
      const url = `${PACK_FETCH_FLOW_URL}${sep}ref=${encodeURIComponent(formData.supplierPackReference)}&email=${encodeURIComponent(formData.nhsEmail || '')}`;
      const res = await fetch(url);
      if (res.status === 404) {
        setPackFetchStatus('notfound');
        return;
      }
      if (!res.ok) throw new Error(`Lookup failed (HTTP ${res.status})`);
      const pack = await res.json();
      if (!pack || (!pack.CompanyName && !pack.Title)) {
        setPackFetchStatus('notfound');
        return;
      }

      applyPackData(pack);
    } catch (err) {
      console.error('Supplier pack fetch failed:', err);
      setPackFetchStatus('error');
    }
  };

  // Shared by the lookup fetch and the paste-from-email path
  const applyPackData = (pack) => {
    const filled = mapPackToFields(pack);
    if (Object.keys(filled).length === 0) {
      setPackFetchStatus('notfound');
      return;
    }
    updateMultipleFields(filled);

    // Fields rendered on THIS section need explicit sync (react-hook-form
    // has already mounted them); Sections 4–6 initialise from the store
    // when opened
    if (filled.companiesHouseRegistered) {
      setValue('companiesHouseRegistered', filled.companiesHouseRegistered);
      setCompaniesHouseValue(filled.companiesHouseRegistered);
    }
    if (filled.crn) setValue('crn', filled.crn);
    if (filled.charityNumber) setValue('charityNumber', filled.charityNumber);
    if (filled.employeeCount) setValue('employeeCount', filled.employeeCount);

    setPackInsuranceNote(pack.InsuranceDetails || '');
    setPackTypeHint(pack.OrganisationType || '');
    setPackFilledCount(Object.keys(filled).length);
    setPackFetchStatus('done');
    setPackPasteOpen(false);
    setPackPasteText('');
  };

  const handleApplyPastedPack = () => {
    applyPackData(parsePackBlock(packPasteText));
  };

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

      {/* Supplier Information Pack helper — most answers from here to Section 6
          are the supplier's own details; let them fill our form once instead
          of chasing them field by field */}
      {SUPPLIER_PACK_FORM_URL && formData.supplierPackReference && (
        <NoticeBox type="info" style={{ marginBottom: 'var(--space-24)' }}>
          <strong>Need these details from the supplier?</strong>
          <p style={{ margin: 'var(--space-8) 0' }}>
            Most questions from here to Section 6 are about the supplier&apos;s own
            details (registration numbers, address, contacts, insurance). Instead of
            going back and forth by email, send them our Supplier Information Pack —
            a 5-minute online form. Their answers come straight back to your inbox,
            and you copy them in here. Your reference code for this request:{' '}
            <strong>{formData.supplierPackReference}</strong>
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
            <Button variant="outline" type="button" onClick={handleCopyPackEmail}>
              {packCopied ? 'Copied — paste into an email to the supplier' : 'Copy ready-made email for your supplier'}
            </Button>
            {PACK_FETCH_FLOW_URL && (
              <Button
                variant="outline"
                type="button"
                onClick={handleFetchPack}
                disabled={packFetchStatus === 'fetching'}
              >
                {packFetchStatus === 'fetching' ? 'Checking…' : "Fetch my supplier's answers"}
              </Button>
            )}
            <Button variant="outline" type="button" onClick={() => setPackPasteOpen(!packPasteOpen)}>
              {packPasteOpen ? 'Cancel paste' : "Paste supplier's answers"}
            </Button>
          </div>
          {packPasteOpen && (
            <div style={{ marginTop: 'var(--space-12)' }}>
              <p style={{ margin: '0 0 var(--space-8) 0', fontSize: 'var(--font-size-sm)' }}>
                Open the <strong>&quot;Supplier pack received&quot;</strong> email in your
                inbox, copy everything from <strong>=== SSF AUTOFILL ===</strong> to{' '}
                <strong>=== END ===</strong>, paste it below, then click Fill.
              </p>
              <textarea
                value={packPasteText}
                onChange={(e) => setPackPasteText(e.target.value)}
                rows={6}
                placeholder={'=== SSF AUTOFILL ===\nCOMPANY: …\nCRN: …\n=== END ==='}
                style={{
                  width: '100%',
                  padding: 'var(--space-8)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
              <Button
                variant="primary"
                type="button"
                onClick={handleApplyPastedPack}
                disabled={!packPasteText.trim()}
                style={{ marginTop: 'var(--space-8)' }}
              >
                Fill the form from these answers
              </Button>
            </div>
          )}
          {packFetchStatus === 'done' && (
            <p style={{ margin: 'var(--space-8) 0 0 0', color: '#166534', fontWeight: 'var(--font-weight-medium)' }}>
              ✓ {packFilledCount} answers filled in from the supplier&apos;s pack. Review
              each value as you continue through Sections 3–6 — supplier type, ID
              documents and bank details are never auto-filled.
              {packTypeHint && (
                <> The supplier describes themselves as:{' '}
                <strong>{packTypeHint}</strong> — confirm this matches the supplier
                type you select below.</>
              )}
              {packInsuranceNote && (
                <> Insurance details from the supplier (enter manually in Section 6):{' '}
                <strong>{packInsuranceNote}</strong></>
              )}
            </p>
          )}
          {packFetchStatus === 'notfound' && (
            <p style={{ margin: 'var(--space-8) 0 0 0', color: '#92400e' }}>
              No answers found. If you pasted from the email, make sure you copied the
              whole block from <strong>=== SSF AUTOFILL ===</strong> to{' '}
              <strong>=== END ===</strong>. If you used fetch, the supplier may not
              have submitted the pack for reference{' '}
              <strong>{formData.supplierPackReference}</strong> yet.
            </p>
          )}
          {packFetchStatus === 'error' && (
            <p style={{ margin: 'var(--space-8) 0 0 0', color: '#92400e' }}>
              Could not reach the lookup service. You can still copy the answers from
              the &quot;Supplier pack received&quot; email in your inbox.
            </p>
          )}
          <p style={{ margin: 'var(--space-8) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Bank details are deliberately excluded from the pack — the supplier must
            send those on company letterhead directly to you.
          </p>
        </NoticeBox>
      )}

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
