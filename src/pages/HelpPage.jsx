/**
 * HelpPage Component
 * Updated: Mar 2026 - CI compliance
 * FAQ and help resources for the Supplier Setup Form
 */

import React from 'react';
import { TicketIcon } from '../components/common';
import useDocumentTitle from '../hooks/useDocumentTitle';
import './HelpPage.css';

const HelpPage = () => {
  useDocumentTitle('Help & FAQ');
  const faqs = [
    {
      question: 'What is the Supplier Setup Form?',
      answer:
        'The Supplier Setup Form is used to register new suppliers with NHS Barts Health Trust. It collects all necessary information for procurement, finance, and compliance purposes.',
    },
    {
      question: (
        <>
          What information do I need from the supplier? <em style={{ color: '#f59e0b', fontSize: '0.9em' }}>[EMAIL TEMPLATE]</em>
        </>
      ),
      answer: (
        <div>
          <p style={{ padding: '10px', backgroundColor: '#eff6ff', border: '1px solid #005EB8', borderRadius: '6px' }}>
            <strong>Easiest route:</strong> the form can collect all of this for you.
            At Section 3, use the <strong>Supplier Information Pack</strong> — send the
            supplier one link, and their answers come back ready to paste straight into
            the form (see the Supplier Information Pack FAQ below). The list below is
            for gathering the details manually instead.
          </p>
          <p><strong>You'll need the following information from your supplier to complete the form:</strong></p>

          <h4 style={{ marginTop: '15px', color: '#005EB8' }}>Section 2: Pre-screening Information</h4>
          <ul style={{ marginLeft: '20px' }}>
            <li>Whether the supplier is providing a <strong>personal service</strong> (i.e., an individual providing their own skills directly, such as sole traders, freelancers, or contractors)</li>
            <li>Confirmation that supplier has official <strong>company letterhead</strong> available (They will need to send this as a PDF)</li>
            <li><strong>Justification</strong> for using this specific supplier (business case)</li>
            <li><strong>Usage frequency</strong> (one-off, occasional, regular, ongoing contract)</li>
            <li><strong>Service category</strong> (clinical or non-clinical)</li>
          </ul>

          <h4 style={{ marginTop: '15px', color: '#005EB8' }}>Section 3: Supplier Classification</h4>
          <ul style={{ marginLeft: '20px' }}>
            <li>Supplier type (Limited Company, Sole Trader, Charity, or Public Sector)</li>
            <li>Company Registration Number (CRN) if registered with Companies House</li>
            <li>Charity number (if applicable)</li>
            <li>For sole traders: Photo ID (passport or driving licence)</li>
            <li><strong>Annual contract value</strong> (estimated total spend per year)</li>
            <li><strong>Employee count</strong> (company size)</li>
            <li>Declaration if supplier has <strong>more than 5% interest in a Limited Company</strong></li>
            <li>Declaration if supplier has <strong>more than 60% interest in a Partnership</strong></li>
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
              <li style={{ marginBottom: '3px' }}>Supplier type (Limited Company, Sole Trader, Charity, or Public Sector)</li>
              <li style={{ marginBottom: '3px' }}>Company Registration Number (if registered with Companies House)</li>
              <li style={{ marginBottom: '3px' }}>Registered company address (including postcode)</li>
              <li style={{ marginBottom: '3px' }}>Main contact person (name, email, phone number)</li>
              <li style={{ marginBottom: '3px' }}>Company website</li>
              <li style={{ marginBottom: '3px' }}>Estimated annual contract value with Barts Health</li>
              <li style={{ marginBottom: '3px' }}>Number of employees (company size)</li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>SERVICE INFORMATION:</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>Detailed description of the goods/services you will provide to us</li>
              <li style={{ marginBottom: '3px' }}>Type of service (Goods, Services, Construction, Consultancy, Temporary Staff)</li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>FINANCIAL INFORMATION (CRITICAL):</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>PDF copy of official company letterhead showing bank details:</strong>
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
              <li style={{ marginBottom: '3px' }}>Declaration if you have <strong>more than 5% interest in a Limited Company</strong></li>
              <li style={{ marginBottom: '3px' }}>Declaration if you have <strong>more than 60% interest in a Partnership</strong></li>
            </ul>

            <p style={{ margin: '15px 0 5px 0' }}><strong>IMPORTANT:</strong></p>
            <ul style={{ margin: '5px 0 10px 20px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>All documents must be in <strong>PDF format</strong></li>
              <li style={{ marginBottom: '3px' }}>Bank details <strong>MUST</strong> be provided on <strong>official company letterhead</strong> with company stamp/signature</li>
              <li style={{ marginBottom: '3px' }}>The letterhead must clearly show your company name, logo, and contact details at the top</li>
              <li style={{ marginBottom: '3px' }}>Maximum file size: 3MB per document</li>
              <li style={{ marginBottom: '3px' }}>For sole traders without letterhead, a signed letter with your full details and photo ID is required</li>
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
        'For technical issues, contact the IT helpdesk. For procurement-related queries, contact the Procurement team via Alemba or email barts.procurement@nhs.net',
    },
    {
      question: 'What is the workflow for supplier setup?',
      answer:
        'PBP approval happens during Section 2 (via the pre-screening questionnaire, or your existing procurement engagement evidence). Once you submit the completed form it goes straight to Procurement for classification, then — if needed — OPW/IR35 determination and contract drafting, and finally AP Control banking verification before the supplier is created.',
    },
    {
      question: 'The supplier knows most of these answers — can they fill them in?',
      answer:
        'Yes. From Section 3 onwards most questions are about the supplier\'s own details. Use the "Supplier Information Pack" notice at the top of Section 3: it gives you a ready-made email containing a short online form for the supplier (no sign-in needed) and a reference code. Their answers arrive in your inbox ending with an autofill block — click "Paste supplier\'s answers" in Section 3, paste the block, and the form fills itself (including pre-selecting the supplier type and verifying the CRN) for you to review and confirm. The pack includes bank details, but the supplier must ALSO send their bank letterhead directly to you — AP Control verifies the typed details against it before any payment can be set up.',
    },
    {
      question: 'Can the supplier see the progress page or talk to the contract drafter directly?',
      answer:
        'Not directly at the moment. The progress page (the link in your notification emails) requires an NHS sign-in, so only you as the requester can open it. Suppliers take part in two ways: the Supplier Information Pack form (no sign-in needed) for providing their details, and email for everything else — during the contract stage the contract drafter corresponds with the supplier by email, and the outcome is recorded on the submission for you to see. If the supplier asks about progress, check your progress page and relay the status. Direct supplier access to the portal (guest accounts) is planned as a future update.',
    },
    {
      question: 'What is the "Which area does this request fall under?" question in the questionnaire?',
      answer:
        'It routes your pre-screening questionnaire to the right Procurement Business Partner — clinical requests by specialty and hospital site, non-clinical by category (e.g. Hard FM, Soft FM/Corporate). If you are unsure, or your site is not listed, choose the Trustwide option and it will be redirected for you.',
    },
    {
      question: 'Why do I have to type the bank details AND upload a letterhead?',
      answer:
        'The typed details are checked against the letterhead by AP Control — differences between the two have caught real errors and fraud attempts in the past. Always type the details exactly as they appear on the supplier\'s letterhead.',
    },
    {
      question: 'What is OPW / IR35, and what is an SDS?',
      answer:
        'When a supplier is an individual providing a personal service (directly, or through their own limited company or partnership), tax law requires the Trust to assess whether they are really employed for tax purposes. You will be asked to complete the HMRC CEST tool, and the OPW Panel (Finance, Procurement and HR) makes the determination. Sole traders assessed as employed must be engaged via standard recruitment (fixed-term, bank or agency) instead of as a supplier. For companies/partnerships assessed as INSIDE IR35, the Panel issues a Status Determination Statement (SDS) — a formal letter telling the supplier the decision and their right to appeal (14 days to respond; appeals answered within 45 days). If accepted, the worker is set up on ESR as an IR35 Contractor: they still invoice, but are paid net of tax and NI via payroll, with you validating their invoices. OUTSIDE IR35 or genuinely self-employed suppliers proceed to a normal Oracle supplier setup (with a consultancy or sole trader agreement where required). Contact: bartshealth.opwpanelbarts@nhs.net',
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
              <div className="faq-answer">{faq.answer}</div>
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
