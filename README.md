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
- **Ephemeral links** - Create self-destructing links (1h to 48h)
- **Custom keys** - Choose your own short URL keys
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
const result = await houla.createLink({
  url: "https://example.com/very-long-url",
});

console.log(result.shortUrl); // https://hou.la/abc123
```

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
| `includeQrCode` | `boolean` | No | Include QR code in response |
| `qrCodeOptions` | `QRCodeOptions` | No | QR code customization |

### QR Code Options

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
const result = await houla.createLink({
  url: "https://example.com",
});

// With custom key
const result = await houla.createLink({
  url: "https://example.com",
  key: "my-promo", // https://hou.la/my-promo
  title: "Summer Sale 2026",
});

// Ephemeral link (self-destructing)
import { EphemeralDuration } from "@houla/sdk";

const result = await houla.createLink({
  url: "https://example.com/secret",
  isEphemeral: true,
  ephemeralDuration: EphemeralDuration.HOURS_24,
});

// With UTM parameters for marketing
const result = await houla.createLink({
  url: "https://example.com/landing",
  utm: true,
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "january_2026",
});

// With QR Code
const result = await houla.createLink({
  url: "https://example.com",
  includeQrCode: true,
  qrCodeOptions: {
    width: 300,
    darkColor: "#1a1a1a",
  },
});
console.log(result.qrCode?.dataUrl); // data:image/png;base64,...
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
const png = await houla.getQRCodePng("my-key", { width: 300 });
const svg = await houla.getQRCodeSvg("my-key");
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
  const result = await houla.createLink({ url, includeQrCode: true });
  return NextResponse.json({ shortUrl: result.shortUrl, qr: result.qrCode?.dataUrl });
}
```

### Express

```typescript
import express from "express";
import { HoulaClient } from "@houla/sdk";

const houla = new HoulaClient({ apiKey: process.env.HOULA_API_KEY! });

app.post("/api/shorten", async (req, res) => {
  const result = await houla.createLink({ url: req.body.url });
  res.json({ shortUrl: result.shortUrl });
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

## Get Your FREE API Key

1. Go to [hou.la](https://hou.la) and sign in (free account)
2. Navigate to **Settings** > **API Keys**
3. Create a new API key
4. Copy the key (format: `houla_sk_xxx...`)

## License

MIT - Free for personal and commercial use.

---

**Built with love by [Hou.la](https://hou.la)** - The free URL shortener for everyone.
