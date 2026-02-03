/**
 * FormNavigation Component
 * Previous/Next buttons with auto-save indicator
 */

import React from 'react';
import { Button, CheckIcon } from '../common';
import useFormStore from '../../stores/formStore';

const FormNavigation = ({ onNext, onPrev, showNext = true, showPrev = true, nextDisabled = false }) => {
  const { currentSection, saveStatus, lastSaved } = useFormStore();

  const formatSaveTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="form-navigation">
      <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
        {showPrev && currentSection > 1 && (
          <Button variant="outline" onClick={onPrev}>
            Previous
          </Button>
        )}
      </div>

      <div className="auto-save-indicator">
        {saveStatus === 'saving' && (
          <>
            <span className="loading" style={{ width: '16px', height: '16px' }} />
            Saving...
          </>
        )}
        {saveStatus === 'saved' && lastSaved && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckIcon size={14} color="#22c55e" /> Saved at {formatSaveTime(lastSaved)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
        {showNext && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {currentSection === 7 ? 'Submit' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormNavigation;
