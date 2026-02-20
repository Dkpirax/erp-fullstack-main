# WhatsApp Bot – Setup & Testing Guide

## Architecture Overview

```
WhatsApp User
     │  (text or button reply)
     ▼
Meta WhatsApp Cloud API
     │  POST /api/v1/whatsapp/webhook
     ▼
routes/whatsapp.js         ← validates & dispatches
     │
     ▼
whatsapp/bot-handler.js    ← state machine (IDLE→BROWSING→CART→CONFIRM)
     │
     ├──► whatsapp/rag-engine.js   ← TF-IDF product search (reads DB)
     ├──► whatsapp/whatsapp-api.js ← sends replies via Meta API
     ├──► whatsapp/session-store.js← in-memory conversation sessions
     └──► whatsapp/order-manager.js← creates Order/OrderItem in DB
```

---

## Step 1 – Meta Developer Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App** → choose **Business**.
2. Add **WhatsApp** product to your app.
3. Under **WhatsApp → API Setup**, note down:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID` in `.env`
   - **WhatsApp Business Account ID** → `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - **Temporary Access Token** → `WHATSAPP_ACCESS_TOKEN` (generate a permanent one for production)

---

## Step 2 – Expose Your Local Server (for Development)

Meta requires a **public HTTPS URL** to send webhooks. Use **ngrok**:

```bash
# Install ngrok from https://ngrok.com
ngrok http 3000
```

Copy the generated `https://xxxx.ngrok.io` URL.

Update `.env`:
```
WEBHOOK_BASE_URL=https://xxxx.ngrok.io
```

---

## Step 3 – Register the Webhook

In the Meta Developer Portal:
1. Go to **WhatsApp → Configuration → Webhooks**
2. Click **Edit**:
   - **Callback URL**: `https://xxxx.ngrok.io/api/v1/whatsapp/webhook`
   - **Verify Token**: must match `WEBHOOK_VERIFY_TOKEN` in your `.env` (default: `my_verify_token`)
3. Click **Verify and Save**
4. Subscribe to the **messages** field

---

## Step 4 – Fill in `.env`

```env
WHATSAPP_PHONE_NUMBER_ID=<from Meta portal>
WHATSAPP_BUSINESS_ACCOUNT_ID=<from Meta portal>
WHATSAPP_ACCESS_TOKEN=<from Meta portal>
WEBHOOK_VERIFY_TOKEN=my_verify_token   # or any secret string
WEBHOOK_BASE_URL=https://xxxx.ngrok.io
CURRENCY_SYMBOL=Rs.
```

---

## Step 5 – Start the Server

```bash
npm run server     # or: node server.js
```

Check the bot status endpoint:
```
GET http://localhost:3000/api/v1/whatsapp/status
```

---

## Step 6 – Test the Bot

Send a WhatsApp message to your business test number:

| What you send       | Bot response                              |
|---------------------|-------------------------------------------|
| `hi`                | Main menu with Browse / Cart buttons      |
| `laptop`            | RAG search results list                   |
| (select product)    | Product detail with Add to Cart           |
| (Add to Cart)       | Confirmation + cart view                  |
| (Checkout)          | Order summary + confirm buttons           |
| (Yes, Order!)       | Order created in ERP DB + confirmation    |
| `cart`              | View current cart (any state)             |
| `reset`             | Clear session                             |

---

## Conversation Flow

```
[User: hi]
   └─► Main Menu  (Browse All | View Cart)

[User selects Browse All OR types product name]
   └─► Product List (interactive list, up to 10 products)

[User selects a product]
   └─► Product Detail  (Add to Cart | View Cart | Go Back)

[User taps Add to Cart]
   └─► Cart View  (Checkout | Keep Shopping | Clear Cart)

[User taps Checkout]
   └─► Order Confirmation  (Yes Order | Go Back)

[User confirms]
   └─► Name prompt (if first time) → Order placed in DB ✅
```

---

## Production Checklist

- [ ] Replace temporary Meta Access Token with a permanent System User Token
- [ ] Set `NODE_ENV=production`
- [ ] Deploy behind HTTPS (required by Meta)
- [ ] Set `WEBHOOK_BASE_URL` to your production domain
- [ ] Consider Redis for session storage (replace `session-store.js`)
- [ ] Add rate limiting to the webhook endpoint
- [ ] Enable Meta App for production use (submit for Business Verification)

---

## RAG Engine Details

The RAG engine (`whatsapp/rag-engine.js`) works without any external AI API:

- **Indexing**: All `instock` products are fetched from the DB and indexed using **TF-IDF** (Term Frequency–Inverse Document Frequency) weighting.
- **Search**: User queries are tokenized, stop-words removed, and scored against the index using **cosine similarity**.
- **Auto-refresh**: Index refreshes every 5 minutes in the background.
- **Fields indexed**: product name (weighted 2×), SKU, description, price, stock status.

To add richer AI search later, replace the `search()` function in `rag-engine.js` with an OpenAI embeddings + vector store implementation.
