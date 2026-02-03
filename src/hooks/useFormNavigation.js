/**
 * useFormNavigation Hook
 * Handles form section navigation logic
 */

import { useCallback } from 'react';
import useFormStore from '../stores/formStore';

const useFormNavigation = () => {
  const {
    currentSection,
    nextSection,
    prevSection,
    goToSection,
    canNavigateTo,
    markSectionComplete,
    markSectionIncomplete,
  } = useFormStore();

  const handleNext = useCallback(() => {
    // Mark current section as complete before moving forward
    markSectionComplete(currentSection);
    nextSection();
  }, [currentSection, markSectionComplete, nextSection]);

  const handlePrev = useCallback(() => {
    prevSection();
  }, [prevSection]);

  const handleGoTo = useCallback(
    (section) => {
      if (canNavigateTo(section)) {
        goToSection(section);
      }
    },
    [canNavigateTo, goToSection]
  );

  return {
    currentSection,
    handleNext,
    handlePrev,
    handleGoTo,
    canNavigateTo,
    markSectionComplete,
    markSectionIncomplete,
  };
};

export default useFormNavigation;
