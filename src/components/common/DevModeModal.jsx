/**
 * DevModeModal Component
 * Development-only modal for quick access to authorization pages and section skipping
 * NEVER appears in production builds (!import.meta.env.PROD)
 */

import { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import Button from './Button';
import useFormStore from '../../stores/formStore';
import './DevModeModal.css';

const DevModeModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('pages');
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState('');
  const { setCurrentSection, currentSection } = useFormStore();

  // Load submissions from localStorage
  useEffect(() => {
    if (!isOpen) return;

    try {
      const allSubmissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      // Batch state updates to avoid cascading renders
      setSubmissions(allSubmissions);
      if (allSubmissions.length > 0 && !selectedSubmission) {
        setSelectedSubmission(allSubmissions[0].submissionId);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }, [isOpen, selectedSubmission]);

  if (!isOpen) return null;

  const handleSkipSection = () => {
    const confirmed = window.confirm(
      `Are you sure you want to skip to the next section?\n\nCurrent: Section ${currentSection}\nNext: Section ${currentSection + 1}\n\nThis is for development testing only.`
    );

    if (confirmed && currentSection < 7) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToSection = (sectionNum) => {
    const confirmed = window.confirm(
      `Jump to Section ${sectionNum}?\n\nThis is for development testing only. Any unsaved changes in the current section may be lost.`
    );

    if (confirmed) {
      setCurrentSection(sectionNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClose();
    }
  };

  const authPages = [
    { name: 'PBP Review', path: '/pbp-review', color: '#005EB8' },
    { name: 'Procurement Review', path: '/procurement-review', color: '#007F3B' },
    { name: 'OPW/IR35 Review', path: '/opw-review', color: '#7C2855' },
    { name: 'AP Control', path: '/ap-review', color: '#ED8B00' },
    { name: 'Requester Response', path: '/respond', color: '#8A1538' },
  ];

  const handleNavigateToReview = (path) => {
    if (!selectedSubmission) {
      alert('Please select a submission first or create a test submission in Section 7');
      return;
    }
    // Open in new tab
    window.open(`${path}/${selectedSubmission}`, '_blank');
    onClose();
  };

  const sections = [
    { num: 1, name: 'Requester Information' },
    { num: 2, name: 'Pre-screening' },
    { num: 3, name: 'Supplier Classification' },
    { num: 4, name: 'Supplier Details' },
    { num: 5, name: 'Service Description' },
    { num: 6, name: 'Financial & Accounts' },
    { num: 7, name: 'Review & Submit' },
  ];

  return (
    <div className="dev-modal-overlay" onClick={onClose}>
      <div className="dev-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="dev-modal-header">
          <h3 style={{ margin: 0, color: '#1f2937', fontWeight: '600', fontSize: '1.125rem' }}>
            Development Mode
          </h3>
          <button className="dev-modal-close" onClick={onClose} aria-label="Close">
            <XIcon size={20} />
          </button>
        </div>

        <div className="dev-modal-tabs">
          <button
            className={`dev-tab ${activeTab === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTab('pages')}
          >
            Authorization Pages
          </button>
          <button
            className={`dev-tab ${activeTab === 'sections' ? 'active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            Section Navigation
          </button>
        </div>

        <div className="dev-modal-body">
          {activeTab === 'pages' ? (
            <>
              <p style={{ marginTop: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Quick access to all authorization review pages for testing workflows
              </p>

              {/* Submission Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Select Submission:
                </label>
                <select
                  value={selectedSubmission}
                  onChange={(e) => setSelectedSubmission(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  {submissions.length === 0 ? (
                    <option value="">No submissions found - create one in Section 7</option>
                  ) : (
                    submissions.map((sub) => (
                      <option key={sub.submissionId} value={sub.submissionId}>
                        {sub.submissionId} - {sub.status} ({new Date(sub.submissionDate).toLocaleDateString()})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Review Page Buttons */}
              <div className="dev-page-links">
                {authPages.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => handleNavigateToReview(page.path)}
                    className="dev-page-link"
                    style={{
                      borderLeft: `4px solid ${page.color}`,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    disabled={!selectedSubmission}
                  >
                    <span style={{ fontWeight: '600', color: page.color }}>{page.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {selectedSubmission ? `${page.path}/${selectedSubmission}` : 'Select a submission first'}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: submissions.length === 0 ? '#fee2e2' : '#fef3c7',
                border: `1px solid ${submissions.length === 0 ? '#ef4444' : '#fbbf24'}`,
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: submissions.length === 0 ? '#991b1b' : '#92400e'
              }}>
                <strong>{submissions.length === 0 ? 'No Submissions Found:' : 'Note:'}</strong> {submissions.length === 0
                  ? 'Use the Development Testing Tools in Section 7 to create test submissions first.'
                  : 'These pages require test submissions to display data. Select a submission above to navigate.'}
              </div>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                Jump to any section or skip the current section for rapid testing
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontWeight: '600' }}>Current Section: {currentSection}</span>
                  <Button
                    variant="primary"
                    onClick={handleSkipSection}
                    disabled={currentSection >= 7}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Skip to Section {currentSection + 1} →
                  </Button>
                </div>
              </div>
              <div className="dev-section-grid">
                {sections.map((section) => (
                  <button
                    key={section.num}
                    className={`dev-section-button ${currentSection === section.num ? 'current' : ''}`}
                    onClick={() => handleJumpToSection(section.num)}
                  >
                    <div className="dev-section-number">{section.num}</div>
                    <div className="dev-section-name">{section.name}</div>
                  </button>
                ))}
              </div>
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#991b1b'
              }}>
                <strong>Warning:</strong> Skipping sections may result in validation errors when submitting. Use for testing navigation only.
              </div>
            </>
          )}
        </div>

        <div className="dev-modal-footer">
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Development Mode Only • Not available in production
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DevModeModal;
