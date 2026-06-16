const http = require('http');
const path = require('path');
const fs = require('fs');
const { DocumentDNA } = require('./modules/document-dna.js');
const { PDFGenerator } = require('./modules/pdf-generator.js');
const { DigitalSigner } = require('./modules/digital-signer.js');
const { SubmissionHub } = require('./modules/submission-hub.js');
const { CalculatorEngine } = require('./modules/calculator-engine.js');
const { WhatsAppBot } = require('./modules/whatsapp-bot.js');
const { WhatsAppClient } = require('./modules/whatsapp-client.js');
const { StripePayments } = require('./modules/stripe-payments.js');

const dna = new DocumentDNA();
const pdfGen = new PDFGenerator(dna);
const signer = new DigitalSigner();
const submitter = new SubmissionHub();
const calcEngine = new CalculatorEngine();
const whatsapp = new WhatsAppBot({ dna, pdfGen, signer, submitter, calcEngine });
const waClient = new WhatsAppClient();
const stripePay = new StripePayments();

const PORT = process.env.PORT || 3000;

const routes = {
  'GET /health': (req, res) => respondJSON(res, { status: 'ok', version: '1.0.0', uptime: process.uptime() }),
  'GET /api/forms': (req, res) => respondJSON(res, { forms: pdfGen.listForms() }),
  'POST /api/forms/generate': (req, res, body) => {
    try { respondJSON(res, pdfGen.generate(body.userId, body.formId)); }
    catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'GET /api/forms/search': (req, res, b, url) => {
    const q = new URL(url, 'http://localhost').searchParams.get('q') || '';
    respondJSON(res, { rezultate: pdfGen.searchForms(q) });
  },
  'POST /api/profile/create': (req, res, body) => {
    try { respondJSON(res, { success: true, profile: dna.createProfile(body.userId, body.data || {}) }); }
    catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'POST /api/profile/update': (req, res, body) => {
    try { respondJSON(res, { success: true, profile: dna.updateProfile(body.userId, body.data) }); }
    catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'GET /api/profile/status': (req, res, b, url) => {
    const userId = new URL(url, 'http://localhost').searchParams.get('userId');
    userId ? respondJSON(res, { status: dna.getCompletionStatus(userId) }) : respondJSON(res, { error: 'userId obligatoriu' }, 400);
  },
  'GET /api/calculators': (req, res) => respondJSON(res, { calculatoare: calcEngine.listAll() }),
  'GET /api/calculators/viral': (req, res) => respondJSON(res, { virale: calcEngine.getViralCalculators() }),
  'POST /api/calculators/calculate': (req, res, body) => {
    try { respondJSON(res, calcEngine.calculate(body.calculator, body.params)); }
    catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'GET /api/signing/status': (req, res, b, url) => {
    const userId = new URL(url, 'http://localhost').searchParams.get('userId');
    userId ? respondJSON(res, { status: signer.getSigningStatus(userId) }) : respondJSON(res, { error: 'userId obligatoriu' }, 400);
  },
  'GET /api/institutions': (req, res) => respondJSON(res, { institutii: submitter.listInstitutions() }),
  'GET /api/institutions/instructions': (req, res, b, url) => {
    const nume = new URL(url, 'http://localhost').searchParams.get('nume');
    nume ? respondJSON(res, submitter.getInstructions(nume)) : respondJSON(res, { error: 'nume obligatoriu' }, 400);
  },
  'POST /api/whatsapp': (req, res, body) => {
    const msg = waClient.parseWebhook(body);
    if (!msg.from || !msg.message) {
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    const reply = whatsapp.reply(msg.from, msg.message);
    const safe = reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safe + '</Message></Response>');
  },
  'POST /api/payments/create-checkout': (req, res, body) => {
    if (!body.priceId || !body.userId) return respondJSON(res, { error: 'priceId si userId obligatorii' }, 400);
    stripePay.createCheckoutSession(body.priceId, body.userId)
      .then(s => respondJSON(res, s))
      .catch(e => respondJSON(res, { error: e.message }, 500));
  },
  'GET /api/payments/pricing': (req, res) => respondJSON(res, { pricing: stripePay.getPricing() })
};

function respondJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const routeKey = req.method + ' ' + req.url.split('?')[0];
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const handler = routes[routeKey];
  if (!handler) {
    if (req.url === '/' || req.url === '/site') {
      try { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'))); }
      catch (e) { return respondJSON(res, { error: 'Not found' }, 404); }
    }
    return respondJSON(res, { error: 'Ruta nu exista' }, 404);
  }
  if (req.method === 'POST') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      const ct = req.headers['content-type'] || '';
      let parsed = {};
      if (ct.includes('json')) { try { parsed = JSON.parse(raw); } catch (e) { return respondJSON(res, { error: 'Invalid JSON' }, 400); } }
      else if (ct.includes('form')) {
        raw.split('&').forEach(p => { const kv = p.split('='); if (kv[0]) parsed[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
      } else { try { parsed = JSON.parse(raw); } catch (e) { parsed = { raw: raw }; } }
      handler(req, res, parsed, req.url);
    });
  } else handler(req, res, null, req.url);
});

server.listen(PORT, () => console.log('BiroPilot v1.0.0 on port ' + PORT));