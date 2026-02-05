/**
 * ResetFormModal Component
 * Modal for confirming form reset with all data deletion
 */

import { useState } from 'react';
import { XIcon } from './Icons';
import Button from './Button';
import useFormStore from '../../stores/formStore';
import './ResetFormModal.css';

const ResetFormModal = ({ isOpen, onClose }) => {
  const [confirmation, setConfirmation] = useState('');
  const { resetForm } = useFormStore();

  if (!isOpen) return null;

  const handleReset = () => {
    if (confirmation === 'yes') {
      // Clear ALL form-related localStorage keys
      localStorage.removeItem('nhs-supplier-form-storage'); // Main form storage (Zustand persist)
      localStorage.removeItem('supplier-form-uploads'); // Uploaded files
      localStorage.removeItem('form-storage'); // Legacy key
      localStorage.removeItem('all_submissions'); // Submissions list
      localStorage.removeItem('supplier-submissions'); // Alternative submissions key
      localStorage.removeItem('questionnaireSubmission'); // Questionnaire data
      localStorage.removeItem('current-test-submission-id'); // Test submission ID

      // Clear all individual submission entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('submission_') || key.startsWith('PREVIEW-TEST-')) {
          localStorage.removeItem(key);
        }
      });

      // Reset the store completely
      resetForm();

      // Close modal
      onClose();

      // Force page reload for clean state
      window.location.href = '/';
    }
  };

  return (
    <div className="reset-modal-overlay" onClick={onClose}>
      <div className="reset-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="reset-modal-header">
          <h3 style={{ margin: 0, color: '#1f2937', fontWeight: '600', fontSize: '1.125rem' }}>
            Reset Form
          </h3>
          <button className="reset-modal-close" onClick={onClose} aria-label="Close">
            <XIcon size={20} />
          </button>
        </div>

        <div className="reset-modal-body">
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#991b1b' }}>
              Are you sure you want to reset the form?
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#7f1d1d' }}>
              This will clear <strong>ALL</strong> form data and uploaded files. This action <strong>cannot be undone</strong>.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 0.75rem 0', fontWeight: '500' }}>
              Please confirm your choice:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: `2px solid ${confirmation === 'yes' ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: confirmation === 'yes' ? '#fee2e2' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="reset-confirmation"
                  value="yes"
                  checked={confirmation === 'yes'}
                  onChange={(e) => setConfirmation(e.target.value)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>Yes, reset the form and clear everything</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                border: `2px solid ${confirmation === 'no' ? '#005EB8' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: confirmation === 'no' ? '#eff6ff' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="reset-confirmation"
                  value="no"
                  checked={confirmation === 'no'}
                  onChange={(e) => setConfirmation(e.target.value)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>No, keep my form data</span>
              </label>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReset}
              disabled={confirmation !== 'yes'}
              style={{
                backgroundColor: confirmation === 'yes' ? '#dc2626' : '#9ca3af',
                borderColor: confirmation === 'yes' ? '#dc2626' : '#9ca3af',
                cursor: confirmation === 'yes' ? 'pointer' : 'not-allowed',
                opacity: confirmation === 'yes' ? 1 : 0.6
              }}
            >
              Reset Form
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetFormModal;
