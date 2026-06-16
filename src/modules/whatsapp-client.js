// WhatsApp Twilio Integration
// Adauga in src/modules/

const TWILIO_SID = process.env.TWILIO_SID || "YOUR_TWILIO_SID";
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || "YOUR_TWILIO_TOKEN";
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || "+14155238886"; // Twilio sandbox number

class WhatsAppClient {
  constructor() {
    this.baseUrl = "https://api.twilio.com/2010-04-01/Accounts/" + TWILIO_SID + "/Messages.json";
    this.auth = Buffer.from(TWILIO_SID + ":" + TWILIO_TOKEN).toString("base64");
  }

  async send(to, body) {
    const params = new URLSearchParams({ To: "whatsapp:" + to, From: "whatsapp:" + WHATSAPP_NUMBER, Body: body });
    const r = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Authorization": "Basic " + this.auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    return r.json();
  }

  async sendTemplate(to, template, vars = {}) {
    // Pentru mesaje template aprovate de WhatsApp
    return this.send(to, template);
  }

  parseWebhook(body) {
    // Parseaza mesajele primite de la Twilio
    return {
      from: body.From ? body.From.replace("whatsapp:", "") : null,
      message: body.Body || null,
      mediaUrl: body.MediaUrl0 || null,
      profileName: body.ProfileName || "Utilizator"
    };
  }
}

module.exports = { WhatsAppClient };
