/**
 * NHS Barts Health Supplier Setup Form
 * Main Application Component
 */

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import useFormStore from './stores/formStore';
import { getQueryParam } from './utils/helpers';

// Main Form Component
const MainForm = () => {
  const { currentSection, setReviewerRole } = useFormStore();

  // Check for reviewer role in URL
  useEffect(() => {
    const role = getQueryParam('role');
    if (role && ['procurement', 'ir35', 'ap'].includes(role)) {
      setReviewerRole(role);
    }
  }, [setReviewerRole]);

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
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainForm />} />
      <Route path="/pbp-review/:submissionId" element={<PBPReviewPage />} />
      <Route path="/procurement-review/:submissionId" element={<ProcurementReviewPage />} />
      <Route path="/opw-review/:submissionId" element={<OPWReviewPage />} />
      <Route path="/contract-drafter/:submissionId" element={<ContractDrafterPage />} />
      <Route path="/ap-review/:submissionId" element={<APControlReviewPage />} />
      <Route path="/respond/:submissionId" element={<RequesterResponsePage />} />
      <Route path="/help/faq" element={<HelpPage />} />
    </Routes>
  );
}

export default App;
