/**
 * SignatureSection Component
 * Digital signature capture with full name and date
 */

import React from 'react';
import { Input } from './';

const SignatureSection = ({ signatureName, signatureDate, onSignatureChange, disabled = false }) => {
  // Default to today's date
  const today = new Date().toISOString().split('T')[0];

  const handleNameChange = (e) => {
    onSignatureChange({
      signatureName: e.target.value,
      signatureDate: signatureDate || today,
    });
  };

  const handleDateChange = (e) => {
    onSignatureChange({
      signatureName,
      signatureDate: e.target.value,
    });
  };

  return (
    <div className="signature-section">
      <h4 className="signature-section-title">Digital Signature</h4>
      <p className="signature-section-disclaimer">
        By entering your full name below, you are providing a legal electronic signature that is as valid as a handwritten signature.
      </p>

      <div className="signature-fields">
        <Input
          label="Full Name (Digital Signature)"
          name="signatureName"
          value={signatureName || ''}
          onChange={handleNameChange}
          disabled={disabled}
          required
          placeholder="Enter your full name"
        />

        <Input
          label="Date"
          name="signatureDate"
          type="date"
          value={signatureDate || today}
          onChange={handleDateChange}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
};

export default SignatureSection;
