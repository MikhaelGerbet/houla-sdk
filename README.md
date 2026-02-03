# @houla/sdk

[![npm version](https://img.shields.io/npm/v/@houla/sdk.svg)](https://www.npmjs.com/package/@houla/sdk)
[![npm bundle size (gzip)](https://img.shields.io/bundlephobia/minzip/@houla/sdk)](https://bundlephobia.com/package/@houla/sdk)
[![CI](https://github.com/MikhaelGerbet/houla-sdk/workflows/CI/badge.svg)](https://github.com/MikhaelGerbet/houla-sdk/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript SDK for the Hou.la API - URL shortening and QR code generation.

> **Important**: This SDK is designed for **server-side use only**. Never expose your API key in frontend code.

## Installation

```bash
npm install @houla/sdk
# or
yarn add @houla/sdk
# or
pnpm add @houla/sdk
```

## Usage

### Initialization

```typescript
import { HoulaClient } from "@houla/sdk";

const houla = new HoulaClient({
  apiKey: process.env.HOULA_API_KEY!, // houla_sk_xxx
});
```

### Create a short link

```typescript
const result = await houla.createLink({
  url: "https://example.com/very-long-url",
  title: "My link",
});

console.log(result.shortUrl); // https://hou.la/abc123
console.log(result.link.key); // abc123
```

### With custom key

```typescript
const result = await houla.createLink({
  url: "https://example.com",
  key: "my-link", // https://hou.la/my-link
});
```

### Ephemeral link

```typescript
import { EphemeralDuration } from "@houla/sdk";

const result = await houla.createLink({
  url: "https://example.com/secret",
  isEphemeral: true,
  ephemeralDuration: EphemeralDuration.HOURS_24,
});
```

### With QR Code

```typescript
const result = await houla.createLink({
  url: "https://example.com",
  includeQrCode: true,
  qrCodeOptions: {
    width: 300,
    darkColor: "#000000",
  },
});

console.log(result.qrCode?.dataUrl); // data:image/png;base64,...
```

### List links

```typescript
const links = await houla.getLinks(1, 20);

console.log(links.total);
links.data.forEach(link => {
  console.log(`${link.key}: ${link.url} (${link.hitsCount} clicks)`);
});
```

### Get a link

```typescript
// By ID
const link = await houla.getLinkById("link-uuid");

// By key
const link = await houla.getLinkByKey("my-key");
```

### Update a link

```typescript
const updated = await houla.updateLink("link-uuid", {
  title: "New title",
  url: "https://new-url.com",
});
```

### Delete a link

```typescript
const result = await houla.deleteLink("link-uuid");
console.log(result.success); // true
```

### Check key availability

```typescript
const { available } = await houla.checkAvailability("my-key");
if (available) {
  // Key is available
}
```

### Generate QR Code

```typescript
// PNG
const png = await houla.getQRCodePng("my-key", { width: 300 });
console.log(png.dataUrl);

// SVG
const svg = await houla.getQRCodeSvg("my-key");
console.log(svg.svg);
```

## Integration Examples

### Next.js (App Router)

```typescript
// app/api/shorten/route.ts
import { HoulaClient } from "@houla/sdk";
import { NextResponse } from "next/server";

const houla = new HoulaClient({
  apiKey: process.env.HOULA_API_KEY!,
});

export async function POST(request: Request) {
  const { url } = await request.json();
  const result = await houla.createLink({ url });
  return NextResponse.json({ shortUrl: result.shortUrl });
}
```

### Express

```typescript
import express from "express";
import { HoulaClient } from "@houla/sdk";

const app = express();
const houla = new HoulaClient({
  apiKey: process.env.HOULA_API_KEY!,
});

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
  private houla = new HoulaClient({
    apiKey: process.env.HOULA_API_KEY!,
  });

  async shorten(url: string) {
    return this.houla.createLink({ url });
  }
}
```

## Types

```typescript
import type {
  Link,
  CreateLinkDto,
  UpdateLinkDto,
  PaginatedResponse,
  LinkWithQRCodeResponse,
  QRCodeOptions,
} from "@houla/sdk";
```

## Get an API Key

1. Sign in to [hou.la](https://hou.la)
2. Go to **Settings** -> **API Keys**
3. Create a new API key
4. Copy the key (format: `houla_sk_xxx...`)

## License

MIT
