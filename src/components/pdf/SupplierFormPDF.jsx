/**
 * Supplier Form PDF Generator
 * Generates a comprehensive PDF document with all form data and attachments
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { formatFieldValue, formatSupplierType, formatServiceCategory, formatUsageFrequency, formatServiceTypes, formatOrganisationType, formatEmployeeCount } from '../../utils/formatters';

// Register fonts (optional - can use default fonts)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
// });

// Define styles matching NHS branding
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // Cover Page
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  nhsLogo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#005EB8',
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212B32',
    marginBottom: 10,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#425563',
    marginBottom: 40,
    textAlign: 'center',
  },
  coverInfo: {
    fontSize: 12,
    color: '#768692',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2pt solid #005EB8',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#005EB8',
  },
  headerDate: {
    fontSize: 9,
    color: '#768692',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#005EB8',
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1pt solid #AEB7C2',
  },

  // Fields
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  fieldLabel: {
    width: '40%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#425563',
  },
  fieldValue: {
    width: '60%',
    fontSize: 10,
    color: '#212B32',
    paddingLeft: 8,
  },

  // Text blocks (justification, description)
  textBlock: {
    backgroundColor: '#F0F4F5',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  textBlockLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#425563',
    marginBottom: 4,
  },
  textBlockContent: {
    fontSize: 10,
    color: '#212B32',
    lineHeight: 1.4,
  },

  // Document attachments
  attachmentHeader: {
    backgroundColor: '#E8EDEE',
    padding: 12,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 4,
  },
  attachmentHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212B32',
  },
  attachmentPage: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
  },
  attachmentTitle: {
    backgroundColor: '#E8EDEE',
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  attachmentTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#005EB8',
  },
  attachmentContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentImage: {
    maxWidth: '80%',
    maxHeight: '70%',
    objectFit: 'contain',
    border: '1pt solid #AEB7C2',
  },
  attachmentPlaceholder: {
    padding: 30,
    backgroundColor: '#F0F4F5',
    borderRadius: 8,
    border: '2pt dashed #AEB7C2',
    textAlign: 'center',
  },
  attachmentPlaceholderText: {
    fontSize: 12,
    color: '#425563',
    marginBottom: 8,
  },

  // File list
  fileItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1pt solid #E8EDEE',
  },
  fileIcon: {
    width: 30,
    fontSize: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#212B32',
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 8,
    color: '#768692',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#768692',
    textAlign: 'center',
    borderTop: '1pt solid #E8EDEE',
    paddingTop: 10,
  },

  // Authorisation Section Styles
  authorisationSection: {
    marginTop: 30,
    paddingTop: 20,
  },
  authHeader: {
    marginBottom: 16,
  },
  authHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    letterSpacing: 1,
  },
  redLine: {
    height: 3,
    backgroundColor: '#dc2626',
    marginTop: 4,
    width: 200,
  },
  authBlock: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#005EB8',
  },
  authBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  authBlockTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#005EB8',
    marginRight: 8,
  },
  authBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: 'white',
  },
  badgeGreen: {
    backgroundColor: '#22c55e',
  },
  badgeRed: {
    backgroundColor: '#ef4444',
  },
  badgeAmber: {
    backgroundColor: '#f59e0b',
  },
  badgeBlue: {
    backgroundColor: '#3b82f6',
  },
  badgeOrange: {
    backgroundColor: '#f97316',
  },
  authComments: {
    fontSize: 8,
    color: '#4b5563',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  authField: {
    fontSize: 9,
    color: '#1f2937',
    marginBottom: 4,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 9,
  },
  contractNote: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    fontSize: 8,
  },

  // Verification Badge styles
  verificationBadge: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 3,
    fontSize: 7,
    marginLeft: 8,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1pt solid #10b981',
  },
  needsVerificationBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    border: '1pt solid #f59e0b',
  },
});

// Helper to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};


// Helper to get section data with fallbacks
const getSectionData = (submission, formData, sectionNum) => {
  // Try different possible data structures
  return submission?.formData?.[`section${sectionNum}`]
    || formData?.[`section${sectionNum}`]
    || submission?.[`section${sectionNum}`]
    || {};
};

// Verification Badge for PDF
const PDFVerificationBadge = ({ companyStatus }) => {
  const isVerified = companyStatus && companyStatus.toLowerCase() === 'active';
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const badgeStyle = isVerified
    ? [styles.verificationBadge, styles.verifiedBadge]
    : [styles.verificationBadge, styles.needsVerificationBadge];

  if (isVerified) {
    return (
      <View style={badgeStyle}>
        <Text style={{ fontWeight: 'bold' }}>Verified</Text>
      </View>
    );
  }

  // For non-verified: bold text + normal weight status in parentheses
  return (
    <View style={badgeStyle}>
      <Text style={{ fontWeight: 'bold' }}>Verify Required</Text>
      {companyStatus && (
        <Text style={{ fontWeight: 'normal' }}> ({formatStatus(companyStatus)})</Text>
      )}
    </View>
  );
};

// Field display component
const Field = ({ label, value, raw = false, badge = null }) => {
  if (!value && value !== 0) return null;
  // Format the value unless raw is true
  const displayValue = raw ? value : formatFieldValue(value);
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '60%', paddingLeft: 8 }}>
        <Text style={styles.fieldValue}>{displayValue}</Text>
        {badge && <View>{badge}</View>}
      </View>
    </View>
  );
};

// Text block component (for long text fields)
const TextBlock = ({ label, content }) => {
  if (!content) return null;
  return (
    <View style={styles.textBlock}>
      <Text style={styles.textBlockLabel}>{label}:</Text>
      <Text style={styles.textBlockContent}>{content}</Text>
    </View>
  );
};

// Main PDF Document Component
// Note: submissionDate and isAPControlPDF props removed as they were unused
const SupplierFormPDF = ({ formData, uploadedFiles, submissionId, submission }) => {
  // Return empty document if no data
  if (!submission && !formData) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No submission data available</Text>
        </Page>
      </Document>
    );
  }

  // Normalize data structure - handle both old and new formats
  const normalizedData = submission ? {
    // Extract section data with multiple fallbacks
    section1: getSectionData(submission, formData, 1),
    section2: getSectionData(submission, formData, 2),
    section3: getSectionData(submission, formData, 3),
    section4: getSectionData(submission, formData, 4),
    section5: getSectionData(submission, formData, 5),
    section6: getSectionData(submission, formData, 6),
    section7: getSectionData(submission, formData, 7),
    // Also support flat formData structure
    ...submission?.formData,
    ...formData,
  } : formData || {};

  // Ensure uploadedFiles is always an object
  const safeUploadedFiles = uploadedFiles || submission?.uploadedFiles || submission?.uploads || {};

  // Extract common fields with fallbacks
  const companyName = normalizedData.section4?.companyName
    || normalizedData.companyName
    || submission?.formData?.companyName
    || submission?.companyName
    || 'Unknown Company';

  const firstName = normalizedData.section1?.firstName || normalizedData.firstName || '';
  const lastName = normalizedData.section1?.lastName || normalizedData.lastName || '';

  const generateDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document
      title={`NHS Supplier Setup Form - ${companyName}`}
      author="NHS Barts Health Trust"
      subject="Supplier Setup Form Submission"
      creator="NHS Supplier Setup Portal"
    >
      {/* COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.nhsLogo}>NHS</Text>
          <Text style={styles.coverTitle}>Barts Health NHS Trust</Text>
          <Text style={styles.coverSubtitle}>Supplier Setup Form</Text>

          <View style={{ marginTop: 40 }}>
            {(submission?.alembaReference || submission?.displayReference || submissionId) && (
              <Text style={styles.coverInfo}>
                Reference: {submission?.alembaReference || submission?.displayReference || submissionId}
              </Text>
            )}
            {companyName && companyName !== 'Unknown Company' && (
              <Text style={styles.coverInfo}>
                Supplier: {companyName}
                {(submission?.supplierNumber || submission?.apControlReview?.supplierNumber) &&
                  ` - ${submission?.supplierNumber || submission?.apControlReview?.supplierNumber}`
                }
              </Text>
            )}
            {(firstName || lastName) && (
              <Text style={styles.coverInfo}>
                Submitted by: {firstName} {lastName}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          NHS Barts Health Trust - Procurement Department
        </Text>
      </Page>

      {/* SECTION 1: Requester Information */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NHS Supplier Setup Form</Text>
          <Text style={styles.headerDate}>{generateDate}</Text>
        </View>

        <Text style={styles.sectionHeader}>Section 1: Requester Information</Text>
        <Field label="First Name" value={normalizedData.section1?.firstName || normalizedData.firstName} />
        <Field label="Last Name" value={normalizedData.section1?.lastName || normalizedData.lastName} />
        <Field label="Job Title" value={normalizedData.section1?.jobTitle || normalizedData.jobTitle} />
        <Field label="Department" value={normalizedData.section1?.department || normalizedData.department} />
        <Field label="NHS Email" value={normalizedData.section1?.nhsEmail || normalizedData.nhsEmail} raw />
        <Field label="Phone Number" value={normalizedData.section1?.phoneNumber || normalizedData.phoneNumber} />

        {/* SECTION 2: Pre-screening */}
        <Text style={styles.sectionHeader}>Section 2: Pre-screening & Authorisation</Text>
        {/* Q2.1 Substantive Position */}
        <Field label="Covers Substantive Position" value={normalizedData.section2?.substantivePosition || normalizedData.substantivePosition} />
        {(normalizedData.section2?.substantivePosition === 'yes' || normalizedData.substantivePosition === 'yes') && (
          <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: 4, marginBottom: 10, borderWidth: 1, borderColor: '#dc2626' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>WARNING: Requester indicated this covers a substantive/vacant position. Standard recruitment should be used.</Text>
          </View>
        )}
        {/* Q2.2 Supplier Connection */}
        <Field label="Supplier Connection" value={normalizedData.section2?.supplierConnection || normalizedData.supplierConnection} />
        {/* Connection Details - Show if supplier has a connection */}
        {(normalizedData.section2?.supplierConnection === 'yes' || normalizedData.supplierConnection === 'yes') &&
         (normalizedData.section2?.connectionDetails || normalizedData.connectionDetails) && (
          <View style={{ backgroundColor: '#fef3c7', padding: 10, borderRadius: 4, marginBottom: 10, borderWidth: 1, borderColor: '#f59e0b' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#b45309', marginBottom: 4 }}>⚠ Conflict of Interest - Connection Details:</Text>
            <Text style={{ fontSize: 10, color: '#92400e', lineHeight: 1.4 }}>{normalizedData.section2?.connectionDetails || normalizedData.connectionDetails}</Text>
          </View>
        )}
        {/* Q2.2 Personal Service Status */}
        <Field label="Is the supplier providing a personal service?" value={normalizedData.section2?.soleTraderStatus || normalizedData.soleTraderStatus} />
        {/* Q2.3 Letterhead */}
        <Field label="Letterhead Available" value={normalizedData.section2?.letterheadAvailable || normalizedData.letterheadAvailable} />
        {/* Q2.4 Justification */}
        <TextBlock label="Justification" content={normalizedData.section2?.justification || normalizedData.justification} />
        {/* Q2.5 Usage Frequency */}
        <Field label="Usage Frequency" value={formatUsageFrequency(normalizedData.section2?.usageFrequency || normalizedData.usageFrequency)} raw />
        {/* Q2.6 Service Category */}
        <Field label="Service Category" value={formatServiceCategory(normalizedData.section2?.serviceCategory || normalizedData.serviceCategory)} raw />
        {/* Q2.7 Procurement Engaged */}
        <Field label="Procurement Engaged" value={normalizedData.section2?.procurementEngaged || normalizedData.procurementEngaged} />
        <Field label="Section 2 Acknowledgement" value={(normalizedData.section2?.prescreeningAcknowledgement || normalizedData.prescreeningAcknowledgement) ? 'Confirmed' : 'Not confirmed'} raw />

        {/* SECTION 3: Supplier Classification */}
        <Text style={styles.sectionHeader}>Section 3: Supplier Classification</Text>
        <Field label="Companies House Registered" value={normalizedData.section3?.companiesHouseRegistered || normalizedData.companiesHouseRegistered} />
        <Field label="Supplier Type" value={formatSupplierType(normalizedData.section3?.supplierType || normalizedData.supplierType)} raw />

        {/* CRN - Limited Company */}
        {(normalizedData.section3?.crn || normalizedData.crn) && (normalizedData.section3?.supplierType || normalizedData.supplierType) === 'limited_company' && (
          <>
            <Field
              label="CRN"
              value={normalizedData.section3?.crn || normalizedData.crn}
            />
            {(normalizedData.section3?.crnVerification || normalizedData.crnVerification)?.name && (
              <Field label="Verified Company Name" value={(normalizedData.section3?.crnVerification || normalizedData.crnVerification)?.name} />
            )}
          </>
        )}

        {/* CRN - Charity (registered with Companies House) */}
        {(normalizedData.section3?.crnCharity || normalizedData.crnCharity) && (normalizedData.section3?.supplierType || normalizedData.supplierType) === 'charity' && (
          <>
            <Field
              label="CRN"
              value={normalizedData.section3?.crnCharity || normalizedData.crnCharity}
            />
            {(normalizedData.section3?.crnVerification || normalizedData.crnVerification)?.name && (
              <Field label="Verified Company Name" value={(normalizedData.section3?.crnVerification || normalizedData.crnVerification)?.name} />
            )}
          </>
        )}

        {/* Charity Number - Only show for charities */}
        {(normalizedData.section3?.supplierType || normalizedData.supplierType) === 'charity' && (normalizedData.section3?.charityNumber || normalizedData.charityNumber) && (
          <Field label="Charity Number" value={normalizedData.section3?.charityNumber || normalizedData.charityNumber} />
        )}

        {/* ID Type - Only show for sole traders */}
        {(normalizedData.section3?.supplierType || normalizedData.supplierType) === 'sole_trader' && (normalizedData.section3?.idType || normalizedData.idType) && (
          <Field label="ID Type" value={(normalizedData.section3?.idType || normalizedData.idType) === 'passport' ? 'Passport' : 'Driving Licence'} />
        )}

        {/* Organisation Type - Only show for public sector */}
        {(normalizedData.section3?.supplierType || normalizedData.supplierType) === 'public_sector' && (normalizedData.section3?.organisationType || normalizedData.organisationType) && (
          <Field label="Organisation Type" value={formatOrganisationType(normalizedData.section3?.organisationType || normalizedData.organisationType)} raw />
        )}

        <Field label="Annual Value" value={(normalizedData.section3?.annualValue || normalizedData.annualValue) ? formatCurrency(normalizedData.section3?.annualValue || normalizedData.annualValue) : ''} />
        <Field label="Employee Count" value={formatEmployeeCount(normalizedData.section3?.employeeCount || normalizedData.employeeCount)} raw />
        <Field label="More than 5% interest in Limited Company" value={normalizedData.section3?.limitedCompanyInterest || normalizedData.limitedCompanyInterest || 'Not provided'} />
        <Field label="More than 60% interest in Partnership" value={normalizedData.section3?.partnershipInterest || normalizedData.partnershipInterest || 'Not provided'} />
        {(normalizedData.section3?.interestDeclaration || normalizedData.interestDeclaration) && (
          <TextBlock label="Interest Declaration" content={normalizedData.section3?.interestDeclaration || normalizedData.interestDeclaration} />
        )}

        <Text style={styles.footer}>
          Page 2 - NHS Barts Health Trust
        </Text>
      </Page>

      {/* SECTION 4-6 on next page */}
      <Page size="A4" style={styles.page}>

        {/* SECTION 4: Supplier Details */}
        <Text style={styles.sectionHeader}>Section 4: Supplier Details</Text>
        <Field label="Company Name" value={normalizedData.section4?.companyName || normalizedData.companyName || companyName} />
        <Field label="Trading Name" value={normalizedData.section4?.tradingName || normalizedData.tradingName} />
        <Field label="Registered Address" value={normalizedData.section4?.registeredAddress || normalizedData.registeredAddress} />
        <Field label="City" value={normalizedData.section4?.city || normalizedData.city} />
        <Field label="Postcode" value={normalizedData.section4?.postcode || normalizedData.postcode} />
        <Field label="Contact Name" value={normalizedData.section4?.contactName || normalizedData.contactName} />
        <Field label="Contact Email" value={normalizedData.section4?.contactEmail || normalizedData.contactEmail} raw />
        <Field label="Contact Phone" value={normalizedData.section4?.contactPhone || normalizedData.contactPhone} />
        <Field label="Website" value={normalizedData.section4?.website || normalizedData.website} />

        {/* SECTION 5: Service Description */}
        <Text style={styles.sectionHeader}>Section 5: Service Description</Text>
        <Field label="Service Types" value={formatServiceTypes(normalizedData.section5?.serviceType || normalizedData.serviceType)} raw />
        <TextBlock label="Service Description" content={normalizedData.section5?.serviceDescription || normalizedData.serviceDescription} />

        {/* SECTION 6: Financial Information */}
        <Text style={styles.sectionHeader}>Section 6: Financial & Accounts</Text>
        <Field label="Overseas Supplier" value={normalizedData.section6?.overseasSupplier || normalizedData.overseasSupplier} />

        {/* Bank Details Status Badges - NO actual banking information shown for security */}
        <View style={{ marginTop: 12, marginBottom: 12, gap: 8 }}>
          {/* Badge 1: UK or Overseas Bank Details Provided */}
          <View style={[styles.authBadge, styles.badgeBlue, { display: 'flex', flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 6 }]}>
            <Text style={styles.badgeText}>
              {(normalizedData.section6?.overseasSupplier || normalizedData.overseasSupplier) === 'yes'
                ? 'OVERSEAS BANK DETAILS PROVIDED'
                : 'UK BANK DETAILS PROVIDED'}
            </Text>
          </View>

          {/* Badge 2: Verified status (shows when AP Control has verified) */}
          {submission?.apControlReview?.bankDetailsVerified && (
            <View style={[styles.authBadge, styles.badgeGreen, { display: 'flex', flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }]}>
              <Text style={styles.badgeText}>BANK DETAILS VERIFIED</Text>
            </View>
          )}
        </View>

        <Field label="Accounts Address Same" value={normalizedData.section6?.accountsAddressSame || normalizedData.accountsAddressSame} />
        {(normalizedData.section6?.accountsAddressSame || normalizedData.accountsAddressSame) === 'no' && (
          <>
            <Field label="Accounts Address" value={normalizedData.section6?.accountsAddress || normalizedData.accountsAddress} />
            <Field label="Accounts City" value={normalizedData.section6?.accountsCity || normalizedData.accountsCity} />
            <Field label="Accounts Postcode" value={normalizedData.section6?.accountsPostcode || normalizedData.accountsPostcode} />
            <Field label="Accounts Phone" value={normalizedData.section6?.accountsPhone || normalizedData.accountsPhone} />
            <Field label="Accounts Email" value={normalizedData.section6?.accountsEmail || normalizedData.accountsEmail} raw />
          </>
        )}
        <Field label="GHX/DUNS Known" value={normalizedData.section6?.ghxDunsKnown || normalizedData.ghxDunsKnown} />
        {(normalizedData.section6?.ghxDunsKnown || normalizedData.ghxDunsKnown) === 'yes' && (
          <Field label="GHX/DUNS Number" value={normalizedData.section6?.ghxDunsNumber || normalizedData.ghxDunsNumber || normalizedData.section6?.dunsNumber || normalizedData.dunsNumber} />
        )}
        <Field label="CIS Registered" value={normalizedData.section6?.cisRegistered || normalizedData.cisRegistered} />
        {(normalizedData.section6?.cisRegistered || normalizedData.cisRegistered) === 'yes' && (
          <Field label="UTR Number" value={normalizedData.section6?.utrNumber || normalizedData.utrNumber} />
        )}
        <Field label="VAT Registered" value={normalizedData.section6?.vatRegistered || normalizedData.vatRegistered} />
        {(normalizedData.section6?.vatRegistered || normalizedData.vatRegistered) === 'yes' && (
          <Field label="VAT Number" value={normalizedData.section6?.vatNumber || normalizedData.vatNumber} />
        )}
        <Field label="Public Liability Insurance" value={normalizedData.section6?.publicLiability || normalizedData.publicLiability} />
        {(normalizedData.section6?.publicLiability || normalizedData.publicLiability) === 'yes' && (
          <>
            <Field label="Coverage Amount" value={(normalizedData.section6?.plCoverage || normalizedData.plCoverage) ? formatCurrency(normalizedData.section6?.plCoverage || normalizedData.plCoverage) : ''} />
            <Field label="Insurance Expiry" value={(normalizedData.section6?.plExpiry || normalizedData.plExpiry) ? formatDate(normalizedData.section6?.plExpiry || normalizedData.plExpiry) : ''} />
          </>
        )}

        {/* SECTION 7: Review & Submit */}
        <Text style={styles.sectionHeader}>Section 7: Review & Submit</Text>
        <Field label="Final Acknowledgement" value={(normalizedData.section7?.finalAcknowledgement || normalizedData.finalAcknowledgement) ? 'Confirmed - All information is accurate and complete' : 'Not confirmed'} />

        <Text style={styles.footer}>
          Page 3 - NHS Barts Health Trust
        </Text>
      </Page>

      {/* UPLOADED DOCUMENTS SUMMARY */}
      {Object.keys(safeUploadedFiles).length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionHeader}>Uploaded Documents</Text>
          <Text style={{ fontSize: 10, color: '#425563', marginBottom: 16 }}>
            The following documents have been uploaded with this submission:
          </Text>

          {Object.entries(safeUploadedFiles).map(([fieldName, file]) => {
            const labels = {
              procurementApproval: 'Procurement Approval Document',
              letterhead: 'Letterhead with Bank Details',
              cestForm: 'CEST Form',
              passportPhoto: 'Passport Photo',
              licenceFront: 'Driving Licence (Front)',
              licenceBack: 'Driving Licence (Back)',
              drivingLicenceFront: 'Driving Licence (Front)',
              drivingLicenceBack: 'Driving Licence (Back)',
              opwContract: 'OPW/IR35 Agreement',
            };

            return (
              <View key={fieldName} style={styles.fileItem}>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{labels[fieldName] || fieldName}</Text>
                  <Text style={styles.fileMeta}>
                    {file.name} • {formatFileSize(file.size)}
                    {file.uploadDate && ` • Uploaded: ${formatDate(file.uploadDate)}`}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Finalised Contract Agreement - if exists */}
          {submission?.contractDrafter?.finalizedAgreement && (
            <View style={styles.fileItem}>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>Finalised Contract Agreement</Text>
                <Text style={styles.fileMeta}>
                  {submission.contractDrafter.finalizedAgreement.name} • {formatFileSize(submission.contractDrafter.finalizedAgreement.size)}
                  {submission.contractDrafter.signedAt && ` • Uploaded: ${formatDate(submission.contractDrafter.signedAt)}`}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.footer}>
            Page 4 - NHS Barts Health Trust
          </Text>
        </Page>
      )}

      {/* AUTHORISATION USE ONLY - Only show if there are any authorisation decisions */}
      {submission && (submission.pbpReview || submission.procurementReview || submission.opwReview || submission.contractDrafter || submission.apControlReview) && (
        <Page size="A4" style={styles.page}>
          <View style={styles.authorisationSection} wrap={false}>
            {/* Header with red underline */}
            <View style={styles.authHeader}>
              <Text style={styles.authHeaderText}>AUTHORISATION USE ONLY</Text>
              <View style={styles.redLine} />
            </View>

            {/* 1. PBP Review - Always first if exists */}
            {submission.pbpReview && (
              <View style={styles.authBlock}>
                <View style={styles.authBlockHeader}>
                  <Text style={styles.authBlockTitle}>Procurement Business Partner</Text>
                  <View
                    style={[
                      styles.authBadge,
                      submission.pbpReview.decision === 'approved'
                        ? styles.badgeGreen
                        : submission.pbpReview.decision === 'rejected'
                        ? styles.badgeRed
                        : styles.badgeAmber,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {submission.pbpReview.decision?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                {submission.pbpReview.comments && (
                  <Text style={styles.authComments}>Comments: {submission.pbpReview.comments}</Text>
                )}
                <View style={styles.signatureRow}>
                  <Text>Signature: {submission.pbpReview.signature || '_______________'}</Text>
                  <Text>
                    Date:{' '}
                    {submission.pbpReview.date
                      ? formatDate(submission.pbpReview.date)
                      : '_______________'}
                  </Text>
                </View>
              </View>
            )}

            {/* 2. Procurement Review - Always second */}
            {submission.procurementReview && (
              <View style={styles.authBlock}>
                <View style={styles.authBlockHeader}>
                  <Text style={styles.authBlockTitle}>Procurement</Text>
                  <View
                    style={[
                      styles.authBadge,
                      submission.procurementReview.supplierClassification === 'standard'
                        ? styles.badgeBlue
                        : styles.badgeOrange,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {submission.procurementReview.supplierClassification === 'standard'
                        ? 'Standard Supplier'
                        : 'Potential OPW/IR35'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.authBadge,
                      submission.procurementReview.decision === 'approved'
                        ? styles.badgeGreen
                        : submission.procurementReview.decision === 'rejected'
                        ? styles.badgeRed
                        : styles.badgeAmber,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {submission.procurementReview.decision?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                {submission.procurementReview.alembaReference && (
                  <Text style={styles.authField}>Alemba Reference: {submission.procurementReview.alembaReference}</Text>
                )}
                {submission.procurementReview.comments && (
                  <Text style={styles.authComments}>Comments: {submission.procurementReview.comments}</Text>
                )}
                <View style={styles.signatureRow}>
                  <Text>Signature: {submission.procurementReview.signature || '_______________'}</Text>
                  <Text>
                    Date:{' '}
                    {submission.procurementReview.date
                      ? formatDate(submission.procurementReview.date)
                      : '_______________'}
                  </Text>
                </View>
              </View>
            )}

            {/* 3. OPW Panel Review - Only if OPW/IR35 classification */}
            {submission.procurementReview?.supplierClassification === 'opw_ir35' && submission.opwReview && (
              <View style={styles.authBlock}>
                <View style={styles.authBlockHeader}>
                  <Text style={styles.authBlockTitle}>OPW Panel Assessment</Text>
                  {/* Worker Classification Badge */}
                  <View style={[styles.authBadge, styles.badgeBlue]}>
                    <Text style={styles.badgeText}>
                      {submission.opwReview.workerClassification === 'sole_trader' ? 'SOLE TRADER' : 'INTERMEDIARY'}
                    </Text>
                  </View>
                  {/* Decision Badge */}
                  <View
                    style={[
                      styles.authBadge,
                      submission.opwReview.decision === 'approved' ? styles.badgeGreen : styles.badgeRed,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {submission.opwReview.decision?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Sole Trader Path - Employment Status */}
                {submission.opwReview.workerClassification === 'sole_trader' && submission.opwReview.employmentStatus && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.authField}>
                      Employment Status:{' '}
                      <Text style={{ fontWeight: 'bold', color: submission.opwReview.employmentStatus === 'employed' ? '#dc2626' : '#22c55e' }}>
                        {submission.opwReview.employmentStatus === 'employed' ? 'EMPLOYED (ESR/Payroll)' : 'SELF-EMPLOYED'}
                      </Text>
                    </Text>
                    {submission.opwReview.employmentStatus === 'employed' && (
                      <View style={{ marginTop: 4, padding: 6, backgroundColor: '#fef2f2', borderRadius: 4 }}>
                        <Text style={{ fontSize: 8, color: '#991b1b', fontWeight: 'bold' }}>
                          ⚠ PAYROLL ROUTE: Worker classified as employed. Must be paid via NHS payroll (ESR). No Oracle supplier record created.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Intermediary Path - IR35 Status */}
                {submission.opwReview.workerClassification === 'intermediary' && submission.opwReview.ir35Status && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.authField}>
                      IR35 Status:{' '}
                      <Text style={{ fontWeight: 'bold', color: submission.opwReview.ir35Status === 'outside' ? '#22c55e' : '#dc2626' }}>
                        {submission.opwReview.ir35Status === 'inside' ? 'INSIDE IR35 (Payroll)' : 'OUTSIDE IR35'}
                      </Text>
                    </Text>

                    {/* SDS Tracking - Only for Inside IR35 */}
                    {submission.opwReview.ir35Status === 'inside' && submission.opwReview.sdsTracking && (
                      <View style={{ marginTop: 4, padding: 6, backgroundColor: '#fef2f2', borderRadius: 4 }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#991b1b', marginBottom: 3 }}>
                          Status Determination Statement (SDS) Tracking:
                        </Text>
                        {submission.opwReview.sdsTracking.sdsIssued && (
                          <>
                            <Text style={{ fontSize: 8, color: '#7f1d1d' }}>
                              • SDS Issued: {formatDate(submission.opwReview.sdsTracking.sdsIssuedDate)}
                            </Text>
                            {submission.opwReview.sdsTracking.sdsResponseReceived ? (
                              <Text style={{ fontSize: 8, color: '#7f1d1d' }}>
                                • Response Received: {formatDate(submission.opwReview.sdsTracking.sdsResponseDate)} ✓
                              </Text>
                            ) : (
                              <Text style={{ fontSize: 8, color: '#7f1d1d' }}>
                                • Response Status: Awaiting response
                                {submission.opwReview.sdsTracking.daysSinceIssued !== undefined &&
                                  ` (${submission.opwReview.sdsTracking.daysSinceIssued} days elapsed${submission.opwReview.sdsTracking.daysSinceIssued > 14 ? ' - OVERDUE' : ''})`
                                }
                              </Text>
                            )}
                          </>
                        )}
                        <Text style={{ fontSize: 8, color: '#991b1b', marginTop: 3, fontWeight: 'bold' }}>
                          ⚠ PAYROLL ROUTE: Inside IR35 determination. Must be paid via NHS payroll (ESR). No Oracle supplier record created.
                        </Text>
                      </View>
                    )}

                    {/* Outside IR35 - Contract Required */}
                    {submission.opwReview.ir35Status === 'outside' && submission.opwReview.contractRequired && (
                      <Text style={[styles.authField, { marginTop: 4 }]}>
                        Contract Required: {submission.opwReview.contractRequired === 'yes' ? 'Yes' : 'No'}
                      </Text>
                    )}
                  </View>
                )}

                {/* Rationale */}
                {submission.opwReview.rationale && (
                  <Text style={styles.authComments}>Rationale: {submission.opwReview.rationale}</Text>
                )}

                {/* Signature */}
                <View style={styles.signatureRow}>
                  <Text>Signature: {submission.opwReview.signature || '_______________'}</Text>
                  <Text>
                    Date:{' '}
                    {submission.opwReview.date
                      ? formatDate(submission.opwReview.date)
                      : '_______________'}
                  </Text>
                </View>
              </View>
            )}

            {/* 4. Contract Drafter - Show if contract drafter data exists with approved decision */}
            {submission.contractDrafter && submission.contractDrafter.decision === 'approved' && (
              <View style={styles.authBlock}>
                <View style={styles.authBlockHeader}>
                  <Text style={styles.authBlockTitle}>Contract Agreement</Text>
                  <View style={[styles.authBadge, styles.badgeGreen]}>
                    <Text style={styles.badgeText}>APPROVED</Text>
                  </View>
                </View>
                {submission.contractDrafter.templateUsed && (
                  <Text style={styles.authField}>Agreement Type: {submission.contractDrafter.templateUsed}</Text>
                )}
                {submission.contractDrafter.finalizedAgreement && (
                  <Text style={styles.authField}>Final Document: {submission.contractDrafter.finalizedAgreement.name}</Text>
                )}
                {/* Show worker classification and relevant status from OPW review */}
                {submission.opwReview?.workerClassification && (
                  <Text style={styles.authField}>
                    Worker Classification: {submission.opwReview.workerClassification === 'sole_trader' ? 'Sole Trader (Self-Employed)' : 'Intermediary (Outside IR35)'}
                  </Text>
                )}
                <View style={styles.signatureRow}>
                  <Text>
                    Approved by: {submission.contractDrafter.digitalSignature || submission.contractDrafter.decidedBy || submission.contractDrafter.signature || '_______________'}
                  </Text>
                  <Text>
                    Date: {submission.contractDrafter.signedAt ? formatDate(submission.contractDrafter.signedAt) : submission.contractDrafter.decidedAt ? formatDate(submission.contractDrafter.decidedAt) : submission.contractDrafter.date ? formatDate(submission.contractDrafter.date) : '_______________'}
                  </Text>
                </View>
              </View>
            )}

            {/* 5. AP Control Review - Only show if apControlReview exists */}
            {submission.apControlReview && (
              <View style={styles.authBlock}>
                <View style={styles.authBlockHeader}>
                  <Text style={styles.authBlockTitle}>AP Control Verification</Text>
                  <View style={[styles.authBadge, styles.badgeGreen]}>
                    <Text style={styles.badgeText}>VERIFIED</Text>
                  </View>
                </View>
                {submission.apControlReview.supplierNumber && (
                  <Text style={styles.authField}>Supplier Number: {submission.apControlReview.supplierNumber}</Text>
                )}
                {submission.apControlReview.notes && (
                  <Text style={styles.authComments}>Notes: {submission.apControlReview.notes}</Text>
                )}
                <View style={styles.signatureRow}>
                  <Text>Signature: {submission.apControlReview.signature || '_______________'}</Text>
                  <Text>
                    Date:{' '}
                    {submission.apControlReview.date
                      ? formatDate(submission.apControlReview.date)
                      : '_______________'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.footer}>Page 5 - NHS Barts Health Trust</Text>
        </Page>
      )}
    </Document>
  );
};

export default SupplierFormPDF;
