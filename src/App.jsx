/**
 * NHS Barts Health Supplier Setup Form
 * Main Application Component
 *
 * SECURITY: All review routes are protected with RBAC
 */

import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, ROLES } from './context/AuthContext';
import { ProtectedRoute, SecureReviewPage, RejectionBanner } from './components/common';
import { Header, Footer, ProgressIndicator } from './components/layout';
import { HelpButton } from './components/common';
import Section1RequesterInfo from './components/sections/Section1RequesterInfo';
import Section2PreScreening from './components/sections/Section2PreScreening';
import Section3Classification from './components/sections/Section3Classification';
import Section4SupplierDetails from './components/sections/Section4SupplierDetails';
import Section5ServiceDescription from './components/sections/Section5ServiceDescription';
import Section6FinancialInfo from './components/sections/Section6FinancialInfo';
import Section7ReviewSubmit from './components/sections/Section7ReviewSubmit';
import PBPReviewPage from './pages/PBPReviewPage';
import ProcurementReviewPage from './pages/ProcurementReviewPage';
import OPWReviewPage from './pages/OPWReviewPage';
import APControlReviewPage from './pages/APControlReviewPage';
import ContractDrafterPage from './pages/ContractDrafterPage';
import RequesterResponsePage from './pages/RequesterResponsePage';
import HelpPage from './pages/HelpPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import useFormStore from './stores/formStore';
import { getQueryParam } from './utils/helpers';

// Main Form Component (Public - any authenticated user can submit)
const MainForm = () => {
  const { currentSection, setReviewerRole, formData, resetForm } = useFormStore();
  const [rejectionData, setRejectionData] = useState(null);
  const [showRejectionBanner, setShowRejectionBanner] = useState(false);

  // Check for rejected submissions by current user
  useEffect(() => {
    try {
      const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const userEmail = formData.nhsEmail;

      if (userEmail) {
        // Find most recent rejected submission by this user
        const rejectedSubmissions = allSubmissions.filter(
          (sub) =>
            sub.submittedBy === userEmail &&
            (sub.status === 'rejected' || sub.status?.toLowerCase().includes('rejected'))
        );

        if (rejectedSubmissions.length > 0) {
          // Get the most recent rejection
          const mostRecent = rejectedSubmissions.sort(
            (a, b) => new Date(b.submissionDate) - new Date(a.submissionDate)
          )[0];

          // Load full submission data to get rejection details
          const fullSubmission = JSON.parse(
            localStorage.getItem(`submission_${mostRecent.submissionId}`) || '{}'
          );

          // Extract rejection info from the submission
          let rejectionInfo = null;
          if (fullSubmission.pbpReview?.decision === 'rejected') {
            rejectionInfo = {
              submissionId: mostRecent.submissionId,
              rejectedBy: fullSubmission.pbpReview.reviewedBy || 'PBP Reviewer',
              rejectedByRole: 'PBP',
              rejectionReason: fullSubmission.pbpReview.finalComments || 'No reason provided',
              rejectionDate: fullSubmission.pbpReview.reviewedAt || mostRecent.submissionDate,
              supplierName: fullSubmission.formData?.supplierName || 'Unknown Supplier',
            };
          } else if (fullSubmission.procurementReview?.decision === 'rejected') {
            rejectionInfo = {
              submissionId: mostRecent.submissionId,
              rejectedBy:
                fullSubmission.procurementReview.reviewedBy || 'Procurement Reviewer',
              rejectedByRole: 'Procurement',
              rejectionReason:
                fullSubmission.procurementReview.comments || 'No reason provided',
              rejectionDate:
                fullSubmission.procurementReview.reviewedAt || mostRecent.submissionDate,
              supplierName: fullSubmission.formData?.supplierName || 'Unknown Supplier',
            };
          } else if (fullSubmission.opwReview?.decision === 'rejected') {
            rejectionInfo = {
              submissionId: mostRecent.submissionId,
              rejectedBy: fullSubmission.opwReview.signature || 'OPW Panel Member',
              rejectedByRole: 'OPW Panel',
              rejectionReason:
                fullSubmission.opwReview.rejectionReason || 'No reason provided',
              rejectionDate: fullSubmission.opwReview.date || mostRecent.submissionDate,
              supplierName: fullSubmission.formData?.supplierName || 'Unknown Supplier',
            };
          } else if (fullSubmission.apReview?.decision === 'rejected') {
            rejectionInfo = {
              submissionId: mostRecent.submissionId,
              rejectedBy: fullSubmission.apReview.reviewedBy || 'AP Control',
              rejectedByRole: 'AP Control',
              rejectionReason:
                fullSubmission.apReview.rejectionReason || 'No reason provided',
              rejectionDate: fullSubmission.apReview.reviewedAt || mostRecent.submissionDate,
              supplierName: fullSubmission.formData?.supplierName || 'Unknown Supplier',
            };
          }

          if (rejectionInfo) {
            setRejectionData(rejectionInfo);
            setShowRejectionBanner(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for rejections:', error);
    }
  }, [formData.nhsEmail]);

  // Check for reviewer role in URL
  useEffect(() => {
    const role = getQueryParam('role');
    if (role && ['procurement', 'ir35', 'ap'].includes(role)) {
      setReviewerRole(role);
    }
  }, [setReviewerRole]);

  // Handle Submit Another Supplier button click
  const handleSubmitAnother = () => {
    setShowRejectionBanner(false);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render current section
  const renderSection = () => {
    switch (currentSection) {
      case 1:
        return <Section1RequesterInfo />;
      case 2:
        return <Section2PreScreening />;
      case 3:
        return <Section3Classification />;
      case 4:
        return <Section4SupplierDetails />;
      case 5:
        return <Section5ServiceDescription />;
      case 6:
        return <Section6FinancialInfo />;
      case 7:
        return <Section7ReviewSubmit />;
      default:
        return <Section1RequesterInfo />;
    }
  };

  return (
    <div className="app">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <main className="main-container" id="main-content">
        <div className="form-container">
          {/* Progress Section */}
          <div className="progress-section">
            <ProgressIndicator />
          </div>

          {/* Form Sections */}
          <div className="form-sections">
            {renderSection()}
          </div>
        </div>
      </main>

      <Footer />
      <HelpButton />

      {/* Rejection Banner - Shows when user has rejected submissions */}
      {showRejectionBanner && rejectionData && (
        <RejectionBanner
          rejection={rejectionData}
          onDismiss={() => setShowRejectionBanner(false)}
          onSubmitAnother={handleSubmitAnother}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainForm />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/help/faq" element={<HelpPage />} />

        {/* Requester response - accessible by submission owner */}
        <Route
          path="/respond/:submissionId"
          element={
            <ProtectedRoute>
              <SecureReviewPage>
                <RequesterResponsePage />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* PBP Review - requires PBP role */}
        <Route
          path="/pbp-review/:submissionId"
          element={
            <ProtectedRoute requiredRole={ROLES.PBP}>
              <SecureReviewPage requiredRole={ROLES.PBP}>
                <PBPReviewPage />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* Procurement Review - requires Procurement role */}
        <Route
          path="/procurement-review/:submissionId"
          element={
            <ProtectedRoute requiredRole={ROLES.PROCUREMENT}>
              <SecureReviewPage requiredRole={ROLES.PROCUREMENT}>
                <ProcurementReviewPage />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* OPW Review - requires OPW role */}
        <Route
          path="/opw-review/:submissionId"
          element={
            <ProtectedRoute requiredRole={ROLES.OPW}>
              <SecureReviewPage requiredRole={ROLES.OPW}>
                <OPWReviewPage />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* Contract Drafter - requires Contract role */}
        <Route
          path="/contract-drafter/:submissionId"
          element={
            <ProtectedRoute requiredRole={ROLES.CONTRACT}>
              <SecureReviewPage requiredRole={ROLES.CONTRACT}>
                <ContractDrafterPage />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* AP Control Review - requires AP Control role */}
        <Route
          path="/ap-review/:submissionId"
          element={
            <ProtectedRoute requiredRole={ROLES.AP_CONTROL}>
              <SecureReviewPage requiredRole={ROLES.AP_CONTROL}>
                <APControlReviewPage />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* Preview routes - read-only versions accessible to authenticated users */}
        <Route
          path="/preview/pbp/:submissionId"
          element={
            <ProtectedRoute>
              <SecureReviewPage>
                <PBPReviewPage readOnly={true} />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/preview/procurement/:submissionId"
          element={
            <ProtectedRoute>
              <SecureReviewPage>
                <ProcurementReviewPage readOnly={true} />
              </SecureReviewPage>
            </ProtectedRoute>
          }
        />

        {/* Catch-all for 404 */}
        <Route
          path="*"
          element={
            <div style={{
              maxWidth: '600px',
              margin: '100px auto',
              padding: '40px',
              textAlign: 'center'
            }}>
              <h1 style={{ color: '#374151', marginBottom: '16px' }}>Page Not Found</h1>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                The page you're looking for doesn't exist.
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#005EB8',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px'
                }}
              >
                Return to Home
              </a>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
