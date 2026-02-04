/**
 * HelpPage Component
 * FAQ and help resources for the Supplier Setup Form
 */

import React from 'react';
import { TicketIcon } from '../components/common';
import './HelpPage.css';

const HelpPage = () => {
  const faqs = [
    {
      question: 'What is the Supplier Setup Form?',
      answer:
        'The Supplier Setup Form is used to register new suppliers with NHS Barts Health Trust. It collects all necessary information for procurement, finance, and compliance purposes.',
    },
    {
      question: 'What information do I need from the supplier?',
      answer: (
        <div>
          <p><strong>You'll need the following information from your supplier to complete the form:</strong></p>

          <h4 style={{ marginTop: '15px', color: '#005EB8' }}>Section 3: Supplier Classification</h4>
          <ul style={{ marginLeft: '20px' }}>
            <li>Supplier type (Limited Company, Sole Trader, Charity, or Public Sector)</li>
            <li>Company Registration Number (CRN) if registered with Companies House</li>
            <li>Charity number (if applicable)</li>
            <li>For sole traders: Photo ID (passport or driving licence)</li>
          </ul>

          <h4 style={{ marginTop: '15px', color: '#005EB8' }}>Section 4: Company Details</h4>
          <ul style={{ marginLeft: '20px' }}>
            <li>Full legal company name</li>
            <li>Trading name (if different from legal name)</li>
            <li>Registered address (full address with postcode)</li>
            <li>Main contact person (name, email, phone number)</li>
            <li>Company website (if available)</li>
          </ul>

          <h4 style={{ marginTop: '15px', color: '#005EB8' }}>Section 5: Service Description</h4>
          <ul style={{ marginLeft: '20px' }}>
            <li>Detailed description of goods/services they will provide</li>
            <li>Service type (Goods, Services, Construction, Consultancy, Temporary Staff)</li>
          </ul>

          <h4 style={{ marginTop: '15px', color: '#005EB8' }}>Section 6: Financial Information</h4>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>Bank details on official letterhead (REQUIRED):</strong>
              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                <li>Bank name</li>
                <li>Sort code (UK) or IBAN (International)</li>
                <li>Account number</li>
                <li>Account name</li>
              </ul>
            </li>
            <li>VAT registration number (if VAT registered)</li>
            <li>Public liability insurance details (if applicable)</li>
            <li>GHX/DUNS number (if known)</li>
            <li>CIS registration details (for construction suppliers)</li>
          </ul>

          <h4 style={{ marginTop: '20px', color: '#d4351c' }} id="supplier-information-faq">Email Template for Suppliers</h4>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            marginTop: '10px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Subject: Information Required for NHS Supplier Setup</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ccc' }} />
            <p style={{ margin: '10px 0' }}>Dear [Supplier Name],</p>

            <p style={{ margin: '10px 0' }}>I am in the process of setting you up as an approved supplier with Barts Health NHS Trust. To complete this registration, I need the following information from you:</p>

            <p style={{ margin: '15px 0 5px 0' }}><strong>COMPANY INFORMATION:</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>Full legal company name</li>
              <li style={{ marginBottom: '3px' }}>Trading name (if different)</li>
              <li style={{ marginBottom: '3px' }}>Company Registration Number (if registered with Companies House)</li>
              <li style={{ marginBottom: '3px' }}>Registered company address (including postcode)</li>
              <li style={{ marginBottom: '3px' }}>Main contact person (name, email, phone number)</li>
              <li style={{ marginBottom: '3px' }}>Company website</li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>SERVICE INFORMATION:</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>Detailed description of the goods/services you will provide to us</li>
              <li style={{ marginBottom: '3px' }}>Type of service (Goods, Services, Construction, Consultancy, Temporary Staff)</li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>FINANCIAL INFORMATION (CRITICAL):</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Official company letterhead showing bank details:</strong>
                <ul style={{ margin: '5px 0 0 20px', paddingLeft: '0' }}>
                  <li style={{ marginBottom: '3px' }}>Bank name</li>
                  <li style={{ marginBottom: '3px' }}>Sort code (UK suppliers) or IBAN (international suppliers)</li>
                  <li style={{ marginBottom: '3px' }}>Account number</li>
                  <li style={{ marginBottom: '3px' }}>Account name</li>
                  <li style={{ marginBottom: '3px' }}>Must be on company letterhead with company stamp/signature</li>
                </ul>
              </li>
              <li style={{ marginBottom: '3px' }}>VAT registration number (if VAT registered)</li>
              <li style={{ marginBottom: '3px' }}>Public liability insurance certificate (if applicable)</li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>ADDITIONAL INFORMATION (if applicable):</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>For Sole Traders: Copy of passport or driving licence (for ID verification)</li>
              <li style={{ marginBottom: '3px' }}>For Construction suppliers: CIS registration details and UTR number</li>
              <li style={{ marginBottom: '3px' }}>GHX or DUNS number (if you have one)</li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>IMPORTANT:</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>All documents must be in PDF format</li>
              <li style={{ marginBottom: '3px' }}>Bank details MUST be provided on official company letterhead</li>
              <li style={{ marginBottom: '3px' }}>Maximum file size: 3MB per document</li>
            </ul>

            <p style={{ margin: '15px 0 10px 0' }}>Please send the above information to me at your earliest convenience so I can complete the supplier setup process.</p>

            <p style={{ margin: '10px 0' }}>If you have any questions, please don't hesitate to contact me.</p>

            <p style={{ margin: '15px 0 0 0' }}>
              Best regards,<br />
              [Your Name]<br />
              [Your Department]<br />
              [Your Contact Details]<br />
              Barts Health NHS Trust
            </p>
          </div>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <em>Note: Copy the email template above and paste it into your email client. Replace the bracketed fields [like this] with your actual information.</em>
          </p>
        </div>
      ),
    },
    {
      question: 'Do I need to engage with Procurement first?',
      answer:
        'If you have not already engaged with the Procurement team, you will need to complete a questionnaire which will be reviewed by a Procurement Business Partner before you can continue.',
    },
    {
      question: 'What documents do I need?',
      answer:
        'You will need: A letterhead from the supplier showing their bank details, and depending on the supplier type, potentially a CEST determination form for sole traders.',
    },
    {
      question: 'How long does approval take?',
      answer:
        'PBP review typically takes 1-3 business days. Full supplier setup can take 2-3 business days depending on the complexity and required approvals.',
    },
    {
      question: 'Who do I contact for help?',
      answer:
        'For technical issues, contact the IT helpdesk. For procurement-related queries, contact the Procurement team via Alemba or email procurement@bartshealth.nhs.uk',
    },
    {
      question: 'What is the workflow for supplier setup?',
      answer:
        'The workflow involves several steps: PBP Questionnaire Review → Procurement Review → OPW/IR35 Determination (if needed) → AP Control Banking Verification → Final Approval.',
    },
    {
      question: 'What happens if my submission is rejected?',
      answer:
        'If your submission is rejected, you will receive comments explaining the reason. You can review the feedback, make necessary changes, and resubmit the form.',
    },
    {
      question: 'Can I save my progress and come back later?',
      answer:
        'Yes, the form allows you to save your progress. Your information is stored locally in your browser until you submit the form.',
    },
  ];

  return (
    <div className="help-page">
      <div className="help-container">
        <header className="help-header">
          <h1>Help & FAQ</h1>
          <p>Find answers to common questions about the Supplier Setup Form</p>
        </header>

        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>

        <section className="contact-section">
          <h2>Still need help?</h2>
          <div className="contact-cards">
            <a href="https://servicedeskbartshealth.alembacloud.com/production/Portal.aspx?Form=Dashboard&DATABASE=Production&JAVA_FLAG=1&PORTAL=procurement&HTML_TYPE=LITE" className="contact-card" target="_blank" rel="noopener noreferrer">
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><TicketIcon size={20} color="#005EB8" /> Procurement Helpdesk</h3>
              <p>Submit a support ticket</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
