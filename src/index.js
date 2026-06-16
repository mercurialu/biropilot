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
  'GET /api/calculators': (req, res) => respondJSON(res, { calculatoare: calcEngine.listAll() }),
  'GET /api/institutions': (req, res) => respondJSON(res, { institutii: submitter.listInstitutions() }),
  'GET /api/forms': (req, res) => respondJSON(res, { forms: pdfGen.listForms() }),
  'GET /api/payments/pricing': (req, res) => respondJSON(res, { pricing: stripePay.getPricing() }),
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

function respondJSON(res, data, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(JSON.stringify(data));
}

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
      if (ct.includes('json')) try { parsed = JSON.parse(raw); } catch(e) { return respondJSON(res, { error: 'Invalid JSON' }, 400); }
      else if (ct.includes('form-urlencoded')) raw.split('&').forEach(p => { const kv = p.split('='); parsed[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
      handler(req, res, parsed);
    });
  } else handler(req, res, {});
});

server.listen(PORT, () => console.log('BiroPilot on port ' + PORT));