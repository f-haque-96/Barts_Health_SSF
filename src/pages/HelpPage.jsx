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
        'PBP review typically takes 3-5 business days. Full supplier setup can take 1-2 weeks depending on the complexity and required approvals.',
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
