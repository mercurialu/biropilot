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
  'GET /document': (req, res, body, url) => {
    const u = new URL(url, 'http://localhost');
    const userId = u.searchParams.get('userId');
    const formId = u.searchParams.get('formId');
    if (!userId || !formId) return respondJSON(res, { error: 'userId si formId obligatorii' }, 400);
    try {
      const result = pdfGen.generate(userId, formId);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(genFormHTML(result, !result.complet));
    } catch (e) {
      respondJSON(res, { error: e.message }, 400);
    }
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

function genFormHTML(form, missing = false) {
  const rows = Object.values(form.fields || {}).map(f => 
    `<tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#475569">${f.label}</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:${f.filled?'600':'400'};color:${f.filled?'#1a56db':'#ef4444'}">${f.filled ? (f.value || '') : '<span style="color:#ef4444">LIPSEÈ˜TE</span>'}</td></tr>`
  ).join('');
  
  const acte = (form.acteNecesare || []).map(a => `<li>${a}</li>`).join('');
  
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${form.nume || 'Document'}</title><style>
    body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px}
    h1{color:#1a56db;font-size:1.8em}
    .header{border-bottom:3px solid #1a56db;padding-bottom:15px;margin-bottom:20px}
    .info{background:#f0f7ff;padding:15px;border-radius:8px;margin:15px 0}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th{text-align:left;padding:8px;background:#1a56db;color:#fff}
    .total{font-size:1.3em;font-weight:700;color:#1a56db;text-align:center;padding:15px;background:#f0f7ff;border-radius:8px;margin:15px 0}
    .missing{background:#fef2f2;border:1px solid #ef4444;padding:15px;border-radius:8px;margin:15px 0}
    .btn{display:inline-block;padding:12px 30px;background:#1a56db;color:#fff;text-decoration:none;border-radius:8px;margin:20px 0}
    .btn:hover{background:#0f3a8e}
    @media print{body{margin:20px}.btn,.noprint{display:none!important}}
  </style></head><body>
    <div class=header><h1>${form.nume || 'Formular'}</h1><p style=color:#64748b>${form.institutie || ''} | ${form.bazaLegala || ''}</p></div>
    ${missing ? `<div class=missing><strong>âš  CompleteazÄƒ-È›i Document DNA</strong><p>Unele cÃ¢mpuri nu au date. CompleteazÄƒ profilul pentru un formular complet.</p></div>` : ''}
    <div class=info><strong>InstituÈ›ie:</strong> ${form.institutie || 'â€”'}<br><strong>Termen:</strong> ${form.termen || 'â€”'}<br><strong>PerioadÄƒ:</strong> ${form.perioada || 'â€”'}</div>
    ${form.calculated ? `<div class=total>Total calculat: ${Object.values(form.calculated).filter(v => typeof v === 'string').join(' + ')}</div>` : ''}
    <table><tr><th>CÃ¢mp</th><th>Valoare</th></tr>${rows}</table>
    ${acte ? `<h3>ðŸ“‹ Acte necesare</h3><ul>${acte}</ul>` : ''}
    <div class=noprint style="text-align:center;margin-top:30px;padding:20px;background:#f8fafc;border-radius:8px">
      <button class=btn onclick="window.print()">ðŸ–¨ TipÄƒreÈ™te</button>
      <p style=color:#64748b;margin-top:10px>GenereazÄƒ cu ${form.generatLa ? new Date(form.generatLa).toLocaleDateString('ro-RO') : ''}</p>
    </div>
  </body></html>`;
}
server.listen(PORT, () => console.log('BiroPilot on port ' + PORT));
