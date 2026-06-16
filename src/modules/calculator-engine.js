// ============================================================
// BIROPILOT — Calculator Engine (Viral)
// Calculatoare care se share-uiesc singure pe Facebook/WhatsApp
// ============================================================

const calculators = {
  taxeANAF: {
    id: 'taxe-anaf',
    nume: 'Calculator Taxe ANAF',
    descriere: 'Află cât ai de plătit la stat (CAS, CASS, impozit)',
    viral: true,
    shareText: 'Am aflat ca platesc {suma} RON la ANAF. Tu cat platesti?',
    categorie: 'financiar',
    calcul: function(params) {
      const { venitAnual, normaVenit } = params;
      const salariuMinim = 4050;
      const baza = Math.max(venitAnual || 0, normaVenit || 0);
      const cas = Math.max(baza * 0.25, salariuMinim * 12 * 0.25);
      const cass = Math.max(baza * 0.10, salariuMinim * 12 * 0.06);
      const impozit = Math.max(0, (baza - cas) * 0.10);
      return {
        venitBaza: baza,
        CAS: Math.round(cas),
        CASS: Math.round(cass),
        impozit: Math.round(impozit),
        TOTAL: Math.round(cas + cass + impozit)
      };
    }
  },
  salariuNet: {
    id: 'salariu-net',
    nume: 'Calculator Salariu Net 2026',
    descriere: 'Calculează salariul net din cel brut',
    viral: true,
    shareText: 'Am aflat ca salariul meu net e {suma} RON. Verifica si tu!',
    categorie: 'financiar',
    calcul: function(params) {
      const { salariuBrut } = params;
      const b = salariuBrut || 0;
      const cas = b * 0.25;
      const cass = b * 0.10;
      const impozit = Math.max(0, (b - cas - cass - 510) * 0.10);
      const net = b - cas - cass - impozit;
      return {
        brut: b,
        CAS: Math.round(cas),
        CASS: Math.round(cass),
        impozit: Math.round(impozit),
        NET: Math.round(net)
      };
    }
  },
  ipotecar: {
    id: 'credit-ipotecar',
    nume: 'Calculator Credit Ipotecar',
    descriere: 'Află rata lunară la un credit ipotecar',
    viral: true,
    shareText: 'La creditul de {suma} RON, rata mea e de {rata} RON. Calculeaza si tu!',
    categorie: 'financiar',
    calcul: function(params) {
      const { suma, dobandaAnuala = 5.79, ani = 30 } = params;
      const p = dobandaAnuala / 100 / 12;
      const n = ani * 12;
      const d = Math.pow(1 + p, n);
      const rata = suma * p * d / (d - 1);
      const totalPlatit = rata * n;
      const dobandaTotala = totalPlatit - suma;
      return {
        suma,
        dobanda: dobandaAnuala,
        ani,
        rataLunara: Math.round(rata),
        totalPlatit: Math.round(totalPlatit),
        dobandaTotala: Math.round(dobandaTotala)
      };
    }
  },
  diurna: {
    id: 'diurna-2026',
    nume: 'Calculator Diurnă 2026',
    descriere: 'Află diurna pe care ți se cuvine pentru deplasări',
    viral: true,
    shareText: 'Diurna pentru {zile} zile e de {suma} RON. Verifica si tu!',
    categorie: 'business',
    calcul: function(params) {
      const { zile, tara = 'Romania', functie = 'baza' } = params;
      const valori = {
        'Romania': { baza: 57, conducere: 71, publica: 39 },
        'UE': { baza: 87, conducere: 105, publica: 58 },
        'Non-UE': { baza: 97, conducere: 120, publica: 65 }
      };
      const val = valori[tara] ? valori[tara][functie] || valori[tara].baza : valori['Romania'].baza;
      return {
        zile,
        tara,
        functie,
        valoareZi: val,
        TOTAL: val * zile
      };
    }
  },
  amendaCirculatie: {
    id: 'amenda-circulatie',
    nume: 'Calculator Amendă Circulație 2026',
    descriere: 'Calculează valoarea amenzii în funcție de clasa de sancțiune',
    viral: true,
    shareText: 'Amenda clasa {clasa} e de {suma} RON. Ai grija la volan!',
    categorie: 'auto',
    calcul: function(params) {
      const { clasa } = params;
      const punctAmenda = 202.5;
      const clase = {
        'I': { puncte: 2, desc: '2-3 puncte (oprire neregulamentară)' },
        'II': { puncte: 4, desc: '4-5 puncte (viteză 10-20km/h peste limită)' },
        'III': { puncte: 6, desc: '6-8 puncte (viteză 20-30km/h peste limită)' },
        'IV': { puncte: 9, desc: '9-20 puncte (viteză 30-40km/h peste limită)' },
        'V': { puncte: 21, desc: '21-100 puncte (viteză 40+ km/h peste limită)' }
      };
      const clasaData = clase[clasa] || clase['I'];
      const valoare = punctAmenda * clasaData.puncte;
      const reducere = valoare * 0.5; // 50% în 15 zile
      return {
        clasa,
        descriere: clasaData.desc,
        valoareTotala: Math.round(valoare),
        cuReducere15Zile: Math.round(reducere),
        punctePenalizare: clasaData.puncte,
        punctAmenda: punctAmenda
      };
    }
  },
  indemnizatieCopil: {
    id: 'indemnizatie-copil',
    nume: 'Calculator Indemnizație Creștere Copil',
    descriere: 'Află ce indemnizație primești pentru creșterea copilului',
    viral: true,
    shareText: 'Indemnizatia pentru copil e de {suma} RON/luna. Calculeaza si tu!',
    categorie: 'social',
    calcul: function(params) {
      const { venitUltimele12Luni } = params;
      const salariuMinim = 4050;
      const indemnizatie = Math.min(venitUltimele12Luni * 0.85, 12700);
      return {
        venitMediu: venitUltimele12Luni,
        procent: '85%',
        plafonMaxim: 12700,
        indemnizatieLunara: Math.round(indemnizatie),
        durata: '24 luni (sau 36 luni pentru 50%)',
        stimulent: Math.round(salariuMinim * 0.60)
      };
    }
  }
};

class CalculatorEngine {
  constructor() {
    this.calculators = calculators;
  }

  calculate(calcId, params) {
    const calc = this.calculators[calcId];
    if (!calc) throw new Error('Calculatorul nu există');
    return {
      id: calc.id,
      nume: calc.nume,
      rezultat: calc.calcul(params),
      shareText: calc.shareText || false,
      viral: calc.viral || false
    };
  }

  listByCategory(categorie) {
    return Object.values(this.calculators).filter(c => c.categorie === categorie);
  }

  listAll() {
    return Object.values(this.calculators).map(c => ({
      id: c.id, nume: c.nume, descriere: c.descriere, viral: c.viral, categorie: c.categorie
    }));
  }

  getViralCalculators() {
    return Object.values(this.calculators).filter(c => c.viral);
  }
}

module.exports = { CalculatorEngine, calculators };
