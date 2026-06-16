// ============================================================
// BIROPILOT - Main Server Entry Point
// ============================================================

const http = require('http');
const path = require('path');
const fs = require('fs');

// Module imports
const { DocumentDNA } = require('./modules/document-dna.js');
const { PDFGenerator } = require('./modules/pdf-generator.js');
const { DigitalSigner } = require('./modules/digital-signer.js');
const { SubmissionHub } = require('./modules/submission-hub.js');
const { CalculatorEngine } = require('./modules/calculator-engine.js');
const { WhatsAppBot } = require('./modules/whatsapp-bot.js');
const { WhatsAppClient } = require('./modules/whatsapp-client.js');
const { StripePayments } = require('./modules/stripe-payments.js');

// Initializare module
const dna = new DocumentDNA();
const pdfGen = new PDFGenerator(dna);
const signer = new DigitalSigner();
const submitter = new SubmissionHub();
const calcEngine = new CalculatorEngine();
const whatsapp = new WhatsAppBot({ dna, pdfGen, signer, submitter, calcEngine });
const waClient = new WhatsAppClient();
const stripePay = new StripePayments();

const PORT = process.env.PORT || 3000;

// RUTE API
const routes = {
  // Sanatate
  'GET /health': (req, res) => {
    respondJSON(res, { status: 'ok', version: '1.0.0', uptime: process.uptime() });
  },
  // Formulare
  'GET /api/forms': (req, res) => {
    respondJSON(res, { forms: pdfGen.listForms() });
  },
  'POST /api/forms/generate': (req, res, body) => {
    try {
      const { userId, formId } = body;
      if (!userId || !formId) return respondJSON(res, { error: 'userId si formId obligatorii' }, 400);
      respondJSON(res, pdfGen.generate(userId, formId));
    } catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'GET /api/forms/search': (req, res, body, url) => {
    const q = new URL(url, 'http://localhost').searchParams.get('q') || '';
    respondJSON(res, { rezultate: pdfGen.searchForms(q) });
  },
  // Profile
  'POST /api/profile/create': (req, res, body) => {
    try {
      const { userId, data } = body;
      if (!userId) return respondJSON(res, { error: 'userId obligatoriu' }, 400);
      respondJSON(res, { success: true, profile: dna.createProfile(userId, data || {}) });
    } catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'POST /api/profile/update': (req, res, body) => {
    try {
      const { userId, data } = body;
      if (!userId || !data) return respondJSON(res, { error: 'userId si data obligatorii' }, 400);
      respondJSON(res, { success: true, profile: dna.updateProfile(userId, data) });
    } catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  'GET /api/profile/status': (req, res, body, url) => {
    const userId = new URL(url, 'http://localhost').searchParams.get('userId');
    if (!userId) return respondJSON(res, { error: 'userId obligatoriu' }, 400);
    respondJSON(res, { status: dna.getCompletionStatus(userId) });
  },
  // Calculatoare
  'GET /api/calculators': (req, res) => {
    respondJSON(res, { calculatoare: calcEngine.listAll() });
  },
  'GET /api/calculators/viral': (req, res) => {
    respondJSON(res, { virale: calcEngine.getViralCalculators() });
  },
  'POST /api/calculators/calculate': (req, res, body) => {
    try {
      const { calculator, params } = body;
      if (!calculator || !params) return respondJSON(res, { error: 'calculator si params obligatorii' }, 400);
      respondJSON(res, calcEngine.calculate(calculator, params));
    } catch (e) { respondJSON(res, { error: e.message }, 400); }
  },
  // Semnare
  'GET /api/signing/status': (req, res, body, url) => {
    const userId = new URL(url, 'http://localhost').searchParams.get('userId');
    if (!userId) return respondJSON(res, { error: 'userId obligatoriu' }, 400);
    respondJSON(res, { status: signer.getSigningStatus(userId) });
  },
  // Institutii
  'GET /api/institutions': (req, res) => {
    respondJSON(res, { institutii: submitter.listInstitutions() });
  },
  'GET /api/institutions/instructions': (req, res, body, url) => {
    const u = new URL(url, 'http://localhost');
    const nume = u.searchParams.get('nume');
    if (!nume) return respondJSON(res, { error: 'nume institutie obligatoriu' }, 400);
    respondJSON(res, submitter.getInstructions(nume));
  },
  // WhatsApp
  'POST /api/whatsapp': (req, res, body) => {
    const msg = waClient.parseWebhook(body);
    if (!msg.from || !msg.message) {
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    const reply = whatsapp.reply(msg.from, msg.message);
    waClient.send(msg.from, reply).catch(() => {});
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    const safeReply = reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.end('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safeReply + '</Message></Response>');
  },
  },
  // Stripe
  'POST /api/payments/create-checkout': (req, res, body) => {
    const { priceId, userId, successUrl, cancelUrl } = body || {};
    if (!priceId || !userId) return respondJSON(res, { error: 'priceId si userId obligatorii' }, 400);
    stripePay.createCheckoutSession(priceId, userId, successUrl, cancelUrl)
      .then(session => respondJSON(res, session))
      .catch(e => respondJSON(res, { error: e.message }, 500));
  },
  'GET /api/payments/pricing': (req, res) => {
    respondJSON(res, { pricing: stripePay.getPricing() });
  }
};

// FUNCTII AJUTATOARE
function respondJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

// ROUTER
function router(req, res) {
  const { method, url } = req;
  const routeKey = method + ' ' + url.split('?')[0];
  
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }
  
  const handler = routes[routeKey];
  if (!handler) {
    if (url === '/' || url === '/index.html') {
      try {
        const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(content);
      } catch (e) {
        return respondJSON(res, { error: 'Pagina nu exista' }, 404);
      }
    }
    return respondJSON(res, { error: 'Ruta nu exista' }, 404);
  }
  
  if (method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => rawBody += chunk);
    req.on('end', () => {
      let parsedBody;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try { parsedBody = JSON.parse(rawBody); } catch (e) { return respondJSON(res, { error: 'Body invalid JSON' }, 400); }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        parsedBody = {};
        const pairs = rawBody.split('&');
        for (const pair of pairs) {
          const [key, val] = pair.split('=').map(decodeURIComponent);
          parsedBody[key] = val;
        }
      } else {
        try { parsedBody = JSON.parse(rawBody); } catch (e) { parsedBody = { raw: rawBody }; }
      }
      handler(req, res, parsedBody, url);
    });
  } else {
    handler(req, res, null, url);
  }
}

// START SERVER
const server = http.createServer(router);
server.listen(PORT, () => {
  console.log('BiroPilot v1.0.0 ruleaza pe port ' + PORT);
  console.log('Endpoint-uri: /health, /api/forms, /api/calculators, /api/institutions, /api/whatsapp, /api/payments/pricing');
});
