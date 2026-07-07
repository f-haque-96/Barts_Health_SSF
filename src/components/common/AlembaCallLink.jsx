/**
 * AlembaCallLink — renders an Alemba call reference as a deep link into the
 * Alemba ASM service desk, falling back to plain text when no link template
 * is configured.
 *
 * VITE_ALEMBA_CALL_URL holds the direct-link template with a {ref} token,
 * e.g. https://servicedeskbartshealth.alembacloud.com/...&CALL={ref}
 * ASM X is a single-page app whose address bar does not change per call, so
 * the template must come from Alemba's own notification-email links or the
 * Alemba administrator ("direct link format for calls"). Until then the
 * variable stays unset and references render as plain text.
 */
import React from 'react';

const TEMPLATE = import.meta.env.VITE_ALEMBA_CALL_URL || '';

/** Returns the deep-link URL for a call reference, or null if not linkable. */
const getAlembaCallUrl = (reference) => {
  const ref = String(reference ?? '').trim();
  if (!TEMPLATE || !TEMPLATE.includes('{ref}') || !/^\d{4,10}$/.test(ref)) {
    return null;
  }
  return TEMPLATE.replace('{ref}', ref);
};

const AlembaCallLink = ({ reference, style }) => {
  const ref = String(reference ?? '').trim();
  if (!ref) return null;

  const url = getAlembaCallUrl(ref);
  if (!url) {
    return <strong style={style}>{ref}</strong>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Open this call in Alemba"
      style={{ fontWeight: 600, color: 'var(--nhs-blue)', ...style }}
    >
      {ref} ↗
    </a>
  );
};

export default AlembaCallLink;
