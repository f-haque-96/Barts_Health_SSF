/**
 * useUnsavedChanges Hook
 * Warns users when they try to leave the page with unsaved form data
 * UX-01: Prevents accidental data loss
 */

import { useEffect, useCallback } from 'react';
import useFormStore from '../stores/formStore';

const useUnsavedChanges = (enabled = true) => {
  const formData = useFormStore((state) => state.formData);
  const uploadedFiles = useFormStore((state) => state.uploadedFiles);

  // Check if there's any form data (form has been started)
  const hasFormData = useCallback(() => {
    // Check if any form fields have been filled
    const hasData = Object.values(formData).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return value === true;
      if (Array.isArray(value)) return value.length > 0;
      return value != null;
    });

    // Check if any files have been uploaded
    const hasFiles = Object.keys(uploadedFiles).length > 0;

    return hasData || hasFiles;
  }, [formData, uploadedFiles]);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e) => {
      // Only warn if form has data
      if (hasFormData()) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasFormData]);

  return { hasFormData: hasFormData() };
};

export default useUnsavedChanges;
