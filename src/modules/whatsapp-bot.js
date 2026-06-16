// ============================================================
// BIROPILOT — WhatsApp Bot Interface (complet)
// ============================================================

const INTENTS = {
  SALUT: ["salut","buna","hey","hi","hello","buna ziua"],
  PROCEDURA: ["vreau","cum fac","am nevoie","ma ajuti","procedura","acte"],
  CALCULATOR: ["calculeaza","cat","taxe","impozit","salariu","rate","amend"],
  STAT: ["status","unde e","dosar","cerere"],
  AJUTOR: ["ajutor","help","ce poti","comenzi"],
  PROFIL: ["profil","datele mele","setari","contul"]
};

class WhatsAppBot {
  constructor(deps = {}) {
    Object.assign(this, deps);
    this.sessions = new Map();
  }

  detectIntent(m) {
    const msg = m.toLowerCase();
    for (const [k, v] of Object.entries(INTENTS))
      if (v.some(x => msg.includes(x))) return k;
    return "NECUNOSCUT";
  }

  reply(userId, msg) {
    const intent = this.detectIntent(msg);
    const m = msg.toLowerCase();
    if (intent === "SALUT") return "Salut! Eu sunt BiroPilot, asistentul tau birocratic. Scrie-mi ce ai nevoie! 📋";
    if (intent === "AJUTOR") return "Pot sa:\n📋 Completez formulare\n💰 Calculez taxe/salarii\n📄 Generez documente\n🏛 Dau instructiuni pas cu pas\n\nExemple:\n\"vreau PFA\" / \"ce acte buletin?\" / \"cat platesc la ANAF?\"";
    if (m.includes("pfa") || m.includes("deschid"))
      return "Pentru PFA ai nevoie de:\n1. Cerere ONRC (o generez eu)\n2. Copie CI\n3. Cazier fiscal\n4. 45 RON taxa\n\nVrei sa completam cererea? Spune-mi da!";
    if (m.includes("buletin") || m.includes("ci "))
      return "Schimbare buletin:\n📅 Fa programare pe drpciv.ro\n💰 6 RON\n📄 Buletin vechi + certificat nastere\n⏱ 2-5 zile\n\nVrei cererea precompletata?";
    if (m.includes("anaf") || m.includes("declarat") || m.includes("taxe"))
      return "Completez Declaratia Unica (Formular 200) pentru ANAF. Dami venitul tau si o generez in 2 minute. Pot si depune in SPV daca ai cont configurat.";
    if (m.includes("salariu"))
      return "Care e salariul tau brut? (ex: 5000)";
    if (m.includes("credit") || m.includes("ipotecar") || m.includes("rata"))
      return "Ce suma vrei sa imprumuti si pe cati ani? (ex: 200000 euro, 30 ani)";
    return "Nu am inteles exact. Pot sa te ajut cu:\n• Deschidere PFA\n• Declaratii ANAF\n• Schimbare buletin\n• Calcul taxe/salarii\n\nScrie ce ai nevoie! ";
  }
}

module.exports = { WhatsAppBot, INTENTS };
