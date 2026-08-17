// Local stand-in for the Task 8 Power Automate CRN proxy flow.
// Speaks the exact contract the real flow must honour:
//   GET <url>?...&crn=XXXXXXXX  ->  raw Companies House company-profile JSON
//   unknown crn                 ->  HTTP 404
//   responses carry Access-Control-Allow-Origin: * (required: browser reads
//   the response cross-origin as a CORS "simple request")
const http = require('http');

const COMPANIES = {
  '07101408': {
    company_name: 'TESTCORP COMPLIANCE LIMITED',
    company_number: '07101408',
    company_status: 'active',
    type: 'ltd',
    date_of_creation: '2009-12-08',
    jurisdiction: 'england-wales',
    registered_office_address: {
      address_line_1: '12 Compliance House',
      address_line_2: 'Whitechapel Road',
      locality: 'London',
      region: 'Greater London',
      postal_code: 'E1 1BB',
      country: 'England',
    },
    sic_codes: ['71200'],
    has_charges: false,
    has_insolvency_history: false,
  },
  '02222222': {
    company_name: 'DISSOLVED VENTURES LIMITED',
    company_number: '02222222',
    company_status: 'dissolved',
    type: 'ltd',
    date_of_creation: '2001-03-15',
    jurisdiction: 'england-wales',
    registered_office_address: {
      address_line_1: '1 Gone Street',
      locality: 'Leeds',
      postal_code: 'LS1 1AA',
      country: 'England',
    },
    sic_codes: ['70229'],
    has_charges: false,
    has_insolvency_history: true,
  },
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const crn = (url.searchParams.get('crn') || '').toUpperCase();
  const company = COMPANIES[crn];
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  console.log(`${new Date().toISOString()} GET crn=${crn} -> ${company ? 200 : 404}`);
  if (company) {
    res.writeHead(200, headers);
    res.end(JSON.stringify(company));
  } else {
    res.writeHead(404, headers);
    res.end(JSON.stringify({ errors: [{ error: 'company-profile-not-found' }] }));
  }
}).listen(3999, () => console.log('Mock CH flow listening on http://localhost:3999'));
