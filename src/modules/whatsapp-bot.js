// WhatsApp Bot - Improved Version

class WhatsAppBot {
  constructor(deps = {}) {
    Object.assign(this, deps);
    this.sessions = new Map();
    this.contexts = new Map();
  }

  reply(userId, msg) {
    const m = msg.toLowerCase().trim();
    
    // Initialize session if needed
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, { step: null, data: {} });
    }
    const session = this.sessions.get(userId);

    // Handle multi-step conversations
    if (session.step) {
      return this.handleStep(session, m, userId);
    }

    // Detect intent
    const intent = this.detectIntent(m);
    
    // Check for greetings
    if (this.matchAny(m, ["salut","buna","hey","hi","hello","neata","buna ziua","buna dimineata","buna seara"])) {
      return "Salut! Eu sunt BiroPilot, asistentul tau birocratic. Scrie-mi ce ai nevoie: \n\n📋 *Formulare* - declaratii, cereri\n💰 *Calcule* - taxe, salarii, rate\n🏛 *Institutii* - instructiuni\n\nEx: \"vreau PFA\", \"ce acte buletin?\", \"cat platesc la ANAF?\"";
    }

    // Help command
    if (this.matchAny(m, ["ajutor","help","ce poti","ce poti face","comenzi","menu","meniu","instructiuni"])) {
      return "*Comenzi disponibile:* \n\n📋 *Formulare*\n\"vreau PFA\" - deschidere PFA\n\"declaratie unica\" - formular 200 ANAF\n\"schimbare buletin\" - acte necesare\n\"certificat urbanism\" - pentru constructii\n\n💰 *Calculatoare*\n\"taxe anaf\" - calculeaza taxele\n\"salariu net\" - brut in net\n\"credit ipotecar\" - rata lunara\n\"diurna\" - diurna deplasare\n\"amenda\" - valoare amenda\n\"indemnizatie copil\" - alocatie\n\n🏛 *Institutii*\n\"programare drpciv\"\n\"acte primarie\"\n\"ghiseul.ro\"";
    }

    // PFA
    if (this.matchAny(m, ["pfa","deschid pfa","infiintare pfa","pfa acte"])) {
      session.step = "pfa_form";
      session.data = {};
      return "Pentru deschidere PFA ai nevoie de: \n\n1. Cerere inmatriculare ONRC (o generez eu)\n2. Copie CI\n3. Cazier fiscal\n4. Dovada sediu (contract chirie / act proprietate)\n5. 45 RON taxa ONRC\n6. Declaratie pe propria raspundere\n\nVrei sa generez cererea? \nDami numele, prenumele, CNP-ul si codul CAEN principal.";
    }

    // Buletin
    if (this.matchAny(m, ["buletin","carte de identitate","ci ","schimb buletin","buletin acte"])) {
      return "*Schimbare Buletin* \n\n📅 *Programare:* drpciv.ro (obligatorie)\n💰 *Taxa:* 6 RON\n📄 *Acte necesare:*\n  - Buletinul vechi\n  - Certificat de nastere (original + copie)\n  - Dovada platii taxei\n⏱ *Durata:* 2-5 zile lucratoare\n\n*Pont:* Programeaza-te dimineata, gasesti locuri mai usor.";
    }

    // ANAF / Declaratie
    if (this.matchAny(m, ["anaf","declaratie","declaratie unica","formular 200","taxe anaf","cat platesc la anaf","datorii anaf"])) {
      session.step = "anaf_taxe";
      session.data = {};
      return "Pentru calculul taxelor ANAF am nevoie de: \n\n💰 Ce venit ai estimat pentru anul acesta? \n(Ex: 50000 - pentru 50.000 RON/an)";
    }

    // Salariu
    if (this.matchAny(m, ["salariu","salariu net","brut","net","salariu brut"])) {
      session.step = "salariu_calc";
      session.data = {};
      return "Care este salariul tau brut? \n(Ex: 5000 pentru 5.000 RON/luna)";
    }

    // Credit ipotecar
    if (this.matchAny(m, ["credit","ipotecar","rata","credit ipotecar","rata lunara"])) {
      session.step = "credit_calc";
      session.data = {};
      return "Ce suma vrei sa imprumuti si pe cati ani? \n(Ex: 250000 30 ani)";
    }

    // Amenda
    if (this.matchAny(m, ["amenda","amenda circulatie","puncte amenda","penalizare"])) {
      const pa = 202.5;
      return "*Amenda Circulatie 2026* \n\nValoarea unui punct de amenda: *" + pa + " RON*\n\n*Clase de sanctiune:*\n• *I* (2-3 pct) = " + Math.round(pa*2) + " - " + Math.round(pa*3) + " RON\n• *II* (4-5 pct) = " + Math.round(pa*4) + " - " + Math.round(pa*5) + " RON\n• *III* (6-8 pct) = " + Math.round(pa*6) + " - " + Math.round(pa*8) + " RON\n• *IV* (9-20 pct) = " + Math.round(pa*9) + " - " + Math.round(pa*20) + " RON\n• *V* (21-100 pct) = " + Math.round(pa*21) + " - " + Math.round(pa*100) + " RON\n\n*Reducere 50%* daca platesti in 15 zile!";
    }

    // Diurna
    if (this.matchAny(m, ["diurna","deplasare","dieta","diurna deplasare"])) {
      return "*Diurna 2026* \n\n*Romania:*\n  - Baza: 57 RON/zi\n  - Conducere: 71 RON/zi\n\n*UE:*\n  - Baza: 87 RON/zi\n  - Conducere: 105 RON/zi\n\n*Non-UE:*\n  - Baza: 97 RON/zi\n  - Conducere: 120 RON/zi\n\n*Sector public:* valori reduse cu ~30%";
    }

    // Indemnizatie copil
    if (this.matchAny(m, ["indemnizatie","copil","copii","alocatie","concediu crestere copil","matern"])) {
      return "*Indemnizatie Creștere Copil 2026* \n\n• *85%* din venitul net pe 24 luni\n• *50%* din venitul net pe 36 luni\n• *Plafon maxim:* 12.700 RON/luna\n• *Stimulent reintrare:* 60% din salariul minim (~2.430 RON)\n\nPentru calcul exact, foloseste calculatorul de pe site: https://mercurialu.github.io/biropilot/";
    }

    // Institutii
    if (this.matchAny(m, ["primarie","acte primarie","certificat urbanism","autorizatie constructie"])) {
      return "*Certificat de Urbanism* \n\n📄 *Acte necesare:*\n1. Cerere (o completez eu)\n2. Copie CI\n3. Act de proprietate\n4. Plan de incadrare in zona\n5. Certificat fiscal\n\n📍 *Unde:* Primaria localitatii\n💰 *Taxa:* 30-80 RON\n⏱ *Timp:* 30 zile\n\n*Pont:* Fa programare online pe site-ul primariei!";
    }

    if (this.matchAny(m, ["onrc","acte onrc"])) {
      return "*ONRC - Oficiul National al Registrului Comertului* \n\nServicii disponibile:\n• Inmatriculare PFA/SRL\n• Modificari acte constitutive\n• Radiere\n• Certificate constatatoare\n\n📧 Depunere electronica: registratura@onrc.ro\n💰 Taxa PFA: 45 RON\n💰 Taxa SRL: 95 RON";
    }

    if (this.matchAny(m, ["cas","cass","sanatate","casa sanatatii","asigurare medicala"])) {
      return "*Casa de Asigurari de Sanatate* \n\n📄 *Acte pentru asigurare:*\n1. Cerere (o generez eu)\n2. Copie CI\n3. Dovada calitatii de asigurat\n\n📧 Depunere: email la Casa de Sanatate judeteana\n⏱ Procesare: 5-15 zile";
    }

    if (this.matchAny(m, ["itm","revisal","contract munca","angajare"])) {
      return "*ITM / Revisal* \n\nContractul individual de munca se inregistreaza in Revisal inainte de inceperea activitatii.\n\n*Angajatorul* are obligatia sa:\n1. Completeze contractul\n2. Il transmita in Revisal\n3. Il inmaneze angajatului in maxim 2 zile\n\n*Vezi si:* somaj, concedii medicale";
    }

    // DRPCIV
    if (this.matchAny(m, ["drpciv","permis","inmatriculare auto","programare drpciv"])) {
      return "*DRPCIV* \n\n📅 *Programari online:* drpciv.ro\n\n*Buletin:* 6 RON, 2-5 zile\n*Permis conducere:* 89 RON\n*Inmatriculare auto:* 45 RON\n*ITP:* 50-100 RON";
    }

    // Ghiseul.ro
    if (this.matchAny(m, ["ghiseul","ghiseul.ro","plati online","platesc taxe"])) {
      return "*Ghiseul.ro* \n\nPlatforma nationala de plati online catre stat.\n\nPoti plati:\n• Impozite si taxe locale\n• Amenzi de circulatie\n• Taxe DRPCIV\n• Cazier fiscal\n\n🔗 ghiseul.ro\n• Autentificare cu certificat digital sau cont de utilizator";
    }

    // Status / tracking
    if (this.matchAny(m, ["status","dosar","cerere","unde e"])) {
      return "Pentru a verifica statusul unui dosar ai nevoie de: \n\n• Numarul de inregistrare\n• Instituția unde ai depus\n\nEx: \"anaf dosar SPV\", \"onrc cerere\"";
    }

    // Calculator / site
    if (this.matchAny(m, ["site","calculator","calculatoare","web","online"])) {
      return "*BiroPilot Online* \n\n🌐 https://mercurialu.github.io/biropilot/\n\nAcolo gasesti:\n💰 Calculator Taxe ANAF\n💼 Calculator Salariu Net\n🏠 Calculator Credit Ipotecar\n✈️ Calculator Diurna\n🚗 Calculator Amenda\n👶 Calculator Indemnizatie Copil";
    }

    // Default - suggest help
    return "Nu am inteles exact. Poti incerca: \n\n• *Formulare:* \"vreau PFA\", \"declaratie unica\", \"schimb buletin\"\n• *Calcule:* \"taxe anaf\", \"salariu net\", \"credit ipotecar\"\n• *Institutii:* \"primarie\", \"drpciv\", \"ghiseul.ro\"\n• *Ajutor:* \"ce poti\"";
  }

  handleStep(session, m, userId) {
    const step = session.step;
    
    if (step === "anaf_taxe" && /^\d+$/.test(m.replace(/[\.\,]/, ""))) {
      const venit = parseInt(m.replace(/[\.\,]/, ""));
      const sm = 4050;
      const cas = Math.max(venit * 0.25, sm * 12 * 0.25);
      const cass = Math.max(venit * 0.10, sm * 12 * 0.06);
      const imp = Math.max(0, (venit - cas) * 0.10);
      const total = cas + cass + imp;
      session.step = null;
      return "*Taxe ANAF pentru " + venit.toLocaleString() + " RON* \n\n" +
        "• CAS (25%): " + Math.round(cas).toLocaleString() + " RON\n" +
        "• CASS (10%): " + Math.round(cass).toLocaleString() + " RON\n" +
        "• Impozit (10%): " + Math.round(imp).toLocaleString() + " RON\n" +
        "───────────────\n" +
        "*TOTAL: " + Math.round(total).toLocaleString() + " RON* \n\n" +
        "*Atentie:* Termenul de plata e 25 mai " + (new Date().getFullYear() + 1);
    }
    
    if (step === "salariu_calc" && /^\d+$/.test(m.replace(/[\.\,]/, ""))) {
      const b = parseInt(m.replace(/[\.\,]/, ""));
      const cas = b * 0.25;
      const cass = b * 0.10;
      const imp = Math.max(0, (b - cas - cass - 510) * 0.10);
      const net = b - cas - cass - imp;
      session.step = null;
      return "*Salariu Net pentru " + b.toLocaleString() + " RON brut* \n\n" +
        "• CAS (25%): -" + Math.round(cas).toLocaleString() + " RON\n" +
        "• CASS (10%): -" + Math.round(cass).toLocaleString() + " RON\n" +
        "• Impozit: -" + Math.round(imp).toLocaleString() + " RON\n" +
        "───────────────\n" +
        "*SALARIU NET: " + Math.round(net).toLocaleString() + " RON*";
    }
    
    if (step === "credit_calc") {
      const parts = m.match(/([\d\.]+)\s*(?:ron|eur|euro)?\s*(?:pe|in)?\s*(\d+)\s*(?:ani|luni)?/i);
      if (parts) {
        const suma = parseFloat(parts[1]);
        const ani = parseInt(parts[2]);
        const p = 5.79 / 100 / 12;
        const n = ani * 12;
        const d = Math.pow(1 + p, n);
        const rata = suma * p * d / (d - 1);
        session.step = null;
        return "*Credit Ipotecar* \n\n" +
          "Suma: " + suma.toLocaleString() + " RON\n" +
          "Perioada: " + ani + " ani\n" +
          "Dobanda: 5.79% (medie pietei)\n" +
          "───────────────\n" +
          "*RATA LUNARA: " + Math.round(rata).toLocaleString() + " RON* \n\n" +
          "Total plata: " + Math.round(rata * n).toLocaleString() + " RON";
      }
    }
    
    session.step = null;
    return "Am salvat datele. Cu ce te mai pot ajuta?";
  }

  matchAny(text, keywords) {
    return keywords.some(k => text.includes(k));
  }

  detectIntent(m) {
    if (this.matchAny(m, ["pfa","declarat","buletin","formular","cerere","acte"])) return "PROCEDURA";
    if (this.matchAny(m, ["cat","cât","calculeaza","taxe","salariu","rate","amend"])) return "CALCUL";
    if (this.matchAny(m, ["salut","buna","hey"])) return "SALUT";
    return "NECUNOSCUT";
  }
}

module.exports = { WhatsAppBot };