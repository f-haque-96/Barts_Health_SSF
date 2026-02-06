/**
 * NHS Supplier Setup Form - Zustand State Management Store
 * Manages form data, navigation, file uploads, and reviewer comments with persistence
 *
 * PERF-01: For production optimization, consider implementing:
 * - Debounced persistence (2-second delay after last change)
 * - Partial state updates (only persist changed sections)
 * - IndexedDB for larger data instead of localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFormStore = create(
  persist(
    (set, get) => ({
      // ===== Navigation State =====
      currentSection: 1,
      totalSections: 7,
      completedSections: new Set(),
      visitedSections: [1], // Track which sections have been visited

      // ===== Form Data =====
      formData: {},

      // ===== Field Touched State (for live validation) =====
      touchedFields: {},

      // ===== Uploaded Files =====
      // SECURITY: Files are stored in memory only, never persisted to localStorage
      // Users must re-upload documents if they refresh the page (for security)
      uploadedFiles: {},

      // ===== Reviewer Mode =====
      reviewerRole: null, // 'procurement' | 'ir35' | 'ap'
      reviewComments: {},
      authorisationState: {
        assessment: null, // 'standard' | 'opw_ir35'
        notes: '',
        signatureName: '',
        signatureDate: '',
        opwContract: null,
      },

      // ===== CRN Cache =====
      crnCache: {},

      // ===== Auto-save Status =====
      saveStatus: 'saved', // 'saved' | 'saving' | 'error'
      lastSaved: null,

      // ===== Submission State =====
      submissionId: null,
      submissionStatus: null,

      // ===== Prescreening Progress (for progressive disclosure) =====
      prescreeningProgress: {
        serviceCategoryAnswered: false,
        procurementEngaged: null, // null | 'yes' | 'no'
        procurementApproved: false, // PBP has approved
        questionnaireSubmitted: false,
        questionnaireId: null,
        approverName: null,
        approvalDate: null,
      },

      // ===== Rejection Data =====
      rejectionData: null, // Stores rejection details when submission is rejected

      // ==================== ACTIONS ====================

      // ----- Navigation Actions -----
      setCurrentSection: (section) => {
        if (section >= 1 && section <= get().totalSections) {
          set({ currentSection: section });
        }
      },

      nextSection: () => {
        const { currentSection, totalSections, visitedSections } = get();
        if (currentSection < totalSections) {
          const nextSection = currentSection + 1;

          // Add next section to visited sections if not already there
          const newVisited = visitedSections.includes(nextSection)
            ? visitedSections
            : [...visitedSections, nextSection];

          set({
            currentSection: nextSection,
            visitedSections: newVisited
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },

      prevSection: () => {
        const { currentSection, visitedSections } = get();
        if (currentSection > 1) {
          const prevSection = currentSection - 1;

          // Add previous section to visited sections if not already there
          const newVisited = visitedSections.includes(prevSection)
            ? visitedSections
            : [...visitedSections, prevSection];

          set({
            currentSection: prevSection,
            visitedSections: newVisited
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },

      goToSection: (section) => {
        const { canNavigateTo, visitedSections } = get();
        if (canNavigateTo(section)) {
          // Add to visited sections if not already there
          const newVisited = visitedSections.includes(section)
            ? visitedSections
            : [...visitedSections, section];

          set({
            currentSection: section,
            visitedSections: newVisited
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },

      canNavigateTo: (section) => {
        const { currentSection, completedSections } = get();

        // Can always go back to previous sections
        if (section <= currentSection) return true;

        // Can only go forward if all previous sections are complete
        for (let i = 1; i < section; i++) {
          if (!completedSections.has(i)) return false;
        }
        return true;
      },

      markSectionComplete: (section) => {
        set((state) => {
          const newCompleted = new Set(state.completedSections);
          newCompleted.add(section);
          return { completedSections: newCompleted };
        });
      },

      markSectionIncomplete: (section) => {
        set((state) => {
          const newCompleted = new Set(state.completedSections);
          newCompleted.delete(section);
          return { completedSections: newCompleted };
        });
      },

      // ----- Form Data Actions -----
      updateFormData: (field, value) => {
        set((state) => ({
          formData: { ...state.formData, [field]: value },
          saveStatus: 'saving',
        }));

        // Trigger auto-save after a short delay
        setTimeout(() => {
          set({ saveStatus: 'saved', lastSaved: new Date().toISOString() });
        }, 500);
      },

      updateMultipleFields: (fields) => {
        set((state) => ({
          formData: { ...state.formData, ...fields },
          saveStatus: 'saving',
        }));

        setTimeout(() => {
          set({ saveStatus: 'saved', lastSaved: new Date().toISOString() });
        }, 500);
      },

      getFieldValue: (field) => {
        return get().formData[field];
      },

      // ----- Touched Fields Actions -----
      setFieldTouched: (field, touched = true) => {
        set((state) => ({
          touchedFields: {
            ...state.touchedFields,
            [field]: touched,
          },
        }));
      },

      isFieldTouched: (field) => {
        return !!get().touchedFields[field];
      },

      clearTouchedFields: () => {
        set({ touchedFields: {} });
      },

      // ----- Prescreening Progress Actions -----
      updatePrescreeningProgress: (updates) => {
        set((state) => ({
          prescreeningProgress: {
            ...state.prescreeningProgress,
            ...updates,
          },
        }));
      },

      getPrescreeningProgress: () => {
        return get().prescreeningProgress;
      },

      resetPrescreeningProgress: () => {
        set({
          prescreeningProgress: {
            serviceCategoryAnswered: false,
            procurementEngaged: null,
            procurementApproved: false,
            questionnaireSubmitted: false,
            questionnaireId: null,
            approverName: null,
            approvalDate: null,
          },
        });
      },

      // ----- File Upload Actions -----
      setUploadedFile: (fieldName, fileData) => {
        set((state) => {
          const newUploads = {
            ...state.uploadedFiles,
            [fieldName]: {
              name: fileData.name,
              size: fileData.size,
              type: fileData.type,
              uploadDate: new Date().toISOString(),
              file: fileData.file, // File object (non-serializable, excluded from persist)
              base64: fileData.base64, // Base64 data (NOW PERSISTED via Zustand)
              data: fileData.base64, // Alias for backwards compatibility
            },
          };

          // BUG FIX: Zustand persist now handles uploadedFiles automatically
          // No manual localStorage calls needed
          return { uploadedFiles: newUploads };
        });
      },

      removeUploadedFile: (fieldName) => {
        set((state) => {
          const newFiles = { ...state.uploadedFiles };
          delete newFiles[fieldName];
          return { uploadedFiles: newFiles };
        });
      },

      getUploadedFile: (fieldName) => {
        return get().uploadedFiles[fieldName];
      },

      hasUploadedFile: (fieldName) => {
        return !!get().uploadedFiles[fieldName];
      },

      // ----- CRN Cache Actions -----
      setCRNData: (crn, data) => {
        set((state) => ({
          crnCache: {
            ...state.crnCache,
            [crn]: {
              ...data,
              timestamp: Date.now(),
            },
          },
        }));
      },

      getCRNData: (crn) => {
        const cached = get().crnCache[crn];
        if (!cached) return null;

        // Cache expires after 12 hours
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        if (Date.now() - cached.timestamp > TWELVE_HOURS) {
          return null;
        }

        return cached;
      },

      // ----- Reviewer Mode Actions -----
      setReviewerRole: (role) => {
        set({ reviewerRole: role });
      },

      addReviewComment: (sectionKey, comment) => {
        set((state) => ({
          reviewComments: {
            ...state.reviewComments,
            [sectionKey]: [
              ...(state.reviewComments[sectionKey] || []),
              {
                ...comment,
                timestamp: new Date().toISOString(),
                author: state.reviewerRole,
              },
            ],
          },
        }));
      },

      getReviewComments: (sectionKey) => {
        return get().reviewComments[sectionKey] || [];
      },

      updateAuthorisationState: (updates) => {
        set((state) => ({
          authorisationState: {
            ...state.authorisationState,
            ...updates,
          },
        }));
      },

      // ----- Rejection Actions -----
      setRejectionData: (rejection) => {
        set({ rejectionData: rejection });
      },

      clearRejectionData: () => {
        set({ rejectionData: null });
      },

      // ----- Reset & Clear Actions -----
      resetForm: () => {
        // Clear form data from localStorage
        localStorage.removeItem('formData');
        localStorage.removeItem('formUploads');
        localStorage.removeItem('questionnaireSubmission');
        localStorage.removeItem('currentSubmission');

        // Also clear any submission-related items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('submission-') ||
            key.startsWith('submission_') ||
            key.includes('questionnaire') ||
            key.includes('upload')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reset store state
        set({
          currentSection: 1,
          completedSections: new Set(),
          visitedSections: [1],
          formData: {},
          touchedFields: {},
          uploadedFiles: {},
          reviewComments: {},
          authorisationState: {
            assessment: null,
            notes: '',
            signatureName: '',
            signatureDate: '',
            opwContract: null,
          },
          prescreeningProgress: {
            serviceCategoryAnswered: false,
            procurementEngaged: null,
            procurementApproved: false,
            questionnaireSubmitted: false,
            questionnaireId: null,
            approverName: null,
            approvalDate: null,
          },
          saveStatus: 'saved',
          lastSaved: null,
          submissionId: null,
          submissionStatus: null,
        });
      },

      // Clear uploads specifically
      clearUploads: () => {
        localStorage.removeItem('formUploads');
        set({
          uploadedFiles: {}
        });
      },

      clearCache: () => {
        set({ crnCache: {} });
      },

      // ----- Submission Actions -----
      setSubmissionId: (id) => {
        set({ submissionId: id });
      },

      setSubmissionStatus: (status) => {
        set({ submissionStatus: status });
      },

      // ----- Utility Getters -----
      getFormProgress: () => {
        const { completedSections, totalSections } = get();
        return Math.round((completedSections.size / totalSections) * 100);
      },

      isFormComplete: () => {
        const { completedSections, totalSections } = get();
        return completedSections.size === totalSections;
      },

      canSubmitForm: () => {
        const { formData } = get();

        // Section 1: Requester Info - all required
        if (!formData.firstName || !formData.lastName || !formData.jobTitle ||
            !formData.department || !formData.nhsEmail || !formData.phoneNumber) {
          return false;
        }

        // Section 2: Pre-screening
        if (!formData.serviceCategory || !formData.procurementEngaged ||
            !formData.letterheadAvailable || !formData.soleTraderStatus ||
            !formData.usageFrequency || !formData.supplierConnection) {
          return false;
        }

        // Section 3: Classification
        if (!formData.companiesHouseRegistered) return false;
        if (!formData.supplierType) return false;

        // CRN only required if:
        // - Companies House Registered = YES
        // - AND supplier type is limited_company
        if (formData.companiesHouseRegistered === 'yes' && formData.supplierType === 'limited_company') {
          if (!formData.crn) return false;
        }

        // Charity needs charity fields
        if (formData.supplierType === 'charity') {
          if (!formData.charityNumber) return false;
          // CRN for charity only if registered with Companies House
          if (formData.companiesHouseRegistered === 'yes' && !formData.crnCharity) return false;
        }

        // Sole Trader needs ID type
        if (formData.supplierType === 'sole_trader' && !formData.idType) return false;

        // Organisation Type only required if supplier type is public_sector
        if (formData.supplierType === 'public_sector') {
          if (!formData.organisationType) return false;
        }

        // Always required regardless of type
        if (!formData.annualValue || !formData.employeeCount) {
          return false;
        }

        // Section 4: Supplier Details - all required
        if (!formData.companyName || !formData.registeredAddress || !formData.city ||
            !formData.postcode || !formData.contactName || !formData.contactEmail ||
            !formData.contactPhone) {
          return false;
        }

        // Section 5: Service Description - all required
        if (!formData.serviceType || formData.serviceType.length === 0 ||
            !formData.serviceDescription) {
          return false;
        }

        // Section 6: Financial Info
        if (!formData.overseasSupplier) return false;

        if (formData.overseasSupplier === 'yes') {
          if (!formData.iban || !formData.swiftCode || !formData.bankRouting) return false;
        }

        if (!formData.accountsAddressSame) return false;

        if (formData.accountsAddressSame === 'no') {
          if (!formData.accountsAddress || !formData.accountsCity ||
              !formData.accountsPostcode || !formData.accountsPhone ||
              !formData.accountsEmail) {
            return false;
          }
        }

        if (!formData.ghxDunsKnown) return false;
        if (formData.ghxDunsKnown === 'yes' && !formData.ghxDunsNumber) return false;

        if (!formData.cisRegistered) return false;
        if (formData.cisRegistered === 'yes' && !formData.utrNumber) return false;

        if (!formData.publicLiability) return false;
        if (formData.publicLiability === 'yes') {
          if (!formData.plCoverage || !formData.plExpiry) return false;
        }

        if (!formData.vatRegistered) return false;
        if (formData.vatRegistered === 'yes' && !formData.vatNumber) return false;

        if (!formData.cisRegistered) return false;
        if (formData.cisRegistered === 'yes' && !formData.utrNumber) return false;

        // All validations passed
        return true;
      },

      // Get list of missing mandatory fields for a section
      getMissingFields: (sectionNumber = 'all') => {
        const state = get();
        const { formData, uploadedFiles } = state;
        const missing = [];
        const section = sectionNumber; // Preserve compatibility

        switch(section) {
          case 1:
            if (!formData.firstName?.trim()) {
              missing.push('First Name');
            } else if (formData.firstName.trim().length > 50) {
              missing.push('First Name (maximum 50 characters)');
            }

            if (!formData.lastName?.trim()) {
              missing.push('Last Name');
            } else if (formData.lastName.trim().length > 50) {
              missing.push('Last Name (maximum 50 characters)');
            }

            if (!formData.jobTitle?.trim()) {
              missing.push('Job Title');
            } else if (formData.jobTitle.trim().length > 100) {
              missing.push('Job Title (maximum 100 characters)');
            }

            if (!formData.department?.trim()) {
              missing.push('Department');
            } else if (formData.department.trim().length > 100) {
              missing.push('Department (maximum 100 characters)');
            }

            if (!formData.nhsEmail?.trim()) {
              missing.push('NHS Email');
            } else {
              const allowedDomains = ['@nhs.net', '@nhs.uk', '@bartshealth.nhs.uk', '@nhs.scot', '@wales.nhs.uk'];
              const hasValidDomain = allowedDomains.some(domain => formData.nhsEmail.toLowerCase().endsWith(domain));
              if (!hasValidDomain) {
                missing.push('NHS Email (must be an NHS email address)');
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.nhsEmail)) {
                missing.push('NHS Email (invalid email format)');
              }
            }

            if (!formData.phoneNumber?.trim()) {
              missing.push('Phone Number');
            } else if (!/^[+]?[0-9 ()-]{7,15}$/.test(formData.phoneNumber)) {
              missing.push('Phone Number (invalid UK phone format)');
            }
            break;

          case 2:
            if (!formData.serviceCategory) missing.push('Service Category');
            if (!formData.procurementEngaged) missing.push('Procurement Engagement');
            if (!formData.letterheadAvailable) missing.push('Letterhead Available');
            if (!formData.soleTraderStatus) missing.push('Sole Trader Status');
            if (!formData.usageFrequency) missing.push('Usage Frequency');
            if (!formData.supplierConnection) missing.push('Supplier Connection');

            // Justification validation
            if (!formData.justification?.trim()) {
              missing.push('Justification');
            } else if (formData.justification.trim().length < 10) {
              missing.push('Justification (minimum 10 characters)');
            } else if (formData.justification.trim().length > 350) {
              missing.push('Justification (maximum 350 characters)');
            }

            // Conditional uploads
            // BUG FIX: Check for base64 or data (now persisted) OR file (in-memory)
            if (formData.procurementEngaged === 'yes' && !(uploadedFiles.procurementApproval?.base64 || uploadedFiles.procurementApproval?.data)) {
              missing.push('Procurement Approval Document');
            }
            if (formData.letterheadAvailable === 'yes' && !(uploadedFiles.letterhead?.base64 || uploadedFiles.letterhead?.data)) {
              missing.push('Letterhead with Bank Details');
            }
            if (formData.soleTraderStatus === 'yes') {
              if (!(uploadedFiles.cestForm?.base64 || uploadedFiles.cestForm?.data)) missing.push('CEST Form');
            }
            break;

          case 3:
            // Always required
            if (!formData.companiesHouseRegistered) missing.push('Companies House Registration Status');
            if (!formData.supplierType) missing.push('Supplier Type');

            // CRN validation for Limited Company
            if (formData.companiesHouseRegistered === 'yes') {
              if (formData.supplierType === 'limited_company') {
                if (!formData.crn) {
                  missing.push('Company Registration Number');
                } else if (!/^[0-9]{7,8}$/.test(formData.crn.replace(/\s/g, ''))) {
                  missing.push('Company Registration Number (must be 7 or 8 digits)');
                }
              }
            }

            // Charity-specific fields
            if (formData.supplierType === 'charity') {
              if (!formData.charityNumber) {
                missing.push('Charity Number');
              } else if (formData.charityNumber.length > 8) {
                missing.push('Charity Number (maximum 8 digits)');
              }
              // CRN for charity only if registered with Companies House
              if (formData.companiesHouseRegistered === 'yes') {
                if (!formData.crnCharity) {
                  missing.push('Charity Registration Number');
                } else if (!/^[0-9]{7,8}$/.test(formData.crnCharity.replace(/\s/g, ''))) {
                  missing.push('Charity Registration Number (must be 7 or 8 digits)');
                }
              }
            }

            // Sole trader-specific fields
            if (formData.supplierType === 'sole_trader') {
              if (!formData.idType) missing.push('ID Type');
              // BUG FIX: Check for base64 or data (now persisted)
              if (formData.idType === 'passport' && !(uploadedFiles.passportPhoto?.base64 || uploadedFiles.passportPhoto?.data)) {
                missing.push('Passport Photo');
              }
              if (formData.idType === 'driving_licence') {
                if (!(uploadedFiles.licenceFront?.base64 || uploadedFiles.licenceFront?.data)) missing.push('Driving Licence (Front)');
                if (!(uploadedFiles.licenceBack?.base64 || uploadedFiles.licenceBack?.data)) missing.push('Driving Licence (Back)');
              }
            }

            // Organisation Type only required if supplier type is public_sector
            if (formData.supplierType === 'public_sector') {
              if (!formData.organisationType) missing.push('Organisation Type');
            }

            // Always required regardless of type
            if (!formData.annualValue) {
              missing.push('Annual Value');
            } else if (formData.annualValue <= 0) {
              missing.push('Annual Value (must be greater than 0)');
            }
            if (!formData.employeeCount) missing.push('Employee Count');
            break;

          case 4:
            if (!formData.companyName?.trim()) {
              missing.push('Company Name');
            } else if (formData.companyName.trim().length > 100) {
              missing.push('Company Name (maximum 100 characters)');
            }

            if (!formData.registeredAddress?.trim()) {
              missing.push('Registered Address');
            } else if (formData.registeredAddress.trim().length > 300) {
              missing.push('Registered Address (maximum 300 characters)');
            }

            if (!formData.city?.trim()) {
              missing.push('City');
            } else if (formData.city.trim().length > 50) {
              missing.push('City (maximum 50 characters)');
            } else if (!/^[a-zA-Z\s\-]+$/.test(formData.city)) {
              missing.push('City (only letters, spaces, and hyphens allowed)');
            }

            if (!formData.postcode?.trim()) {
              missing.push('Postcode');
            } else if (!/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i.test(formData.postcode)) {
              missing.push('Postcode (invalid UK postcode format)');
            }

            if (!formData.contactName?.trim()) {
              missing.push('Contact Name');
            } else if (formData.contactName.trim().length > 100) {
              missing.push('Contact Name (maximum 100 characters)');
            }

            if (!formData.contactEmail?.trim()) {
              missing.push('Contact Email');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
              missing.push('Contact Email (invalid email format)');
            }

            if (!formData.contactPhone?.trim()) {
              missing.push('Contact Phone');
            } else if (!/^[+]?[0-9 ()-]{7,15}$/.test(formData.contactPhone)) {
              missing.push('Contact Phone (invalid UK phone format)');
            }

            // Website is optional but must be valid if provided
            if (formData.website && formData.website.trim() !== '') {
              if (!formData.website.startsWith('https://')) {
                missing.push('Website (must start with https://)');
              } else if (!/^https:\/\/.+\..+/.test(formData.website)) {
                missing.push('Website (invalid URL format)');
              }
            }
            break;

          case 5:
            if (!formData.serviceType || formData.serviceType.length === 0) {
              missing.push('Service Type');
            } else if (formData.serviceType.length > 7) {
              missing.push('Service Type (maximum 7 types allowed)');
            }

            if (!formData.serviceDescription?.trim()) {
              missing.push('Service Description');
            } else if (formData.serviceDescription.trim().length < 10) {
              missing.push('Service Description (minimum 10 characters)');
            } else if (formData.serviceDescription.trim().length > 350) {
              missing.push('Service Description (maximum 350 characters)');
            }
            break;

          case 6:
            if (!formData.overseasSupplier) missing.push('Overseas Supplier Status');

            // Overseas supplier validation (with format checks)
            if (formData.overseasSupplier === 'yes') {
              if (!formData.iban?.trim()) {
                missing.push('IBAN');
              } else if (formData.iban.replace(/\s/g, '').length < 15 || formData.iban.replace(/\s/g, '').length > 34) {
                missing.push('IBAN (must be 15-34 characters)');
              } else if (!/^[A-Z]{2}[0-9A-Z\s]+$/i.test(formData.iban)) {
                missing.push('IBAN (invalid format - must start with 2-letter country code)');
              }

              if (!formData.swiftCode?.trim()) {
                missing.push('SWIFT Code');
              } else {
                const swiftClean = formData.swiftCode.replace(/\s/g, '');
                if (swiftClean.length !== 8 && swiftClean.length !== 11) {
                  missing.push('SWIFT Code (must be 8 or 11 characters)');
                } else if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(swiftClean)) {
                  missing.push('SWIFT Code (invalid format)');
                }
              }

              if (!formData.bankRouting?.trim()) {
                missing.push('Bank Routing Number');
              } else if (!/^[0-9]{9}$/.test(formData.bankRouting.replace(/\s/g, ''))) {
                missing.push('Bank Routing Number (must be exactly 9 digits)');
              }
            }

            // UK supplier validation (with format checks)
            if (formData.overseasSupplier === 'no') {
              if (!formData.nameOnAccount?.trim()) {
                missing.push('Name on Account');
              } else if (formData.nameOnAccount.trim().length < 2) {
                missing.push('Name on Account (must be at least 2 characters)');
              }

              if (!formData.sortCode?.trim()) {
                missing.push('Sort Code');
              } else {
                const sortClean = formData.sortCode.replace(/[\s-]/g, '');
                if (!/^[0-9]{6}$/.test(sortClean)) {
                  missing.push('Sort Code (must be exactly 6 digits)');
                }
              }

              if (!formData.accountNumber?.trim()) {
                missing.push('Account Number');
              } else if (!/^[0-9]{8}$/.test(formData.accountNumber.trim())) {
                missing.push('Account Number (must be exactly 8 digits)');
              }
            }

            if (!formData.accountsAddressSame) missing.push('Accounts Address Same');
            if (formData.accountsAddressSame === 'no') {
              if (!formData.accountsAddress?.trim()) missing.push('Accounts Address');
              if (!formData.accountsCity?.trim()) missing.push('Accounts City');
              if (!formData.accountsPostcode?.trim()) {
                missing.push('Accounts Postcode');
              } else if (!/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i.test(formData.accountsPostcode)) {
                missing.push('Accounts Postcode (invalid UK postcode format)');
              }
              if (!formData.accountsPhone?.trim()) missing.push('Accounts Phone');
              if (!formData.accountsEmail?.trim()) {
                missing.push('Accounts Email');
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.accountsEmail)) {
                missing.push('Accounts Email (invalid email format)');
              }
            }

            if (!formData.ghxDunsKnown) missing.push('GHX/DUNS Known');
            if (formData.ghxDunsKnown === 'yes') {
              if (!formData.ghxDunsNumber?.trim()) {
                missing.push('GHX/DUNS Number');
              } else {
                const dunsClean = formData.ghxDunsNumber.replace(/[\s-]/g, '');
                if (!/^[0-9]{9}$/.test(dunsClean)) {
                  missing.push('GHX/DUNS Number (must be exactly 9 digits)');
                }
              }
            }

            if (!formData.cisRegistered) missing.push('CIS Registration Status');
            if (formData.cisRegistered === 'yes') {
              if (!formData.utrNumber?.trim()) {
                missing.push('UTR Number');
              } else {
                const utrClean = formData.utrNumber.replace(/\s/g, '');
                if (!/^[0-9]{10}$/.test(utrClean)) {
                  missing.push('UTR Number (must be exactly 10 digits)');
                }
              }
            }

            if (!formData.publicLiability) missing.push('Public Liability Insurance');
            if (formData.publicLiability === 'yes') {
              if (!formData.plCoverage) {
                missing.push('Public Liability Coverage');
              } else if (formData.plCoverage <= 0) {
                missing.push('Public Liability Coverage (must be greater than 0)');
              }
              if (!formData.plExpiry) {
                missing.push('Public Liability Expiry Date');
              } else {
                const expiry = new Date(formData.plExpiry);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (expiry < today) {
                  missing.push('Public Liability Expiry Date (must be today or in the future)');
                }
              }
            }

            if (!formData.vatRegistered) missing.push('VAT Registration Status');
            if (formData.vatRegistered === 'yes') {
              if (!formData.vatNumber?.trim()) {
                missing.push('VAT Number');
              } else {
                const vatClean = formData.vatNumber.replace(/\s/g, '').toUpperCase();
                const withoutGB = vatClean.startsWith('GB') ? vatClean.slice(2) : vatClean;
                if (!/^[0-9]{9,12}$/.test(withoutGB)) {
                  missing.push('VAT Number (must be 9 or 12 digits after optional GB prefix)');
                }
              }
            }
            break;

          case 7:
            // Section 7 has its own validation via the checkbox
            break;

          default:
            break;
        }

        // UPLOAD VALIDATION - Check when validating Section 7 or all sections
        if (sectionNumber === 7 || sectionNumber === 'all') {
          const section2 = formData?.section2 || formData || {};
          const section3 = formData?.section3 || formData || {};
          const currentUploads = uploadedFiles || state.uploads || {};

          // Letterhead with Bank Details - ALWAYS REQUIRED
          if (!currentUploads?.letterhead?.base64 && !currentUploads?.letterhead?.data) {
            missing.push('Letterhead with Bank Details (Upload Required)');
          }

          // Procurement Approval - Required if engaged with procurement
          if (section2?.procurementEngaged === 'yes' || formData?.procurementEngaged === 'yes' || formData?.hasProcurementApproval === 'yes') {
            if (!currentUploads?.procurementApproval?.base64 && !currentUploads?.procurementApproval?.data) {
              missing.push('Procurement Approval Document (Upload Required)');
            }
          }

          // CEST Form - Required for Sole Traders
          if (section3?.supplierType === 'sole_trader' || section3?.supplierType === 'individual' || formData?.supplierType === 'sole_trader' || formData?.soleTraderStatus === 'yes') {
            if (!currentUploads?.cestForm?.base64 && !currentUploads?.cestForm?.data) {
              missing.push('CEST Form (Upload Required for Sole Traders)');
            }
          }

          // Passport/ID - Required for Sole Traders
          if (section3?.supplierType === 'sole_trader' || section3?.supplierType === 'individual' || formData?.supplierType === 'sole_trader' || formData?.soleTraderStatus === 'yes') {
            const hasPassport = currentUploads?.passportPhoto?.base64 || currentUploads?.passportPhoto?.data;
            const hasLicenceFront = currentUploads?.licenceFront?.base64 || currentUploads?.licenceFront?.data;
            const hasLicenceBack = currentUploads?.licenceBack?.base64 || currentUploads?.licenceBack?.data;

            // At least passport OR both licence sides required
            if (!hasPassport && !(hasLicenceFront && hasLicenceBack)) {
              missing.push('Passport or Driving Licence (Upload Required for Sole Traders)');
            }
          }
        }

        return missing;
      },

      // Get status of a section: 'complete', 'incomplete', 'active', 'pending'
      getSectionStatus: (section) => {
        const { currentSection, visitedSections, getMissingFields } = get();

        // Current section is always active
        if (section === currentSection) return 'active';

        // Check if section has been visited
        const hasVisited = visitedSections.includes(section);

        // If not visited, it's pending
        if (!hasVisited) return 'pending';

        // If visited, check for missing fields
        const missing = getMissingFields(section);

        // If no missing fields, it's complete
        if (missing.length === 0) return 'complete';

        // If has missing fields and visited, it's incomplete
        return 'incomplete';
      },

      getAllFormData: () => {
        const { formData, uploadedFiles } = get();
        return {
          formData,
          uploadedFiles: Object.keys(uploadedFiles).reduce((acc, key) => {
            // Return metadata only, exclude file object and base64
            const { file, base64, ...metadata } = uploadedFiles[key];
            acc[key] = metadata;
            return acc;
          }, {}),
        };
      },
    }),
    {
      name: 'nhs-supplier-form-storage',
      partialize: (state) => {
        // SECURITY: Exclude sensitive financial data from localStorage persistence
        const { sortCode, accountNumber, iban, swiftCode, ...safeFormData } = state.formData;

        // BUG FIX: Include uploadedFiles in Zustand persist (strip non-serializable File objects)
        // This fixes the race condition where uploadedFiles was reset to {} during rehydration
        const serializedUploads = Object.keys(state.uploadedFiles).reduce((acc, key) => {
          if (state.uploadedFiles[key]) {
            const { file, ...rest } = state.uploadedFiles[key]; // Remove File object
            acc[key] = rest; // Keep name, size, type, uploadDate, base64
          }
          return acc;
        }, {});

        return {
          // Only persist these fields
          currentSection: state.currentSection,
          completedSections: Array.from(state.completedSections),
          visitedSections: state.visitedSections,
          formData: safeFormData, // Excludes bank details
          uploadedFiles: serializedUploads, // NOW PERSISTED (without File objects)
          reviewComments: state.reviewComments,
          authorisationState: state.authorisationState,
          prescreeningProgress: state.prescreeningProgress,
          crnCache: state.crnCache,
          lastSaved: state.lastSaved,
          submissionId: state.submissionId,
          submissionStatus: state.submissionStatus,
          // NOTE: Bank details (sortCode, accountNumber, iban, swiftCode) are NOT persisted for security
        };
      },
      // Custom deserializer to reconstruct Set from array
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.completedSections)) {
          state.completedSections = new Set(state.completedSections);
        }
      },
    }
  )
);

export default useFormStore;
