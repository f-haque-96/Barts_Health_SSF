/**
 * Contract Drafter Stage Demo Script
 * Run this in browser console to create demo data for testing contract negotiation workflow
 *
 * HOW TO USE:
 * 1. Open the application in browser
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Navigate to the URLs provided in the console output
 *
 * TO REMOVE DEMO DATA:
 * Run: clearContractDemo()
 */

(function createContractDraftDemo() {
  console.log('%c📋 Contract Drafter Stage Demo Creator', 'color: #059669; font-size: 16px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #059669;');

  // Create realistic demo submission
  const demoSubmissionId = 'DEMO-CONTRACT-2024-001';
  const demoSubmission = {
    submissionId: demoSubmissionId,
    submissionDate: new Date().toISOString(),
    submittedBy: 'demo.requester@nhs.net',
    status: 'contract_review',
    currentStage: 'contract',

    // Form Data
    formData: {
      // Section 1: Requester Info
      firstName: 'Sarah',
      lastName: 'Johnson',
      department: 'Cardiology',
      nhsEmail: 'sarah.johnson@nhs.net',

      // Section 4: Supplier Details
      companyName: 'Elite Consulting Ltd',
      contactName: 'John Smith',
      contactEmail: 'john.smith@eliteconsulting.com',
      contactPhone: '020 7123 4567',

      // Section 3: Classification
      supplierType: 'sole_trader',
      soleTraderStatus: 'yes',

      // Section 6: Financial
      overseasSupplier: 'no',
    },

    // PBP Review (already approved)
    pbpReview: {
      decision: 'approved',
      comments: 'All documentation in order. Approved for procurement review.',
      signature: 'Emma Williams',
      date: '2024-02-05',
      reviewedBy: 'Emma Williams',
      reviewedAt: '2024-02-05T10:30:00Z'
    },

    // Procurement Review (already approved)
    procurementReview: {
      decision: 'approved',
      supplierClassification: 'opw_ir35',
      comments: 'Routed to OPW Panel for IR35 assessment.',
      signature: 'Michael Chen',
      date: '2024-02-06',
      reviewedBy: 'Michael Chen',
      reviewedAt: '2024-02-06T14:15:00Z'
    },

    // OPW Review (IR35 determination made)
    opwReview: {
      ir35Status: 'outside_ir35',
      rationale: 'Supplier operates as genuine business with multiple clients, substitution rights, and financial risk. Evidence from CEST form supports Outside IR35 determination.',
      decision: 'approved',
      signature: 'David Thompson',
      date: '2024-02-07',
      reviewedBy: 'David Thompson',
      reviewedAt: '2024-02-07T16:45:00Z'
    },

    // Contract Drafter (current stage - with example exchanges)
    contractDrafter: {
      status: 'sent',
      ir35Status: 'outside_ir35',
      requiredTemplate: 'BartsConsultancyAgreement.1.2.docx',
      assignedTo: 'peter.persaud@nhs.net',
      lastUpdated: '2024-02-08T09:30:00Z',

      // Example exchange thread
      exchanges: [
        {
          id: 'CNT-1707384600-abc12',
          type: 'contract_request',
          from: 'contract_drafter',
          fromName: 'Peter Persaud',
          message: `Dear John,

Following the IR35 assessment, please review the attached Barts Consultancy Agreement.

REQUIRED ACTIONS:
1. Review all sections of the agreement
2. Complete Section 4 (Supplier Information)
3. Complete Section 7 (Rate Card and Payment Terms)
4. Have your authorized signatory sign on page 12
5. Upload the signed document via this portal

CLARIFICATIONS:
- Payment terms: Net 30 days from invoice date
- Termination notice: 30 days written notice
- Insurance requirement: £5M professional indemnity

If you have any questions about the terms, please respond via this system before signing.

Regards,
Peter Persaud
Contract Drafter`,
          attachments: [
            {
              name: 'BartsConsultancyAgreement.1.2.docx',
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              url: '/templates/BartsConsultancyAgreement.1.2.docx',
              isTemplate: true
            }
          ],
          timestamp: '2024-02-08T09:30:00Z'
        },
        {
          id: 'CNT-1707398400-xyz89',
          type: 'supplier_response',
          from: 'supplier',
          fromName: 'John Smith',
          message: `Hi Peter,

Thank you for sending the agreement. I've reviewed it and have a question about clause 5.3 regarding intellectual property rights.

Could you clarify whether pre-existing IP that I bring to the engagement remains my property?

Also, the daily rate in Section 7 should be £850, not £800 as shown in the template.

I'll wait for your confirmation before signing.

Best regards,
John`,
          attachments: [],
          timestamp: '2024-02-08T14:20:00Z'
        },
        {
          id: 'CNT-1707412800-def45',
          type: 'contract_drafter_response',
          from: 'contract_drafter',
          fromName: 'Peter Persaud',
          message: `Hi John,

Good questions:

1. PRE-EXISTING IP: Yes, clause 5.3 means that any IP you created before this engagement remains yours. Only work product created during the engagement belongs to Barts Health.

2. DAILY RATE: Confirmed - please update Section 7 to £850 per day as agreed.

Once you've made these updates and signed, please upload the document.

Best regards,
Peter`,
          attachments: [],
          timestamp: '2024-02-08T16:00:00Z'
        }
      ]
    }
  };

  // Save to localStorage
  localStorage.setItem(`submission_${demoSubmissionId}`, JSON.stringify(demoSubmission));

  // Add to submissions list
  const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
  const existingIndex = submissions.findIndex(s => s.submissionId === demoSubmissionId);

  const summaryEntry = {
    submissionId: demoSubmissionId,
    companyName: 'Elite Consulting Ltd',
    submittedBy: 'sarah.johnson@nhs.net',
    submissionDate: demoSubmission.submissionDate,
    status: 'contract_review',
    currentStage: 'contract',
    ir35Status: 'outside_ir35'
  };

  if (existingIndex !== -1) {
    submissions[existingIndex] = summaryEntry;
  } else {
    submissions.push(summaryEntry);
  }

  localStorage.setItem('all_submissions', JSON.stringify(submissions));

  // Create mock user for testing
  const mockUser = {
    email: 'peter.persaud@nhs.net',
    displayName: 'Peter Persaud',
    name: 'Peter Persaud',
    groups: ['NHS-SupplierForm-Contract', 'NHS-SupplierForm-Admin'],
    roles: ['contract', 'admin']
  };

  // Store mock user (optional - for testing authentication)
  sessionStorage.setItem('demo_contract_user', JSON.stringify(mockUser));

  console.log('%c✅ Demo data created successfully!', 'color: #22c55e; font-weight: bold;');
  console.log('');
  console.log('%c📍 ACCESS DEMO PAGES:', 'color: #3b82f6; font-weight: bold;');
  console.log('');
  console.log('%c1️⃣  Contract Drafter View:', 'color: #059669; font-weight: bold;');
  console.log(`   ${window.location.origin}/contract-drafter/${demoSubmissionId}`);
  console.log('   Role: Contract Drafter (Peter Persaud)');
  console.log('   Actions: Send agreement, approve, request changes');
  console.log('');
  console.log('%c2️⃣  Requester/Supplier Response View:', 'color: #ca8a04; font-weight: bold;');
  console.log(`   ${window.location.origin}/respond/${demoSubmissionId}`);
  console.log('   Role: Requester (Sarah Johnson) or Supplier (John Smith)');
  console.log('   Actions: View exchanges, upload signed contract');
  console.log('');
  console.log('%c📊 DEMO DATA DETAILS:', 'color: #6366f1; font-weight: bold;');
  console.log(`   Submission ID: ${demoSubmissionId}`);
  console.log('   Supplier: Elite Consulting Ltd');
  console.log('   IR35 Status: Outside IR35');
  console.log('   Agreement: Barts Consultancy Agreement v1.2');
  console.log('   Exchanges: 3 messages (1 from contract drafter, 1 from supplier, 1 reply)');
  console.log('');
  console.log('%c🗑️  TO REMOVE DEMO DATA:', 'color: #ef4444; font-weight: bold;');
  console.log('   Run: clearContractDemo()');
  console.log('');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #059669;');

  // Make cleanup function globally available
  window.clearContractDemo = function() {
    localStorage.removeItem(`submission_${demoSubmissionId}`);

    const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
    const filtered = submissions.filter(s => s.submissionId !== demoSubmissionId);
    localStorage.setItem('all_submissions', JSON.stringify(filtered));

    sessionStorage.removeItem('demo_contract_user');

    console.log('%c🗑️  Demo data cleared!', 'color: #ef4444; font-weight: bold;');
    console.log('Refresh the page to see the changes.');
  };

  // Return URLs for easy clicking
  return {
    contractDrafterUrl: `${window.location.origin}/contract-drafter/${demoSubmissionId}`,
    responseUrl: `${window.location.origin}/respond/${demoSubmissionId}`,
    submissionId: demoSubmissionId,
    cleanup: window.clearContractDemo
  };
})();
