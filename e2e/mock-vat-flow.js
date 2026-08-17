// Mock of the Task 10 Power Automate VAT flow. Speaks the exact contract the
// real flow proxies from HMRC (shapes captured from the live sandbox, July 2026):
//   GET ?vrn=553557881 -> 200 { target: {...} }
//   GET ?vrn=<other>   -> 404 { code: 'NOT_FOUND', ... }
// CORS: responds with Access-Control-Allow-Origin: * (same as the flow's Response action).
const http = require('http');

const KNOWN = {
  '553557881': {
    target: {
      name: 'Credite Sberger Donal Inc.',
      vatNumber: '553557881',
      address: { line1: '131B Barton Hamlet', postcode: 'SW97 5CK', countryCode: 'GB' },
    },
    processingDate: new Date().toISOString(),
  },
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3998');
  const vrn = url.searchParams.get('vrn') || '';
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const hit = KNOWN[vrn];
  console.log(new Date().toISOString(), 'GET vrn=' + vrn, '->', hit ? 200 : 404);
  if (hit) {
    res.writeHead(200, headers);
    res.end(JSON.stringify(hit));
  } else {
    res.writeHead(404, headers);
    res.end(JSON.stringify({ code: 'NOT_FOUND', message: 'targetVrn does not match a registered company' }));
  }
}).listen(3998, () => console.log('Mock VAT flow listening on http://localhost:3998'));
