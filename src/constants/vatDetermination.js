/**
 * VAT Determination — Trust-side VAT recovery position, recorded at AP
 * Control before Oracle setup (requested by Finance / NELPP, July 2026:
 * "no assumptions applied to VAT Status / VAT Category").
 *
 * ⚠️ PLACEHOLDER VALUE LISTS. The definitive VAT Status options and the
 * COS (Contracted-Out Services) category list are owned by Finance
 * (VAT Accountant / Financial Controller) and were requested July 2026 —
 * swap these arrays for their lists when received, and keep them in sync
 * with the SharePoint choice columns (VATStatus / VATCategory) thereafter.
 *
 * Design notes:
 * - These are NOT supplier facts and NOT queryable from any HMRC API — the
 *   determination depends on WHAT the Trust is buying (Section 5), not on
 *   the supplier's registration. Only the VAT-number VALIDITY is
 *   API-verifiable (Section 6/7 HMRC badge).
 * - A supplier that is not VAT-registered has no VAT to recover → status
 *   auto-resolves to NO_VAT (green badge, no COS category needed).
 * - For VAT-registered suppliers, the COS category is SUGGESTED from the
 *   Section 5 service type (amber badge) and must be confirmed by Finance —
 *   the confirmation (name + date) is the sign-off Finance asked for.
 */

export const VAT_STATUS_OPTIONS = [
  { value: 'recoverable', label: 'Recoverable (COS)' },
  { value: 'non_recoverable', label: 'Non-Recoverable' },
  { value: 'partially_recoverable', label: 'Partially Recoverable' },
  { value: 'no_vat', label: 'No VAT — supplier not VAT-registered' },
];

// PLACEHOLDER — awaiting the authoritative COS headings from Finance
export const COS_CATEGORIES = [
  { value: 'computer_services', label: 'Computer / IT services (placeholder)' },
  { value: 'training', label: 'Training (placeholder)' },
  { value: 'estates_maintenance', label: 'Estates / building maintenance (placeholder)' },
  { value: 'consultancy_professional', label: 'Consultancy / professional services (placeholder)' },
  { value: 'legal_services', label: 'Legal services (placeholder)' },
  { value: 'not_applicable', label: 'Not applicable / goods (no COS heading)' },
  { value: 'other', label: 'Other — see notes' },
];

// Section 5 serviceType value → suggested COS category. Maintained WITH
// Finance (their six-sigma mapping conversation); in production this can
// move to a Finance-owned SharePoint list like the PBP matrix.
export const SERVICE_TYPE_TO_COS = {
  software: 'computer_services',
  training: 'training',
  construction: 'estates_maintenance',
  consultancy: 'consultancy_professional',
  legal: 'legal_services',
  goods: 'not_applicable',
};

/** Suggested COS category from the submission's Section 5 service types. */
export const suggestCosCategory = (serviceTypes) => {
  const types = Array.isArray(serviceTypes) ? serviceTypes : serviceTypes ? [serviceTypes] : [];
  for (const t of types) {
    if (SERVICE_TYPE_TO_COS[t]) return SERVICE_TYPE_TO_COS[t];
  }
  return '';
};
