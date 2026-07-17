/**
 * GraphStorageProvider — production storage against SharePoint via Microsoft
 * Graph (delegated, Sites.Selected). Replaces the dev LocalStorageProvider.
 *
 * Implements the seven provider rules from
 * docs/deployment/setup/06-hybrid-sharepoint-flows.md §4b:
 *  1. Bank details are NEVER written to FormDataJSON — they go to the
 *     restricted SSF-BankDetails list (Option B).
 *  2. Attachment/base64 content is NEVER stored in list columns — files are
 *     uploaded to the document libraries and referenced by name + URL.
 *  3. RequesterEmail is stamped from the signed-in UPN, not the typed field.
 *  4. AwaitingParty mirrors the info-required conversation state (F6 trigger).
 *  5. Supplier participation is email-only (nothing to do here — no supplier
 *     writes ever reach this provider in production).
 *  6. Questionnaire approval uploads the certificate as
 *     SupplierDocuments/<QUEST-id>/Certificate.pdf (F2 fetches that exact
 *     path).
 *  7. Optimistic concurrency: field PATCHes send If-Match with the etag from
 *     load; a 412 surfaces as a CONFLICT error ("someone decided first").
 *
 * Testability: constructor accepts { getToken, graphBase } overrides so the
 * whole provider runs against the local mock Graph server (ssf-verify)
 * without MSAL or a real tenant.
 */

import { STAGE_QUEUE_STATUSES } from '../utils/workflowStatus';
import { getSharePointLibrary } from '../constants/documentTypes';

// Section 6 typed bank fields — SSF-BankDetails columns, never FormDataJSON
const BANK_FIELDS = {
  nameOnAccount: 'NameOnAccount',
  sortCode: 'SortCode',
  accountNumber: 'AccountNumber',
  iban: 'IBAN',
  swiftCode: 'SWIFTCode',
  bankRouting: 'BankRouting',
};

// Top-level submission keys ↔ SSF-Submissions columns
const COLUMN_MAP = {
  status: 'Status',
  currentStage: 'CurrentStage',
  vendorNumber: 'VendorNumber',
  alembaReference: 'AlembaReference',
  outcomeRoute: 'OutcomeRoute',
  pbpCategory: 'PBPCategory',
  site: 'Site',
};

// Review objects ↔ their JSON columns
const REVIEW_COLUMNS = {
  pbpReview: 'PBPReviewJSON',
  procurementReview: 'ProcurementReviewJSON',
  opwReview: 'OPWReviewJSON',
  contractDrafter: 'ContractReviewJSON',
  apReview: 'APReviewJSON',
  apControlReview: 'APReviewJSON',
};

// pbpReview.currentStatus ↔ the AwaitingParty choice column (F6's trigger)
const AWAITING_PARTY = {
  awaiting_requester: 'requester',
  awaiting_pbp: 'pbp',
};

// Upload slot keys (uploadedFiles.<key>) → canonical DOCUMENT_TYPES ids, so
// library routing and F3's DocumentType filter both work. F3 deletes
// DocumentType ∈ {passport, licence-front, licence-back} on completion.
const SLOT_TO_DOCTYPE = {
  letterhead: 'letterhead_bank_details',
  passportPhoto: 'passport',
  licenceFront: 'licence-front',
  licenceBack: 'licence-back',
  cestForm: 'cest_form',
  procurementApproval: 'procurement_approval',
};

const stripBankFields = (formData = {}) => {
  const clean = { ...formData };
  for (const key of Object.keys(BANK_FIELDS)) delete clean[key];
  return clean;
};

const base64ToBlob = (dataUrl, fallbackMime = 'application/octet-stream') => {
  const [meta, data] = String(dataUrl).split(',');
  const mime = /data:(.*?);/.exec(meta)?.[1] || fallbackMime;
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

class GraphStorageProvider {
  constructor({ getToken, graphBase, spHostname, spSitePath } = {}) {
    this.getToken = getToken; // injected: msalAuth.getGraphToken or a mock
    this.graphBase = graphBase || import.meta.env.VITE_GRAPH_BASE || 'https://graph.microsoft.com/v1.0';
    this.spHostname = spHostname || import.meta.env.VITE_SP_HOSTNAME || 'nhs.sharepoint.com';
    this.spSitePath = spSitePath || import.meta.env.VITE_SP_SITE_PATH || '/sites/R1H_SupplierSetupForm-CW-PROC-GSS';
    this.siteId = null;
    this.driveIds = {}; // library name -> driveId
    this.itemIds = {};  // submissionId -> { itemId, etag }
    this.me = null;
  }

  // ---------- HTTP plumbing ----------

  async request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
    const token = await this.getToken();
    const response = await fetch(`${this.graphBase}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body && !(body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body instanceof Blob ? body : body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 412) {
      const err = new Error(
        'This item was changed by someone else since you opened it — refresh to see the latest state before deciding.'
      );
      err.code = 'CONFLICT';
      throw err;
    }
    if (response.status === 401 || response.status === 403) {
      const err = new Error('ACCESS_DENIED');
      err.code = 'ACCESS_DENIED';
      throw err;
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const err = new Error(`Graph request failed (${response.status}): ${detail.slice(0, 300)}`);
      err.status = response.status;
      throw err;
    }
    if (raw || response.status === 204) return response;
    return response.json();
  }

  async getSiteId() {
    if (!this.siteId) {
      const site = await this.request(`/sites/${this.spHostname}:${this.spSitePath}`);
      this.siteId = site.id;
    }
    return this.siteId;
  }

  async getDriveId(libraryName) {
    if (!this.driveIds[libraryName]) {
      const siteId = await this.getSiteId();
      const drives = await this.request(`/sites/${siteId}/drives`);
      const drive = (drives.value || []).find((d) => d.name === libraryName);
      if (!drive) throw new Error(`Document library not found: ${libraryName}`);
      this.driveIds[libraryName] = drive.id;
    }
    return this.driveIds[libraryName];
  }

  async listItems(listName, query = '') {
    const siteId = await this.getSiteId();
    return this.request(`/sites/${siteId}/lists/${listName}/items?$expand=fields${query}`, {
      // Title is not an indexed column; fine at this list's volume (~300/yr)
      headers: { Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' },
    });
  }

  // ---------- session / roles ----------

  /**
   * Roles come from the SSF-RoleMap list (UserEmail → Roles, comma-separated
   * role keys: pbp, procurement, opw, contract, ap_control, admin), because
   * SharePoint group membership is not visible through delegated
   * Sites.Selected. The list mirrors the SSF-* groups and is maintained
   * alongside them (see design doc §4b role-resolution note).
   */
  async getSession() {
    if (!this.me) {
      this.me = await this.request('/me');
    }
    const email = (this.me.mail || this.me.userPrincipalName || '').toLowerCase();

    let groups = [];
    try {
      const result = await this.listItems('SSF-RoleMap');
      const row = (result.value || []).find(
        (r) => (r.fields?.UserEmail || '').toLowerCase() === email
      );
      if (row?.fields?.Roles) {
        const ROLE_TO_GROUP = {
          pbp: 'SSF-PBP',
          procurement: 'SSF-Procurement',
          opw: 'SSF-OPW',
          contract: 'SSF-Contract',
          ap_control: 'SSF-APControl',
          admin: 'SSF-Admin',
        };
        groups = String(row.fields.Roles)
          .split(',')
          .map((r) => ROLE_TO_GROUP[r.trim().toLowerCase()])
          .filter(Boolean);
      }
    } catch (err) {
      // No RoleMap list / no access → requester-only session (never fatal)
      console.warn('Role resolution unavailable — treating user as requester only:', err.message);
    }

    return {
      user: {
        email,
        name: this.me.displayName || email,
        displayName: this.me.displayName || email,
        groups,
      },
    };
  }

  // ---------- read ----------

  async getSubmission(id) {
    const result = await this.listItems(
      'SSF-Submissions',
      `&$filter=fields/Title eq '${encodeURIComponent(String(id).replace(/'/g, ''))}'`
    );
    const item = (result.value || [])[0];
    if (!item) return null;

    // Preserve the FIRST etag seen for this id (page-load state). Refreshing
    // it on every read would defeat the optimistic-concurrency guard — a
    // decision handler that re-reads just before writing would silently adopt
    // the other reviewer's etag and overwrite them. A successful write clears
    // the entry, so the next page load re-baselines.
    if (!this.itemIds[id]) {
      this.itemIds[id] = { itemId: item.id, etag: item.eTag || item['@odata.etag'] || null };
    }
    const f = item.fields || {};

    const parse = (json, fallback) => {
      if (!json) return fallback;
      try { return JSON.parse(json); } catch { return fallback; }
    };

    const submission = {
      id: f.Title,
      submissionId: f.Title,
      status: f.Status,
      currentStage: f.CurrentStage,
      submissionDate: f.Created || item.createdDateTime,
      submittedBy: f.RequesterEmail,
      requesterEmail: f.RequesterEmail,
      vendorNumber: f.VendorNumber || null,
      alembaReference: f.AlembaReference || null,
      outcomeRoute: f.OutcomeRoute || null,
      pbpCategory: f.PBPCategory || null,
      site: f.Site || null,
      type: f.SubmissionType === 'questionnaire' ? 'questionnaire' : undefined,
      formData: parse(f.FormDataJSON, {}),
      pbpReview: parse(f.PBPReviewJSON, null),
      procurementReview: parse(f.ProcurementReviewJSON, null),
      opwReview: parse(f.OPWReviewJSON, null),
      contractDrafter: parse(f.ContractReviewJSON, null),
      apControlReview: parse(f.APReviewJSON, null),
    };
    // legacy alias used by some pages
    submission.apReview = submission.apControlReview;
    return submission;
  }

  async getWorkQueue(stage) {
    const statuses = STAGE_QUEUE_STATUSES[stage] || [];
    const result = await this.listItems('SSF-Submissions');
    return Promise.all(
      (result.value || [])
        .filter((item) => statuses.includes((item.fields?.Status || '').toLowerCase()))
        .map((item) => this.getSubmission(item.fields.Title))
    );
  }

  // ---------- uploads (rule 2) ----------

  async uploadFile(library, path, blob) {
    const driveId = await this.getDriveId(library);
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const item = await this.request(`/drives/${driveId}/root:/${encoded}:/content`, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': blob.type || 'application/octet-stream' },
    });
    return { name: path.split('/').pop(), url: item.webUrl || null, driveItemId: item.id };
  }

  async uploadDocument(submissionId, file, documentType) {
    const library = getSharePointLibrary(documentType);
    const uploaded = await this.uploadFile(library, `${submissionId}/${file.name}`, file);
    if (library === 'SensitiveDocuments') {
      // F3's deletion filter reads the DocumentType column
      try {
        const driveId = await this.getDriveId(library);
        await this.request(`/drives/${driveId}/items/${uploaded.driveItemId}/listItem/fields`, {
          method: 'PATCH',
          body: { DocumentType: documentType },
        });
      } catch (err) {
        console.warn('Could not set DocumentType column:', err.message);
      }
    }
    return { success: true, documentId: uploaded.driveItemId, url: uploaded.url };
  }

  /**
   * Walk uploads embedded in the submission (dev shape: base64 data URLs),
   * push each file to the right library, and return metadata-only copies.
   */
  async externaliseUploads(submissionId, uploads) {
    if (!uploads || typeof uploads !== 'object') return uploads;
    const out = {};
    for (const [key, fileObj] of Object.entries(uploads)) {
      const data = fileObj?.base64 || fileObj?.data || fileObj?.content;
      if (data && String(data).startsWith('data:')) {
        // documentType may be explicit; otherwise the upload slot key is the
        // semantic type ('letterhead', 'cestForm'…) — fileObj.type is usually
        // a MIME type, so it comes last
        const documentType = fileObj.documentType || SLOT_TO_DOCTYPE[key] || key || fileObj.type;
        const library =
          key === 'passportPhoto' || key === 'licenceFront' || key === 'licenceBack'
            ? 'SensitiveDocuments' // ID documents are always restricted
            : getSharePointLibrary(documentType);
        // Key-prefixed so two upload slots with identical file names
        // (e.g. both "scan.pdf") can't overwrite each other
        const name = `${key}_${fileObj.name || 'document.pdf'}`;
        try {
          const uploaded = await this.uploadFile(library, `${submissionId}/${name}`, base64ToBlob(data, fileObj.mimeType));
          out[key] = {
            name,
            documentType,
            library,
            url: uploaded.url,
            size: fileObj.size,
            uploadedAt: new Date().toISOString(),
          };
          if (library === 'SensitiveDocuments') {
            try {
              const driveId = await this.getDriveId(library);
              await this.request(`/drives/${driveId}/items/${uploaded.driveItemId}/listItem/fields`, {
                method: 'PATCH',
                body: { DocumentType: documentType },
              });
            } catch { /* column tagging is best-effort */ }
          }
        } catch (err) {
          console.error(`Upload failed for ${name}:`, err.message);
          out[key] = { name, documentType, uploadFailed: true };
        }
      } else {
        out[key] = fileObj; // already metadata-only
      }
    }
    return out;
  }

  /** Strip base64 attachments out of review exchanges (rule 2). */
  async externaliseExchanges(submissionId, review) {
    if (!review?.exchanges?.length) return review;
    const exchanges = [];
    for (const exchange of review.exchanges) {
      if (!exchange?.attachments) { exchanges.push(exchange); continue; }
      const attachments = [];
      for (const att of Object.values(exchange.attachments)) {
        const data = att?.base64 || att?.data || att?.content;
        if (data && String(data).startsWith('data:')) {
          try {
            const stamp = (exchange.timestamp || new Date().toISOString()).replace(/[:.]/g, '-');
            const uploaded = await this.uploadFile(
              'SupplierDocuments',
              `${submissionId}/exchanges/${stamp}-${att.name || 'attachment'}`,
              base64ToBlob(data, att.mimeType || att.type)
            );
            attachments.push({ name: att.name, url: uploaded.url });
          } catch (err) {
            console.error('Exchange attachment upload failed:', err.message);
            attachments.push({ name: att.name, uploadFailed: true });
          }
        } else {
          attachments.push(att);
        }
      }
      exchanges.push({ ...exchange, attachments });
    }
    return { ...review, exchanges };
  }

  // ---------- write ----------

  async saveSubmission(data) {
    const id = data.id || data.submissionId || this.generateId(data.type === 'questionnaire');
    const siteId = await this.getSiteId();
    const session = await this.getSession(); // rule 3: UPN, not typed email

    const uploads = await this.externaliseUploads(
      id,
      data.uploadedFiles || data.uploads || data.formData?.uploadedFiles
    );

    const formData = stripBankFields(data.formData || {});
    delete formData.uploadedFiles;
    delete formData.uploads;

    // Rule 1: typed bank details → the restricted SSF-BankDetails list
    const bankFields = {};
    for (const [appKey, column] of Object.entries(BANK_FIELDS)) {
      const value = data.formData?.[appKey];
      if (value) bankFields[column] = String(value);
    }
    if (Object.keys(bankFields).length > 0) {
      await this.request(`/sites/${siteId}/lists/SSF-BankDetails/items`, {
        method: 'POST',
        body: { fields: { Title: id, ...bankFields } },
      });
    }

    const fields = {
      Title: id,
      Status: data.status || 'pending_review',
      CurrentStage: data.currentStage || 'pbp',
      RequesterName: `${data.formData?.firstName || ''} ${data.formData?.lastName || ''}`.trim()
        || session.user.name,
      RequesterEmail: session.user.email, // rule 3
      RequesterDept: data.formData?.department || '',
      CompanyName: data.formData?.companyName || data.formData?.supplierName
        || data.questionnaireData?.supplierName || '',
      TradingName: data.formData?.tradingName || '',
      SupplierType: data.formData?.supplierType || null,
      CRN: data.formData?.crn || '',
      VATNumber: data.formData?.vatNumber || '',
      CharityNumber: data.formData?.charityNumber || '',
      ServiceCategory: data.formData?.serviceCategory || null,
      SubmissionType: data.type === 'questionnaire' || String(id).startsWith('QUEST-') ? 'questionnaire' : 'full',
      AwaitingParty: 'none',
      PBPCategory: data.pbpCategory || data.formData?.pbpCategory || '',
      Site: data.site || data.formData?.site || '',
      FormDataJSON: JSON.stringify({ ...formData, uploadedFiles: uploads }),
    };
    // Choice columns reject nulls — drop empties
    for (const key of Object.keys(fields)) {
      if (fields[key] === null || fields[key] === undefined) delete fields[key];
    }

    if (data.pbpReview) fields.PBPReviewJSON = JSON.stringify(data.pbpReview);

    const created = await this.request(`/sites/${siteId}/lists/SSF-Submissions/items`, {
      method: 'POST',
      body: { fields },
    });
    this.itemIds[id] = { itemId: created.id, etag: created.eTag || null };
    return { success: true, id };
  }

  async updateSubmission(id, patch) {
    const siteId = await this.getSiteId();
    if (!this.itemIds[id]) {
      const existing = await this.getSubmission(id);
      if (!existing) throw new Error(`Submission not found: ${id}`);
    }
    const { itemId, etag } = this.itemIds[id];

    const fields = {};
    for (const [appKey, column] of Object.entries(COLUMN_MAP)) {
      if (patch[appKey] !== undefined && patch[appKey] !== null) fields[column] = patch[appKey];
    }

    for (const [appKey, column] of Object.entries(REVIEW_COLUMNS)) {
      if (patch[appKey] !== undefined) {
        const externalised = await this.externaliseExchanges(id, patch[appKey]);
        fields[column] = JSON.stringify(externalised);

        // Rule 4: AwaitingParty drives F6
        if (appKey === 'pbpReview' && externalised?.currentStatus) {
          fields.AwaitingParty = AWAITING_PARTY[externalised.currentStatus] || 'none';
        }
        // Claim mirroring drives F7
        if (appKey === 'pbpReview' && externalised?.claim) {
          fields.ClaimedBy = externalised.claim.email || '';
          fields.ClaimedByName = externalised.claim.name || '';
          if (externalised.claim.at) fields.ClaimedAt = externalised.claim.at;
        }
      }
    }

    if (patch.formData) {
      fields.FormDataJSON = JSON.stringify(stripBankFields(patch.formData));
    }

    if (Object.keys(fields).length > 0) {
      await this.request(`/sites/${siteId}/lists/SSF-Submissions/items/${itemId}/fields`, {
        method: 'PATCH',
        body: fields,
        headers: etag ? { 'If-Match': etag } : {}, // rule 7
      });
      // refresh etag for subsequent writes in this session
      delete this.itemIds[id];
    }

    // Rule 6: questionnaire approved → upload Certificate.pdf where F2 expects it
    if (String(id).startsWith('QUEST-') && patch.pbpReview?.decision === 'approved') {
      try {
        await this.uploadQuestionnaireCertificate(id, patch);
      } catch (err) {
        // The decision is saved; a missing certificate surfaces as a failed
        // F2 run — loud but recoverable (re-approve regenerates it)
        console.error('Certificate upload failed — F2 will fail to attach it:', err);
      }
    }

    return { success: true };
  }

  async uploadQuestionnaireCertificate(id, patch) {
    const [{ pdf }, React, { default: PBPApprovalPDF }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('react'),
      import('../components/pdf/PBPApprovalPDF'),
    ]);
    const submission = (await this.getSubmission(id)) || {};
    const merged = { ...submission, ...patch, pbpReview: patch.pbpReview };
    const questionnaireType = merged.questionnaireType
      || merged.formData?.serviceCategory === 'clinical' ? 'clinical' : 'nonClinical';
    const questionnaireData = merged.formData?.[`${questionnaireType}Questionnaire`]
      || merged.questionnaireData || merged.formData || {};
    const blob = await pdf(
      React.createElement(PBPApprovalPDF, {
        submission: merged,
        questionnaireType,
        questionnaireData,
        pbpReview: patch.pbpReview,
      })
    ).toBlob();
    await this.uploadFile('SupplierDocuments', `${id}/Certificate.pdf`, blob);
  }

  async getDocument() {
    throw new Error('getDocument is not used in production — documents open via their SharePoint URL');
  }

  generateId(isQuestionnaire = false) {
    const year = new Date().getFullYear();
    const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
    return isQuestionnaire ? `QUEST-${Date.now()}` : `SUP-${year}-${hex}`;
  }
}

export default GraphStorageProvider;
