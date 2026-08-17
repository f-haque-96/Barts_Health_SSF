// Mock Microsoft Graph + SharePoint for GraphStorageProvider testing (:3996).
// In-memory lists/drives; honors If-Match (412 on stale etag); /__dump for
// assertions; /__seed to preload rows. Run: node mock-graph.js
const http = require('http');

const SITE_ID = 'mock-site-1';
const state = {
  lists: {
    'SSF-Submissions': [],
    'SSF-BankDetails': [],
    'SSF-AuditTrail': [],
    'SSF-RoleMap': [
      // graph.tester is admin so review pages open in the smoke test
      { id: '1', eTag: 'etag-1', fields: { Title: 'graph tester', UserEmail: 'graph.tester@nhs.net', Roles: 'admin' } },
    ],
    'SSF-SupplierPacks': [],
  },
  drives: {
    d1: { name: 'SupplierDocuments', files: {} },
    d2: { name: 'SensitiveDocuments', files: {} },
  },
  nextId: 100,
};

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
});

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 200, {});
  const url = decodeURIComponent(req.url);
  const body = await readBody(req);
  const parse = () => { try { return JSON.parse(body.toString() || '{}'); } catch { return {}; } };

  // debug endpoints
  if (url === '/__dump') return json(res, 200, state);
  if (url === '/__setuser' && req.method === 'POST') {
    // switch the signed-in identity (security tests): {mail, denyBankList?}
    state.currentUser = parse();
    return json(res, 200, state.currentUser);
  }
  if (url === '/__seed' && req.method === 'POST') {
    const { list, fields } = parse();
    const id = String(state.nextId++);
    state.lists[list].push({ id, eTag: `etag-${id}-1`, fields });
    return json(res, 200, { id });
  }
  if (url.startsWith('/__tamper/')) {
    // bump an item's etag to simulate a concurrent edit (conflict test)
    const title = url.split('/__tamper/')[1];
    const item = state.lists['SSF-Submissions'].find((i) => i.fields.Title === title);
    if (item) item.eTag = item.eTag + '-tampered';
    return json(res, 200, { ok: !!item });
  }

  // ---- Graph surface ----
  if (url === '/me') {
    const u = state.currentUser || {};
    return json(res, 200, {
      displayName: u.displayName || 'Graph Tester',
      mail: u.mail || 'graph.tester@nhs.net',
      userPrincipalName: u.mail || 'graph.tester@nhs.net',
    });
  }
  // Simulate SharePoint's own permission boundary on the restricted list:
  // when the current test user is flagged denyBankList, ALL SSF-BankDetails
  // requests return 403 (as SharePoint would for a non-AP delegated token)
  if (url.includes('/lists/SSF-BankDetails') && state.currentUser?.denyBankList) {
    return json(res, 403, { error: 'accessDenied (simulated SharePoint permission)' });
  }
  if (/^\/sites\/[^/]+:/.test(url) && !url.includes('/lists/') && !url.includes('/drives')) {
    return json(res, 200, { id: SITE_ID });
  }
  if (url === `/sites/${SITE_ID}/drives`) {
    return json(res, 200, { value: Object.entries(state.drives).map(([id, d]) => ({ id, name: d.name })) });
  }

  // list items
  let m = url.match(new RegExp(`^/sites/${SITE_ID}/lists/([^/]+)/items(\\?.*)?$`));
  if (m) {
    const [, listName, query] = m;
    const list = state.lists[listName];
    if (!list) return json(res, 404, { error: `no list ${listName}` });
    if (req.method === 'GET') {
      let items = list;
      const filter = /\$filter=fields\/Title eq '([^']+)'/.exec(query || '');
      if (filter) items = list.filter((i) => i.fields.Title === filter[1]);
      return json(res, 200, { value: items.map((i) => ({ id: i.id, eTag: i.eTag, fields: i.fields })) });
    }
    if (req.method === 'POST') {
      const { fields } = parse();
      const id = String(state.nextId++);
      const item = { id, eTag: `etag-${id}-1`, fields };
      list.push(item);
      return json(res, 201, { id, eTag: item.eTag, fields });
    }
  }

  // PATCH item fields (with If-Match)
  m = url.match(new RegExp(`^/sites/${SITE_ID}/lists/([^/]+)/items/([^/]+)/fields$`));
  if (m && req.method === 'PATCH') {
    const [, listName, itemId] = m;
    const item = (state.lists[listName] || []).find((i) => i.id === itemId);
    if (!item) return json(res, 404, { error: 'item not found' });
    const ifMatch = req.headers['if-match'];
    if (ifMatch && ifMatch !== item.eTag) return json(res, 412, { error: 'etag mismatch' });
    Object.assign(item.fields, parse());
    item.eTag = item.eTag.replace(/-\d+$/, '') + `-${Date.now()}`;
    return json(res, 200, item.fields);
  }

  // drive upload: PUT /drives/{id}/root:/path:/content
  m = url.match(/^\/drives\/([^/]+)\/root:\/(.+):\/content$/);
  if (m && req.method === 'PUT') {
    const [, driveId, path] = m;
    const drive = state.drives[driveId];
    if (!drive) return json(res, 404, { error: 'no drive' });
    const itemId = `f${state.nextId++}`;
    drive.files[path] = { id: itemId, size: body.length, contentType: req.headers['content-type'] };
    return json(res, 201, { id: itemId, webUrl: `https://mock.sharepoint/${drive.name}/${path}` });
  }

  // drive item listItem fields (DocumentType tagging)
  m = url.match(/^\/drives\/([^/]+)\/items\/([^/]+)\/listItem\/fields$/);
  if (m && req.method === 'PATCH') {
    const [, driveId, itemId] = m;
    const drive = state.drives[driveId];
    const entry = Object.values(drive?.files || {}).find((f) => f.id === itemId);
    if (entry) entry.fields = parse();
    return json(res, 200, entry?.fields || {});
  }

  json(res, 404, { error: `unhandled ${req.method} ${url}` });
}).listen(3996, () => console.log('mock-graph on :3996'));
