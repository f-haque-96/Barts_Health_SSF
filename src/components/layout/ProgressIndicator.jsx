/**
 * ProgressIndicator Component
 * Shows current progress through the 7-section form
 */

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import useFormStore from '../../stores/formStore';
import { CheckIcon } from '../common';

const steps = [
  { number: 1, label: 'Requester Info' },
  { number: 2, label: 'Pre-screening' },
  { number: 3, label: 'Classification' },
  { number: 4, label: 'Supplier Details' },
  { number: 5, label: 'Service Description' },
  { number: 6, label: 'Financial Info' },
  { number: 7, label: 'Review & Submit' },
];

const ProgressIndicator = () => {
  // Force re-render trigger
  const [, forceUpdate] = useState({});

  // Subscribe to ALL relevant state changes
  const currentSection = useFormStore((state) => state.currentSection);
  const formData = useFormStore((state) => state.formData);
  const uploadedFiles = useFormStore((state) => state.uploadedFiles);
  const visitedSections = useFormStore((state) => state.visitedSections);
  const getMissingFields = useFormStore((state) => state.getMissingFields);
  const goToSection = useFormStore((state) => state.goToSection);
  const canNavigateTo = useFormStore((state) => state.canNavigateTo);

  // Force update when section or data changes
  useEffect(() => {
    console.log('ProgressIndicator state:', {
      currentSection,
      visitedSections,
      formDataKeys: Object.keys(formData),
      uploadsKeys: Object.keys(uploadedFiles)
    });
    forceUpdate({});
  }, [currentSection, formData, uploadedFiles, visitedSections]);

  const getStepStatus = (section) => {
    // Current section is always active
    if (section === currentSection) return 'active';

    // Get missing fields for this section
    const missing = getMissingFields(section);

    // If section has been visited
    const visited = visitedSections.includes(section);

    // Special case: Section 2 should show warning when sole trader is selected in Section 3
    // This alerts the user that Q2.2 (Sole Trader Status) needs attention
    const isSoleTrader = formData.supplierType === 'sole_trader' || formData.supplierType === 'individual';
    if (section === 2 && isSoleTrader && formData.soleTraderStatus !== 'yes') {
      // Show warning if sole trader selected but Q2.2 not answered as "yes"
      return 'warning';
    }

    // Debug logging
    console.log(`Section ${section}:`, {
      missing: missing.length,
      missingFields: missing,
      visited,
      currentSection,
      status: section === currentSection ? 'active' :
              (missing.length === 0 && visited) ? 'complete' :
              (visited && missing.length > 0) ? 'incomplete' : 'pending'
    });

    if (visited) {
      // No missing fields = complete
      if (missing.length === 0) return 'complete';
      // Has missing fields = incomplete (red)
      return 'incomplete';
    }

    // Not yet visited = pending (grey)
    return 'pending';
  };

  const handleStepClick = (stepNumber) => {
    if (canNavigateTo(stepNumber)) {
      goToSection(stepNumber);
    }
  };

  return (
    <div className="progress-indicator">
      <div className="progress-steps">
        {steps.map((step) => {
          const status = getStepStatus(step.number);
          const canNavigate = canNavigateTo(step.number);

          return (
            <div
              key={step.number}
              className={clsx(
                'step',
                'step-item',
                `step-${status}`,
                status === 'active' && 'active',
                !canNavigate && 'locked'
              )}
              onClick={() => handleStepClick(step.number)}
              role="button"
              tabIndex={canNavigate ? 0 : -1}
              aria-label={`Step ${step.number}: ${step.label}`}
              aria-current={status === 'active' ? 'step' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStepClick(step.number);
                }
              }}
            >
              <div className={clsx('step-circle', status)}>
                {status === 'complete' ? <CheckIcon size={16} color="white" /> : step.number}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
