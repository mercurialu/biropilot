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

function respondJSON(res, data, code) {
  if (!code) code = 200;
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(JSON.stringify(data));
}

function genFormHTML(form) {
  const rows = Object.values(form.fields || {}).map(f => {
    const val = f.filled ? (f.value || '') : '<span style=color:red>LIPSE_STE</span>';
    return '<tr><td style=padding:8px;border-bottom:1px solid #ddd>' + f.label + '</td><td style=padding:8px;border-bottom:1px solid #ddd>' + val + '</td></tr>';
  }).join('\n');
  const acte = (form.acteNecesare || []).map(a => '<li>' + a + '</li>').join('\n');
  return '<html><head><meta charset=UTF-8><title>' + (form.nume || 'Document') + '</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px}h1{color:#1a56db}.header{border-bottom:3px solid #1a56db;padding-bottom:15px}table{width:100%;border-collapse:collapse}th{background:#1a56db;color:#fff;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #ddd}.btn{display:inline-block;padding:12px 30px;background:#1a56db;color:#fff;text-decoration:none;border-radius:8px;margin:20px 0;cursor:pointer}@media print{.noprint{display:none!important}}</style></head><body><div class=header><h1>' + (form.nume || '') + '</h1><p>' + (form.institutie || '') + '</p></div><table><tr><th>Camp</th><th>Valoare</th></tr>' + rows + '</table>' + (acte ? '<h3>Acte necesare</h3><ul>' + acte + '</ul>' : '') + '<div class=noprint style=text-align:center;margin-top:30px><button class=btn onclick=window.print()>Tipareste</button></div></body></html>';
}

const routes = {
  'GET /health': (req, res) => respondJSON(res, { status: 'ok', version: '1.0.0', uptime: process.uptime() }),
  'GET /api/calculators': (req, res) => respondJSON(res, { calculatoare: calcEngine.listAll() }),
  'GET /api/institutions': (req, res) => respondJSON(res, { institutii: submitter.listInstitutions() }),
  'GET /api/forms': (req, res) => respondJSON(res, { forms: pdfGen.listForms() }),
  'GET /api/payments/pricing': (req, res) => respondJSON(res, { pricing: stripePay.getPricing() }),
  'GET /document': (req, res, body, url) => {
    const u = new URL(url, 'http://localhost');
    const userId = u.searchParams.get('userId');
    const formId = u.searchParams.get('formId');
    if (!userId || !formId) return respondJSON(res, { error: 'Parametri lipsa' }, 400);
    const form = pdfGen.forms[formId];
    if (!form) return respondJSON(res, { error: 'Formular inexistent' }, 400);
    let result;
    try { result = pdfGen.generate(userId, formId); }
    catch (e) {
      result = { formId: formId, nume: form.nume, institutie: form.institutie, bazaLegala: form.bazaLegala, termen: form.termen, perioada: form.perioada, acteNecesare: form.acteNecesare || [], fields: {}, calculated: null, missingFields: [], complet: false, generatLa: new Date().toISOString() };
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(genFormHTML(result));
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
  }
};

const server = http.createServer((req, res) => {
  const key = req.method + ' ' + req.url.split('?')[0];
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const handler = routes[key];
  if (!handler) return respondJSON(res, { error: 'Not found' }, 404);
  if (req.method === 'POST') {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      let parsed = {};
      const ct = req.headers['content-type'] || '';
      if (ct.includes('json')) { try { parsed = JSON.parse(raw); } catch(e) { return respondJSON(res, { error: 'Invalid JSON' }, 400); } }
      else if (ct.includes('form')) { raw.split('&').forEach(p => { const kv = p.split('='); parsed[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); }); }
      handler(req, res, parsed);
    });
  } else handler(req, res, {}, req.url);
});

server.listen(PORT, () => console.log('BiroPilot on port ' + PORT));