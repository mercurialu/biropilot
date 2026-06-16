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

// Inițializare module
const dna = new DocumentDNA();
const pdfGen = new PDFGenerator(dna);
const signer = new DigitalSigner();
const submitter = new SubmissionHub();
const calcEngine = new CalculatorEngine();
const whatsapp = new WhatsAppBot({ dna, pdfGen, signer, submitter, calcEngine });

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
    const { message, from } = body;
    if (!message) return respondJSON(res, { error: 'message obligatoriu' }, 400);
    // TODO: Implement WhatsApp bot logic
    respondJSON(res, {
      reply: getBotReply(message, from),
      from
    });
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

function getBotReply(message, from) {
  const msg = message.toLowerCase().trim();

  if (msg.includes('salut') || msg.includes('buna') || msg.includes('hey')) {
    return 'Salut! Eu sunt BiroPilot, asistentul tau birocratic. Pot sa te ajut cu acte, formulare, taxe si proceduri. Scrie-mi ce ai nevoie!';
  }
  if (msg.includes('ajutor') || msg.includes('ce poti')) {
    return 'Pot sa:\n📋 Completez formulare oficiale (ANAF, ONRC, Primarie)\n💰 Calculez taxe, salarii, rate\n📄 Pregatesc documente pentru orice procedura\n🏛 Iti dau instructiuni pas cu pas\n\nExemple: "vreau sa deschid un PFA" / "calculeaza-mi taxele" / "ce acte imi trebuie pentru buletin"';
  }
  if (msg.includes('pfa') || msg.includes('deschid')) {
    return 'Pentru deschiderea unui PFA ai nevoie de:\n1. Cerere inmatriculare ONRC (o completez eu)\n2. Copie CI\n3. Cazier fiscal\n4. Dovada sediu\n5. 45 RON taxa ONRC\n\nVrei sa completez cererea acum? Dami datele tale si o generez in 2 minute.';
  }
  if (msg.includes('buletin') || msg.includes('ci ') || msg.includes('carte de identitate')) {
    return 'Pentru schimbarea buletinului:\n📅 Fa programare pe drpciv.ro\n💰 Taxa: 6 RON\n📄 Acte: buletin vechi, certificat nastere, dovada taxa\n⏱ Durata: 2-5 zile\n\nVrei sa generez cererea precompletata?';
  }
  if (msg.includes('anaf') || msg.includes('taxe') || msg.includes('declaratie')) {
    return 'Completez declaratia unica (Formular 200) pentru ANAF. Am nevoie de venitul tau estimat si realizat. Pot sa o depun direct in SPV daca ai cont configurat.';
  }
  return 'Scrie-mi ce ai nevoie si te ajut cu:\n• Proceduri birocratice\n• Formulare complete\n• Calcul taxe si salarii\n• Instructiuni pas cu pas\n\nExemple: "vreau PFA", "ce acte pentru buletin?", "calculeaza-mi salariul net"';
}

// ============================================================
// ROUTER
// ============================================================

function router(req, res) {
  const { method, url } = req;
  const routeKey = `${method} ${url.split('?')[0]}`;

  // CORS preflight
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
    // Fișiere statice
    if (url === '/' || url === '/index.html') {
      serveStatic(res, 'public/index.html', 'text/html');
      return;
    }
    if (url.startsWith('/public/')) {
      const filePath = path.join(__dirname, '..', url);
      serveStatic(res, filePath);
      return;
    }
    return respondJSON(res, { error: 'Ruta nu exista' }, 404);
  }

  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        handler(req, res, JSON.parse(body), url);
      } catch (e) {
        respondJSON(res, { error: 'Body invalid JSON' }, 400);
      }
    });
  } else {
    handler(req, res, null, url);
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
});


