// HMRC "Check a UK VAT number" (v2.0) integration
// SECURITY: the HMRC client ID/secret must never ship in this SPA. All requests
// route through a Power Automate HTTP-trigger flow that performs the OAuth
// client-credentials exchange and the lookup server-side
// (VITE_VAT_FLOW_URL - see docs/deployment/setup/07-browser-agent-playbook.md Task 10).
// If no flow is configured, verification degrades gracefully to manual checking.
//
// Response contract (verified against the HMRC sandbox, July 2026):
//   200 -> { target: { name, vatNumber, address: { line1..., postcode, countryCode } } }
//   404 -> { code: 'NOT_FOUND', message: 'targetVrn does not match a registered company' }
//   400 -> { code: 'INVALID_REQUEST' } (VRN must be 9 or 12 DIGITS - no GB prefix)

export const VAT_ERROR_TYPES = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
};

const MANUAL_CHECK_MESSAGE =
  'Automatic VAT verification is not available right now. You can check the number ' +
  'yourself at gov.uk/check-uk-vat-number, then continue - the VAT number will still ' +
  'be recorded.';

/**
 * Normalise a user-typed VAT number to what HMRC accepts:
 * strip spaces and a leading GB, leaving 9 or 12 digits.
 */
export const cleanVATNumber = (vatNumber) =>
  (vatNumber || '').replace(/\s/g, '').replace(/^GB/i, '');

/**
 * Look up a UK VAT number via the flow proxy.
 * Returns { success, data? , error?, message? } - never throws.
 */
export const checkVATNumber = async (vatNumber) => {
  const cleaned = cleanVATNumber(vatNumber);

  if (!/^\d{9}(\d{3})?$/.test(cleaned)) {
    return {
      success: false,
      error: VAT_ERROR_TYPES.INVALID_FORMAT,
      message: 'A UK VAT number is 9 or 12 digits (a leading GB is fine - it is removed automatically).',
    };
  }

  const FLOW_URL = import.meta.env.VITE_VAT_FLOW_URL;
  if (!FLOW_URL) {
    return { success: false, error: VAT_ERROR_TYPES.NOT_CONFIGURED, message: MANUAL_CHECK_MESSAGE };
  }

  try {
    // Plain GET with the VRN as a query parameter and NO custom headers: keeps it
    // a CORS "simple request" so the browser never preflights the flow endpoint.
    const flowUrl = new URL(FLOW_URL);
    flowUrl.searchParams.set('vrn', cleaned);
    const response = await fetch(flowUrl.toString(), { method: 'GET' });

    if (response.status === 404) {
      return {
        success: false,
        error: VAT_ERROR_TYPES.NOT_FOUND,
        message: 'This VAT number does not match a registered company. Please check the number.',
      };
    }

    if (!response.ok) {
      return { success: false, error: VAT_ERROR_TYPES.API_ERROR, message: MANUAL_CHECK_MESSAGE };
    }

    const body = await response.json();
    const target = body?.target;
    if (!target?.vatNumber) {
      return { success: false, error: VAT_ERROR_TYPES.API_ERROR, message: MANUAL_CHECK_MESSAGE };
    }

    const addressParts = [
      target.address?.line1,
      target.address?.line2,
      target.address?.postcode,
    ].filter(Boolean);

    return {
      success: true,
      data: {
        name: target.name,
        vatNumber: target.vatNumber,
        address: addressParts.join(', '),
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('VAT check failed:', error);
    return { success: false, error: VAT_ERROR_TYPES.NETWORK_ERROR, message: MANUAL_CHECK_MESSAGE };
  }
};
