# ============================================================
# WhatAapp + Stripe AI Agent
# ============================================================

WhatsApp Cloud API - Twilio:
1. Creeaza cont pe twilio.com (gratuit, primesti ~$15 credit)
2. In Twilio Console, mergi la Messaging > Try it out > Send a WhatsApp message
3. Conecteaza-ti numarul de WhatsApp
4. Copiaza Account SID si Auth Token

SETUP:
In Twilio Console:
1. Mergi la: Messaging > Services > Create
2. Nume: BiroPilot
3. In Webhook URL pune: https://biropilot.onrender.com/api/whatsapp
4. Activeaza "Incoming Messages"

COD INTEGRARE (twilio.js):
