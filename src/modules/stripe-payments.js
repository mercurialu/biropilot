// Stripe Payments Integration
// Adauga in src/modules/

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_...";
const PRICE_BASIC = process.env.PRICE_BASIC || "price_basic_monthly";
const PRICE_PRO = process.env.PRICE_PRO || "price_pro_monthly";

class StripePayments {
  constructor() {
    this.baseUrl = "https://api.stripe.com/v1";
    this.auth = Buffer.from(STRIPE_SECRET_KEY + ":").toString("base64");
  }

  async createCheckoutSession(priceId, userId, successUrl, cancelUrl) {
    const params = new URLSearchParams({
      "mode": "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "client_reference_id": userId,
      "success_url": successUrl || "https://mercurialu.github.io/biropilot/?success=true",
      "cancel_url": cancelUrl || "https://mercurialu.github.io/biropilot/?canceled=true"
    });
    const r = await fetch(this.baseUrl + "/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": "Basic " + this.auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    return r.json();
  }

  async verifyWebhook(body, signature, secret) {
    // In productie: verifica semnatura webhook-ului Stripe
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    // TODO: implementeaza verificare crypto
    return JSON.parse(payload);
  }

  async getCustomer(email) {
    const r = await fetch(this.baseUrl + "/customers?email=" + encodeURIComponent(email), {
      headers: { "Authorization": "Basic " + this.auth }
    });
    const d = await r.json();
    return d.data?.[0] || null;
  }

  getPricing() {
    return {
      basic: { id: PRICE_BASIC, name: "Basic", amount: 29, currency: "ron", interval: "month" },
      pro: { id: PRICE_PRO, name: "Pro", amount: 49, currency: "ron", interval: "month" }
    };
  }
}

module.exports = { StripePayments };
