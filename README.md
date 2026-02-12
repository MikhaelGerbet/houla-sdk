# @houla/sdk

[![npm version](https://img.shields.io/npm/v/@houla/sdk.svg)](https://www.npmjs.com/package/@houla/sdk)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@houla/sdk)](https://bundlephobia.com/package/@houla/sdk)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/@houla/sdk)
[![CI](https://github.com/MikhaelGerbet/houla-sdk/workflows/CI/badge.svg)](https://github.com/MikhaelGerbet/houla-sdk/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Official TypeScript SDK for [Hou.la](https://hou.la)** - The 100% FREE URL shortener, link shortener & QR code generator.

## Why Hou.la?

- **100% FREE** - No credit card required, no hidden fees, no limits on link creation
- **QR Codes included** - Generate QR codes for any link at no extra cost
- **Analytics** - Track clicks, browsers, devices, countries, and referrers
- **UTM tracking** - Built-in UTM parameter support for marketing campaigns
- **Ephemeral links** - Create self-destructing links (1h to 48h) or with a custom expiration date
- **Custom keys** - Choose your own short URL keys
- **Smart Routing** - Redirect visitors based on country, device, language, time, and more
- **Webhooks** - Real-time HTTP notifications for 10 event types (including Link-in-Bio exclusives)
- **No ads** - Clean, fast redirects without any advertising

## Why this SDK?

- **Zero dependencies** - No bloat, just pure TypeScript
- **Tiny bundle** - Less than 6KB minified + gzipped
- **Full TypeScript support** - Complete type definitions included
- **Dual format** - Works with ESM and CommonJS
- **Server-side only** - Keeps your API key secure

> **Important**: This SDK is designed for **server-side use only**. Never expose your API key in frontend code.

## Installation

```bash
npm install @houla/sdk
# or
yarn add @houla/sdk
# or
pnpm add @houla/sdk
```

## Quick Start

```typescript
import { HoulaClient } from "@houla/sdk";

const houla = new HoulaClient({
  apiKey: process.env.HOULA_API_KEY!, // houla_sk_xxx
});

// Create a short link
const link = await houla.createLink({
  url: "https://example.com/very-long-url",
});

console.log(link.shortUrl);  // https://hou.la/abc4
console.log(link.flashUrl);  // https://hou.la/abc4/f (for QR code tracking)
```

## API Response

When creating a link, the API returns:

```typescript
{
  id: string;
  key: string;           // The short key (e.g., "abc4")
  url: string;           // The destination URL
  shortUrl: string;      // Full short URL (e.g., "https://hou.la/abc4")
  flashUrl: string;      // URL for QR codes (e.g., "https://hou.la/abc4/f")
  hasPassword: boolean;  // Whether the link is password-protected
  isEphemeral?: boolean;
  expiresAt?: Date;
  // ...other properties
}
```

> **Note:** Use `flashUrl` for QR codes to track scans separately from direct link clicks.

### Key Length Generation

When no custom key is provided, the API auto-generates one:

| Link Type | Minimum Length |
|-----------|----------------|
| Ephemeral (temporary) | 3 characters |
| Classic (permanent) | 4 characters |

## Create Link - All Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | `string` | **Yes** | The destination URL to shorten |
| `key` | `string` | No | Custom short key (e.g., "promo" for hou.la/promo) |
| `title` | `string` | No | A descriptive title for the link |
| `utm` | `boolean` | No | Enable UTM tracking parameters |
| `utm_id` | `string` | No | UTM campaign ID |
| `utm_source` | `string` | No | UTM source (e.g., "newsletter", "twitter") |
| `utm_medium` | `string` | No | UTM medium (e.g., "email", "social") |
| `utm_campaign` | `string` | No | UTM campaign name |
| `utm_term` | `string` | No | UTM term (for paid search) |
| `utm_content` | `string` | No | UTM content (for A/B testing) |
| `isEphemeral` | `boolean` | No | Create a self-destructing link |
| `ephemeralDuration` | `EphemeralDuration` | No | Duration: `"1h"`, `"6h"`, `"12h"`, `"24h"`, `"48h"` |
| `customExpiresAt` | `string` | No | Custom expiration date (ISO 8601). Mutually exclusive with `ephemeralDuration`. Key is NOT recycled. |
| `password` | `string` | No | Password to protect the link (1-100 chars). Hashed with bcrypt. Enhanced security included. |

### QR Code Options (for `getQRCode`, `getQRCodePng`, `getQRCodeSvg`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | 200 | Width in pixels |
| `margin` | `number` | 4 | Margin around QR code |
| `darkColor` | `string` | "#000000" | QR code color |
| `lightColor` | `string` | "#FFFFFF" | Background color |
| `errorCorrectionLevel` | `"L" \| "M" \| "Q" \| "H"` | "M" | Error correction |
| `format` | `"png" \| "svg"` | "png" | Output format |

### Examples

```typescript
// Basic link
const link = await houla.createLink({
  url: "https://example.com",
});
console.log(link.shortUrl); // https://hou.la/abc4

// With custom key
const link = await houla.createLink({
  url: "https://example.com",
  key: "my-promo",      // custom key
  title: "Summer Sale 2026",
});
console.log(link.shortUrl); // https://hou.la/my-promo

// Ephemeral link (self-destructing)
import { EphemeralDuration } from "@houla/sdk";

const link = await houla.createLink({
  url: "https://example.com/secret",
  isEphemeral: true,
  ephemeralDuration: EphemeralDuration.HOURS_24,
});
// link.expiresAt contains the expiration date

// Custom expiration date (link expires at a specific date, key NOT recycled)
const link2 = await houla.createLink({
  url: "https://example.com/event",
  customExpiresAt: "2026-06-15T23:59:59.000Z",
});
// link2.expiresAt = "2026-06-15T23:59:59.000Z"

// With UTM parameters for marketing
const link = await houla.createLink({
  url: "https://example.com/landing",
  utm: true,
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "january_2026",
});

// Password-protected link
const protectedLink = await houla.createLink({
  url: "https://example.com/private-doc",
  password: "secret123",
});
console.log(protectedLink.hasPassword); // true
// Visitors must enter the password before being redirected
// Enhanced security protection included

// Generate QR Code separately
const qr = await houla.getQRCodePng(link.id, { width: 300 });
console.log(qr.dataUrl); // data:image/png;base64,...
```

## Other Methods

```typescript
// List all links (paginated)
const links = await houla.getLinks(1, 20);

// Get link by ID or key
const link = await houla.getLinkById("uuid");
const link = await houla.getLinkByKey("my-key");

// Update a link
await houla.updateLink("uuid", { title: "New title" });

// Delete a link
await houla.deleteLink("uuid");

// Check key availability
const { available } = await houla.checkAvailability("my-key");

// Generate QR code for existing link
const png = await houla.getQRCodePng("link-uuid", { width: 300 });
const svg = await houla.getQRCodeSvg("link-uuid");
```

## Smart Routing (Link Rules)

Redirect visitors to different destinations based on their context (country, device, language, referrer, time, etc.).

```typescript
// List rules for a link
const rules = await houla.getLinkRules("link-uuid");

// Create a routing rule
const rule = await houla.createLinkRule("link-uuid", {
  label: "Mobile FR visitors",
  destinationUrl: "https://m.site.fr/promo",
  matchType: "all", // "all" = AND, "any" = OR
  conditions: [
    { field: "country", operator: "equals", value: "FR" },
    { field: "device", operator: "equals", value: "mobile" },
  ],
});

// Update a rule
await houla.updateLinkRule("link-uuid", rule.id, {
  label: "Mobile FR + ES visitors",
  conditions: [
    { field: "country", operator: "in", value: '["FR","ES"]' },
    { field: "device", operator: "equals", value: "mobile" },
  ],
});

// Reorder rules (priority)
await houla.reorderLinkRules("link-uuid", ["rule-id-2", "rule-id-1"]);

// Delete a rule
await houla.deleteLinkRule("link-uuid", rule.id);
```

### Available condition fields

| Field | Description |
|-------|-------------|
| `country` | ISO country code (FR, US, DE...) |
| `continent` | EU, NA, SA, AS, AF, OC, AN |
| `device` | mobile, tablet, desktop |
| `os` | Windows, macOS, iOS, Android, Linux |
| `browser` | Chrome, Firefox, Safari, Edge... |
| `language` | ISO 639-1 code (fr, en, es...) |
| `referrer` | Referrer hostname (domain only) |
| `social_media` | TikTok, Instagram, Facebook, Twitter/X... |
| `day_of_week` | monday through sunday |
| `hour` | 0–23 (UTC) |
| `date_range` | Date range (ISO format) |
| `is_bot` | true/false |
| `is_first_visit` | true/false (cookie-based, "premier click") |

### A/B Testing

Create A/B test variants using the `weight` field. Rules with weights and no conditions are automatically treated as A/B test variants.

```typescript
// Create A/B test variants
await houla.createLinkRule("link-uuid", {
  label: "Variant A",
  destinationUrl: "https://example.com/page-a",
  weight: 60, // 60% of traffic
  conditions: [],
});
await houla.createLinkRule("link-uuid", {
  label: "Variant B",
  destinationUrl: "https://example.com/page-b",
  weight: 40, // 40% of traffic
  conditions: [],
});
```

> **Note:** The total weights should equal 100% for predictable distribution. Weights exceeding 100% are refused by the UI.

## Webhooks

Receive real-time HTTP notifications when events occur on your links or Link-in-Bio pages.

```typescript
// Create a webhook
const webhook = await houla.createWebhook({
  name: "My Integration",
  url: "https://my-app.com/webhooks/houla",
  events: ["link.clicked", "link.created"],
  anonymizeIp: true,       // GDPR: anonymize IP addresses
  excludeGeoCity: true,    // GDPR: exclude city from geo data
});
console.log(webhook.secret); // whsec_xxx — save this securely!

// List webhooks
const webhooks = await houla.getWebhooks();

// Update a webhook
await houla.updateWebhook(webhook.id, {
  name: "Updated Integration",
  events: ["link.clicked", "link.created", "link.deleted"],
});

// Enable / Disable
await houla.enableWebhook(webhook.id);
await houla.disableWebhook(webhook.id);

// Test a webhook
const test = await houla.testWebhook(webhook.id);
console.log(test.success, test.responseTimeMs);

// Get delivery logs (paginated, filterable)
const logs = await houla.getWebhookLogs(webhook.id, 1, 20, true); // success only

// Regenerate secret
const updated = await houla.regenerateWebhookSecret(webhook.id);
console.log(updated.secret); // new secret

// Get current secret
const { secret } = await houla.getWebhookSecret(webhook.id);

// Delete
await houla.deleteWebhook(webhook.id);
```

### Webhook Create Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | **Yes** | Descriptive name (max 100 chars) |
| `url` | `string` | **Yes** | Destination URL (HTTPS required in production) |
| `events` | `string[]` | **Yes** | Events to listen to (at least 1) |
| `linkId` | `string` | No | UUID of a specific link to watch |
| `tagId` | `string` | No | UUID of a tag to filter events |
| `batchSize` | `number` | No | Batch size (1-100, default: 1) |
| `batchDelayMs` | `number` | No | Max delay before batch flush in ms (0-60000) |
| `samplingRate` | `number` | No | Percentage of events to send (1-100, default: 100) |
| `anonymizeIp` | `boolean` | No | Anonymize IP in payloads (GDPR) |
| `excludeGeoCity` | `boolean` | No | Exclude city from geo data (GDPR) |

### Available Events

| Event | Description |
|-------|-------------|
| `link.clicked` | A link was clicked |
| `link.created` | A link was created |
| `link.updated` | A link was updated |
| `link.deleted` | A link was deleted |
| `link.health_changed` | Link health status changed |
| `link.safety_changed` | Link safety status changed |
| `link.expired` | An ephemeral link expired |
| `link.password_attempt` | Password attempt on a protected link |
| `profile.visited` | A Link-in-Bio page was visited |
| `profile.link_clicked` | A link was clicked on a Link-in-Bio page |

> **Exclusive:** `profile.visited` and `profile.link_clicked` events are only available on Hou.la.

### Signature Verification

Every webhook request includes an `X-Houla-Signature` header (HMAC-SHA256). Verify it to ensure authenticity:

```typescript
import crypto from "crypto";

function verifySignature(body: any, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

## Framework Examples

### Next.js (App Router)

```typescript
// app/api/shorten/route.ts
import { HoulaClient } from "@houla/sdk";
import { NextResponse } from "next/server";

const houla = new HoulaClient({ apiKey: process.env.HOULA_API_KEY! });

export async function POST(request: Request) {
  const { url } = await request.json();
  const link = await houla.createLink({ url });
  const qr = await houla.getQRCodePng(link.id);
  return NextResponse.json({ shortUrl: `https://hou.la/${link.key}`, qr: qr.dataUrl });
}
```

### Express

```typescript
import express from "express";
import { HoulaClient } from "@houla/sdk";

const houla = new HoulaClient({ apiKey: process.env.HOULA_API_KEY! });

app.post("/api/shorten", async (req, res) => {
  const link = await houla.createLink({ url: req.body.url });
  res.json({ shortUrl: `https://hou.la/${link.key}` });
});
```

### NestJS

```typescript
import { Injectable } from "@nestjs/common";
import { HoulaClient } from "@houla/sdk";

@Injectable()
export class LinkService {
  private houla = new HoulaClient({ apiKey: process.env.HOULA_API_KEY! });

  async shorten(url: string) {
    return this.houla.createLink({ url });
  }
}
```

## Comparison with Alternatives

| Feature | Hou.la | Bitly | TinyURL | Rebrandly |
|---------|--------|-------|---------|-----------|
| **Price** | FREE | $35+/mo | $12+/mo | $89+/mo |
| **Link creation** | Unlimited | 10/mo free | Limited | Limited |
| **QR codes** | FREE | Paid | Paid | Paid |
| **Analytics** | FREE | Paid | Paid | Paid |
| **UTM tracking** | FREE | Paid | Paid | Paid |
| **Custom keys** | FREE | Paid | Paid | Paid |
| **API access** | FREE | Paid | Paid | Paid |
| **Ephemeral links** | FREE | No | No | No |
| **Custom expiration** | FREE | No | No | No |
| **Smart Routing** | FREE | Enterprise only | No | Paid |
| **A/B Testing** | FREE | Enterprise only | No | Paid |
| **Password links** | FREE | Paid | No | Paid |
| **Enhanced security** | FREE | No | No | No |
| **Webhooks** | FREE (10 events) | Enterprise only | No | Paid |

## Get Your FREE API Key

1. Go to [hou.la](https://hou.la) and sign in (free account)
2. Navigate to **Settings** > **API Keys**
3. Create a new API key
4. Copy the key (format: `houla_sk_xxx...`)

## License

MIT - Free for personal and commercial use.

---

**Built with love by [Hou.la](https://hou.la)** - The free URL shortener for everyone.
