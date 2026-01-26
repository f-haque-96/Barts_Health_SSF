/**
 * NHS Supplier Setup Form - Zustand State Management Store
 * Manages form data, navigation, file uploads, and reviewer comments with persistence
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
      // Note: Files are now persisted to localStorage including base64 data
      uploadedFiles: (() => {
        try {
          const saved = localStorage.getItem('formUploads');
          if (saved) {
            const parsed = JSON.parse(saved);
            console.log('Loaded uploads from localStorage:', Object.keys(parsed));
            return parsed;
          }
        } catch (e) {
          console.error('Failed to load uploads from localStorage:', e);
        }
        return {};
      })(),

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
              // File object itself is not persisted, but base64 is
              file: fileData.file,
              base64: fileData.base64, // Store base64 for persistence
            },
          };

          // Persist to localStorage
          try {
            localStorage.setItem('formUploads', JSON.stringify(newUploads));
            console.log('Uploads saved to localStorage:', Object.keys(newUploads));
          } catch (e) {
            console.error('Failed to save uploads to localStorage:', e);
          }

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

      // ----- Reset & Clear Actions -----
      resetForm: () => {
        console.log('=== RESETTING FORM ===');

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

        console.log('Cleared localStorage keys:', keysToRemove);

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
            if (!formData.firstName?.trim()) missing.push('First Name');
            if (!formData.lastName?.trim()) missing.push('Last Name');
            if (!formData.jobTitle?.trim()) missing.push('Job Title');
            if (!formData.department?.trim()) missing.push('Department');
            if (!formData.nhsEmail?.trim()) missing.push('NHS Email');
            if (!formData.phoneNumber?.trim()) missing.push('Phone Number');
            break;

          case 2:
            if (!formData.serviceCategory) missing.push('Service Category');
            if (!formData.procurementEngaged) missing.push('Procurement Engagement');
            if (!formData.letterheadAvailable) missing.push('Letterhead Available');
            if (!formData.soleTraderStatus) missing.push('Sole Trader Status');
            if (!formData.usageFrequency) missing.push('Usage Frequency');
            if (!formData.supplierConnection) missing.push('Supplier Connection');

            // Conditional uploads
            if (formData.procurementEngaged === 'yes' && !uploadedFiles.procurementApproval) {
              missing.push('Procurement Approval Document');
            }
            if (formData.letterheadAvailable === 'yes' && !uploadedFiles.letterhead) {
              missing.push('Letterhead with Bank Details');
            }
            if (formData.soleTraderStatus === 'yes') {
              if (!uploadedFiles.cestForm) missing.push('CEST Form');
            }
            break;

          case 3:
            console.log('=== SECTION 3 VALIDATION DEBUG ===');
            console.log('companiesHouseRegistered:', formData.companiesHouseRegistered);
            console.log('supplierType:', formData.supplierType);
            console.log('organisationType:', formData.organisationType);
            console.log('crn:', formData.crn);
            console.log('charityNumber:', formData.charityNumber);

            // Always required
            if (!formData.companiesHouseRegistered) missing.push('Companies House Registration Status');
            if (!formData.supplierType) missing.push('Supplier Type');

            // CRN only required if:
            // - Companies House Registered = YES
            // - AND supplier type is limited_company
            if (formData.companiesHouseRegistered === 'yes') {
              if (formData.supplierType === 'limited_company' && !formData.crn) {
                missing.push('Company Registration Number');
              }
            }

            // Charity-specific fields
            if (formData.supplierType === 'charity') {
              if (!formData.charityNumber) missing.push('Charity Number');
              // CRN for charity only if registered with Companies House
              if (formData.companiesHouseRegistered === 'yes' && !formData.crnCharity) {
                missing.push('Charity Registration Number');
              }
            }

            // Sole trader-specific fields
            if (formData.supplierType === 'sole_trader') {
              if (!formData.idType) missing.push('ID Type');
              if (formData.idType === 'passport' && !uploadedFiles.passportPhoto) {
                missing.push('Passport Photo');
              }
              if (formData.idType === 'driving_licence') {
                if (!uploadedFiles.licenceFront) missing.push('Driving Licence (Front)');
                if (!uploadedFiles.licenceBack) missing.push('Driving Licence (Back)');
              }
            }

            // Organisation Type only required if supplier type is public_sector
            if (formData.supplierType === 'public_sector') {
              if (!formData.organisationType) missing.push('Organisation Type');
            }

            // Always required regardless of type
            if (!formData.annualValue) missing.push('Annual Value');
            if (!formData.employeeCount) missing.push('Employee Count');

            console.log('Section 3 missing fields:', missing.filter(f =>
              ['Companies House Registration Status', 'Supplier Type', 'Annual Value',
               'Employee Count', 'Company Registration Number',
               'Charity Number', 'Organisation Type', 'ID Type', 'Passport Photo',
               'Driving Licence (Front)', 'Driving Licence (Back)', 'Charity Registration Number'].includes(f)
            ));
            break;

          case 4:
            if (!formData.companyName?.trim()) missing.push('Company Name');
            if (!formData.registeredAddress?.trim()) missing.push('Registered Address');
            if (!formData.city?.trim()) missing.push('City');
            if (!formData.postcode?.trim()) missing.push('Postcode');
            if (!formData.contactName?.trim()) missing.push('Contact Name');
            if (!formData.contactEmail?.trim()) missing.push('Contact Email');
            if (!formData.contactPhone?.trim()) missing.push('Contact Phone');
            break;

          case 5:
            if (!formData.serviceType || formData.serviceType.length === 0) {
              missing.push('Service Type');
            }
            if (!formData.serviceDescription?.trim()) missing.push('Service Description');
            break;

          case 6:
            if (!formData.overseasSupplier) missing.push('Overseas Supplier Status');
            if (formData.overseasSupplier === 'yes') {
              if (!formData.iban?.trim()) missing.push('IBAN');
              if (!formData.swiftCode?.trim()) missing.push('SWIFT Code');
              if (!formData.bankRouting?.trim()) missing.push('Bank Routing Number');
            }
            if (!formData.accountsAddressSame) missing.push('Accounts Address Same');
            if (formData.accountsAddressSame === 'no') {
              if (!formData.accountsAddress?.trim()) missing.push('Accounts Address');
              if (!formData.accountsCity?.trim()) missing.push('Accounts City');
              if (!formData.accountsPostcode?.trim()) missing.push('Accounts Postcode');
              if (!formData.accountsPhone?.trim()) missing.push('Accounts Phone');
              if (!formData.accountsEmail?.trim()) missing.push('Accounts Email');
            }
            if (!formData.ghxDunsKnown) missing.push('GHX/DUNS Known');
            if (formData.ghxDunsKnown === 'yes' && !formData.ghxDunsNumber?.trim()) {
              missing.push('GHX/DUNS Number');
            }
            if (!formData.cisRegistered) missing.push('CIS Registration Status');
            if (formData.cisRegistered === 'yes' && !formData.utrNumber?.trim()) {
              missing.push('UTR Number');
            }
            if (!formData.publicLiability) missing.push('Public Liability Insurance');
            if (formData.publicLiability === 'yes') {
              if (!formData.plCoverage) missing.push('Public Liability Coverage');
              if (!formData.plExpiry) missing.push('Public Liability Expiry Date');
            }
            if (!formData.vatRegistered) missing.push('VAT Registration Status');
            if (formData.vatRegistered === 'yes' && !formData.vatNumber?.trim()) {
              missing.push('VAT Number');
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

          console.log('Upload validation - Current uploads:', currentUploads);
          console.log('Upload validation - Missing:', missing.filter(m => m.includes('Upload')));
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
            // Return metadata including base64, but exclude file object
            const { file, ...metadata } = uploadedFiles[key];
            acc[key] = {
              ...metadata,
              // Ensure base64 is included
              base64: uploadedFiles[key].base64
            };
            return acc;
          }, {}),
        };
      },
    }),
    {
      name: 'nhs-supplier-form-storage',
      partialize: (state) => ({
        // Only persist these fields
        currentSection: state.currentSection,
        completedSections: Array.from(state.completedSections),
        visitedSections: state.visitedSections,
        formData: state.formData,
        reviewComments: state.reviewComments,
        authorisationState: state.authorisationState,
        prescreeningProgress: state.prescreeningProgress,
        crnCache: state.crnCache,
        lastSaved: state.lastSaved,
        submissionId: state.submissionId,
        submissionStatus: state.submissionStatus,
        // NOTE: uploadedFiles are NOT persisted (file objects can't be serialized)
        // Users will need to re-upload files if they refresh
      }),
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
