/**
 * PBP Approval PDF Certificate
 * Certificate showing ALL questionnaire answers that can be downloaded by requester as proof of procurement engagement
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatDate } from '../../utils/helpers';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#005EB8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#005EB8',
  },
  subtitle: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 4,
  },
  approvedBadge: {
    backgroundColor: '#22c55e',
    color: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  refInfo: {
    marginBottom: 20,
    fontSize: 9,
    color: '#6b7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#005EB8',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 3,
  },
  fieldLabel: {
    width: 180,
    fontWeight: 'bold',
    color: '#4b5563',
    fontSize: 9,
  },
  fieldValue: {
    flex: 1,
    color: '#1f2937',
    fontSize: 9,
  },
  textBlock: {
    marginBottom: 8,
  },
  textLabel: {
    fontWeight: 'bold',
    color: '#4b5563',
    fontSize: 9,
    marginBottom: 4,
  },
  textValue: {
    color: '#1f2937',
    fontSize: 9,
    lineHeight: 1.4,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 4,
  },
  authorisationSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#005EB8',
  },
  authTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#005EB8',
    marginBottom: 12,
  },
  signatureBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureField: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  signatureValue: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 'bold',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    fontSize: 8,
    color: '#0369a1',
    textAlign: 'center',
  },
  commentsSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fefce8',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#eab308',
  },
  commentsLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#854d0e',
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 9,
    color: '#713f12',
  },
});

const PBPApprovalPDF = ({ submission, questionnaireType, questionnaireData, pbpReview }) => {
  const section1 = submission?.formData || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Procurement Business Partner Approval</Text>
              <Text style={styles.subtitle}>
                {questionnaireType === 'clinical' ? 'Clinical' : 'Non-Clinical'} Supplier Questionnaire
              </Text>
            </View>
            <View style={styles.approvedBadge}>
              <Text>✓ APPROVED</Text>
            </View>
          </View>
        </View>

        {/* Reference Info */}
        <View style={styles.refInfo}>
          <Text>Reference: {submission?.submissionId || 'N/A'}</Text>
          <Text>
            Approval Date:{' '}
            {pbpReview?.approvalDate ? formatDate(pbpReview.approvalDate) : new Date().toLocaleDateString('en-GB')}
          </Text>
        </View>

        {/* Section 1: Requester Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requester Information</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name:</Text>
            <Text style={styles.fieldValue}>
              {section1.firstName} {section1.lastName}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Job Title:</Text>
            <Text style={styles.fieldValue}>{section1.jobTitle}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Department:</Text>
            <Text style={styles.fieldValue}>{section1.department}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>NHS Email:</Text>
            <Text style={styles.fieldValue}>{section1.nhsEmail}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone Number:</Text>
            <Text style={styles.fieldValue}>{section1.phoneNumber}</Text>
          </View>
        </View>

        {/* Questionnaire Responses - ALL ANSWERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {questionnaireType === 'clinical' ? 'Clinical' : 'Non-Clinical'} Questionnaire Responses
          </Text>

          {questionnaireType === 'clinical' ? (
            <>
              {/* Clinical Questionnaire - ALL fields */}
              <View style={styles.textBlock}>
                <Text style={styles.textLabel}>1. Description of Clinical Services:</Text>
                <Text style={styles.textValue}>
                  {questionnaireData?.clinicalServices || 'Not provided'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>2. Direct Patient Contact:</Text>
                <Text style={styles.fieldValue}>
                  {questionnaireData?.patientContact === 'yes' ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>3. Patient Data Access Required:</Text>
                <Text style={styles.fieldValue}>
                  {questionnaireData?.patientDataAccess === 'yes' ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.textBlock}>
                <Text style={styles.textLabel}>4. Clinical Qualifications/Registrations:</Text>
                <Text style={styles.textValue}>
                  {questionnaireData?.clinicalQualifications || 'Not provided'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>5. Estimated Annual Contract Value:</Text>
                <Text style={styles.fieldValue}>
                  £{questionnaireData?.annualValue?.toLocaleString() || '0'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>6. Clinical Impact Assessment:</Text>
                <Text style={styles.fieldValue}>
                  {questionnaireData?.clinicalImpact || 'Not provided'}
                </Text>
              </View>

              <View style={styles.textBlock}>
                <Text style={styles.textLabel}>7. Additional Notes/Information:</Text>
                <Text style={styles.textValue}>
                  {questionnaireData?.additionalNotes || 'None provided'}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Non-Clinical Questionnaire - ALL fields */}
              <View style={styles.textBlock}>
                <Text style={styles.textLabel}>1. Description of Goods/Services:</Text>
                <Text style={styles.textValue}>
                  {questionnaireData?.goodsServices || 'Not provided'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>2. Procurement Category:</Text>
                <Text style={styles.fieldValue}>{questionnaireData?.category || 'Not specified'}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>3. Estimated Annual Contract Value:</Text>
                <Text style={styles.fieldValue}>
                  £{questionnaireData?.annualValue?.toLocaleString() || '0'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>4. Framework Agreement Available:</Text>
                <Text style={styles.fieldValue}>
                  {questionnaireData?.framework || 'Not specified'}
                </Text>
              </View>

              <View style={styles.textBlock}>
                <Text style={styles.textLabel}>5. Reason for Selecting This Supplier:</Text>
                <Text style={styles.textValue}>{questionnaireData?.reason || 'Not provided'}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>6. Alternative Suppliers Considered:</Text>
                <Text style={styles.fieldValue}>
                  {questionnaireData?.alternatives === 'yes' ? 'Yes' : 'No'}
                </Text>
              </View>

              {questionnaireData?.alternatives === 'yes' && (
                <View style={styles.textBlock}>
                  <Text style={styles.textLabel}>7. Alternative Suppliers Details:</Text>
                  <Text style={styles.textValue}>
                    {questionnaireData?.alternativeDetails || 'Not provided'}
                  </Text>
                </View>
              )}

              <View style={styles.textBlock}>
                <Text style={styles.textLabel}>8. Additional Notes/Information:</Text>
                <Text style={styles.textValue}>
                  {questionnaireData?.additionalNotes || 'None provided'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* PBP Comments - if any */}
        {(pbpReview?.approvalComments || pbpReview?.comments) && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsLabel}>PBP Comments:</Text>
            <Text style={styles.commentsText}>{pbpReview.approvalComments || pbpReview.comments}</Text>
          </View>
        )}

        {/* Authorisation Section - Properly positioned */}
        <View style={styles.authorisationSection}>
          <Text style={styles.authTitle}>AUTHORISATION</Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Approved by:</Text>
              <Text style={styles.signatureValue}>
                {pbpReview?.signature || pbpReview?.approver || 'Not signed'}
              </Text>
            </View>
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Date:</Text>
              <Text style={styles.signatureValue}>
                {pbpReview?.date ? formatDate(pbpReview.date) : pbpReview?.approvalDate ? formatDate(pbpReview.approvalDate) : 'Not dated'}
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            This document confirms that the above supplier questionnaire has been reviewed and approved by the
            Procurement Business Partner team. This approval certificate can be uploaded to the Supplier Setup Form as
            evidence of procurement engagement.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PBPApprovalPDF;
