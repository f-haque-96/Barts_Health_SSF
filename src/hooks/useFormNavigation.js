/**
 * useFormNavigation Hook
 * Handles form section navigation logic
 * L7: Scroll side effect moved here from Zustand store (separation of concerns)
 */

import { useCallback, useEffect, useRef } from 'react';
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

  // L7: Track section changes and scroll to top
  const prevSectionRef = useRef(currentSection);
  useEffect(() => {
    if (prevSectionRef.current !== currentSection) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevSectionRef.current = currentSection;
    }
  }, [currentSection]);

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
