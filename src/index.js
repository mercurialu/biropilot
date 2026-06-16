// ============================================================
// BIROPILOT — Main Server Entry Point
// Asistentul birocratic universal pentru România
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

// Inițializare module
const dna = new DocumentDNA();
const pdfGen = new PDFGenerator(dna);
const signer = new DigitalSigner();
const submitter = new SubmissionHub();
const calcEngine = new CalculatorEngine();
const whatsapp = new WhatsAppBot({ dna, pdfGen, signer, submitter, calcEngine });
const waClient = new WhatsAppClient();
const stripePay = new StripePayments();

const PORT = process.env.PORT || 3000;

// ============================================================
// RUTE API
// ============================================================

const routes = {
  // === Sănătate ===
  'GET /health': (req, res) => {
    respondJSON(res, { status: 'ok', version: '1.0.0', uptime: process.uptime() });
  },

  // === Formulare ===
  'GET /api/forms': (req, res) => {
    respondJSON(res, { forms: pdfGen.listForms() });
  },

  'POST /api/forms/generate': (req, res, body) => {
    try {
      const { userId, formId } = body;
      if (!userId || !formId) {
        return respondJSON(res, { error: 'userId si formId sunt obligatorii' }, 400);
      }
      const result = pdfGen.generate(userId, formId);
      respondJSON(res, result);
    } catch (e) {
      respondJSON(res, { error: e.message }, 400);
    }
  },

  'GET /api/forms/search': (req, res, body, url) => {
    const q = new URL(url, 'http://localhost').searchParams.get('q') || '';
    respondJSON(res, { rezultate: pdfGen.searchForms(q) });
  },

  // === Profile / Document DNA ===
  'POST /api/profile/create': (req, res, body) => {
    try {
      const { userId, data } = body;
      if (!userId) return respondJSON(res, { error: 'userId obligatoriu' }, 400);
      const profile = dna.createProfile(userId, data || {});
      respondJSON(res, { success: true, profile });
    } catch (e) {
      respondJSON(res, { error: e.message }, 400);
    }
  },

  'POST /api/profile/update': (req, res, body) => {
    try {
      const { userId, data } = body;
      if (!userId || !data) return respondJSON(res, { error: 'userId si data obligatorii' }, 400);
      const profile = dna.updateProfile(userId, data);
      respondJSON(res, { success: true, profile });
    } catch (e) {
      respondJSON(res, { error: e.message }, 400);
    }
  },

  'GET /api/profile/status': (req, res, body, url) => {
    const userId = new URL(url, 'http://localhost').searchParams.get('userId');
    if (!userId) return respondJSON(res, { error: 'userId obligatoriu' }, 400);
    respondJSON(res, { status: dna.getCompletionStatus(userId) });
  },

  // === Calculator ===
  'GET /api/calculators': (req, res) => {
    respondJSON(res, { calculatoare: calcEngine.listAll() });
  },
  'GET /api/calculators/viral': (req, res) => {
    respondJSON(res, { virale: calcEngine.getViralCalculators() });
  },

  'POST /api/calculators/calculate': (req, res, body) => {
    try {
      const { calculator, params } = body;
      if (!calculator || !params) {
        return respondJSON(res, { error: 'calculator si params obligatorii' }, 400);
      }
      const result = calcEngine.calculate(calculator, params);
      respondJSON(res, result);
    } catch (e) {
      respondJSON(res, { error: e.message }, 400);
    }
  },

  // === Semnare ===
  'GET /api/signing/status': (req, res, body, url) => {
    const userId = new URL(url, 'http://localhost').searchParams.get('userId');
    if (!userId) return respondJSON(res, { error: 'userId obligatoriu' }, 400);
    respondJSON(res, { status: signer.getSigningStatus(userId) });
  },

  // === Instituții ===
  'GET /api/institutions': (req, res) => {
    respondJSON(res, { institutii: submitter.listInstitutions() });
  },

  'GET /api/institutions/instructions': (req, res, body, url) => {
    const u = new URL(url, 'http://localhost');
    const nume = u.searchParams.get('nume');
    if (!nume) return respondJSON(res, { error: 'nume institutie obligatoriu' }, 400);
    respondJSON(res, submitter.getInstructions(nume));
  },

  // === WhatsApp API webhook ===
  'POST /api/whatsapp': (req, res, body) => {
    const msg = waClient.parseWebhook(body);
    if (!msg.from || !msg.message) {
      return respondJSON(res, { error: 'Invalid message' }, 400);
    }
    const reply = whatsapp.reply(msg.from, msg.message);
    waClient.send(msg.from, reply);
    respondJSON(res, { success: true, reply });
  },

  // === Stripe Payments ===
  'POST /api/payments/create-checkout': (req, res, body) => {
    try {
      const { priceId, userId, successUrl, cancelUrl } = body;
      if (!priceId || !userId) return respondJSON(res, { error: 'priceId si userId obligatorii' }, 400);
      stripePay.createCheckoutSession(priceId, userId, successUrl, cancelUrl)
        .then(session => respondJSON(res, session))
        .catch(e => respondJSON(res, { error: e.message }, 500));
    } catch (e) {
      respondJSON(res, { error: e.message }, 400);
    }
  },

  'GET /api/payments/pricing': (req, res) => {
    respondJSON(res, { pricing: stripePay.getPricing() });
  }
};

// ============================================================
// FUNCȚII AJUTĂTOARE
// ============================================================

function respondJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

// ============================================================
// STRIPE PAYMENTS
// ============================================================

async function createCheckoutSession(priceId, userId) {
  try {
    const session = await stripePay.createCheckoutSession(priceId, userId);
    return session;
  } catch (e) {
    return { error: e.message };
  }
}

function serveStatic(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType || 'application/octet-stream' });
    res.end(content);
  } catch (e) {
    respondJSON(res, { error: 'Fisierul nu exista' }, 404);
  }
}

// ============================================================
// START SERVER
// ============================================================

const server = http.createServer(router);
server.listen(PORT, () => {
  console.log(`🦅 BiroPilot v1.0.0 rulează pe http://localhost:${PORT}`);
  console.log('📋 Endpoint-uri disponibile:');
  console.log('   GET  /health');
  console.log('   GET  /api/forms');
  console.log('   POST /api/forms/generate');
  console.log('   GET  /api/calculators');
  console.log('   GET  /api/calculators/viral');
  console.log('   POST /api/calculators/calculate');
  console.log('   POST /api/profile/create');
  console.log('   POST /api/profile/update');
  console.log('   GET  /api/profile/status');
  console.log('   GET  /api/institutions');
  console.log('   GET  /api/institutions/instructions');
  console.log('   GET  /api/signing/status');
  console.log('   POST /api/whatsapp');
  console.log('   POST /api/payments/create-checkout');
  console.log('   GET  /api/payments/pricing');
});


