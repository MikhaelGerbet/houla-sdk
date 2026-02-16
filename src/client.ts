import { HoulaConfig, createConfig } from "./config";
import {
  Link,
  CreateLinkDto,
  UpdateLinkDto,
  PaginatedResponse,
  CheckAvailabilityResponse,
  DeleteLinkResponse,
  OgImageUploadResponse,
  QRCodeOptions,
  QRCodePngResponse,
  QRCodeSvgResponse,
  QRCodeFormat,
  LinkCreatedType,
  LinkRule,
  CreateLinkRuleDto,
  UpdateLinkRuleDto,
  Webhook,
  WebhookWithSecret,
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookLog,
  WebhookStats,
  TestWebhookResult,
  PixelPreset,
  CreatePixelPresetDto,
  UpdatePixelPresetDto,
  CustomDomain,
  CreateCustomDomainDto,
  VerificationMethod,
  BioPageSummary,
  BioPage,
  CreateBioPageDto,
  UpdateBioPageDto,
  AttachCustomDomainToBioPageDto,
} from "./types";

export class HoulaClient {
  private readonly config: Required<HoulaConfig>;

  constructor(config: HoulaConfig) {
    this.config = createConfig(config);
  }

  private get baseUrl(): string {
    return `${this.config.apiUrl}/api/link`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.config.apiUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.config.apiKey,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getLinks(page = 1, limit = 20): Promise<PaginatedResponse<Link>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: Math.min(limit, 100).toString(),
    });
    return this.request<PaginatedResponse<Link>>(`/api/link?${params}`);
  }

  async getLinkById(id: string): Promise<Link> {
    return this.request<Link>(`/api/link/${id}`);
  }

  async getLinkByKey(key: string): Promise<Link> {
    return this.request<Link>(`/api/link/${key}`);
  }

  async checkAvailability(key: string): Promise<CheckAvailabilityResponse> {
    const response = await fetch(`${this.baseUrl}/${key}/availability`);
    return response.json();
  }

  async createLink(data: CreateLinkDto, source: LinkCreatedType = LinkCreatedType.API): Promise<Link> {
    return this.request<Link>("/api/link", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "X-Source": source },
    });
  }

  async updateLink(id: string, data: UpdateLinkDto): Promise<Link> {
    return this.request<Link>(`/api/link/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLink(id: string): Promise<DeleteLinkResponse> {
    return this.request<DeleteLinkResponse>(`/api/link/${id}`, {
      method: "DELETE",
    });
  }

  // ─── OG Image Upload ───

  /**
   * Upload a custom OG image for a link.
   * The image is auto-resized to 1200×630 (optimal for Facebook/LinkedIn) and converted to WebP.
   * @param linkId - UUID of the link
   * @param file - Image file (Blob/File). Accepted formats: JPEG, PNG, WebP, GIF. Max 8 MB.
   * @returns The public URL and R2 key of the uploaded image
   */
  async uploadOgImage(linkId: string, file: Blob, filename = "og-image"): Promise<OgImageUploadResponse> {
    const formData = new FormData();
    formData.append("file", file, filename);

    const url = `${this.config.apiUrl}/api/manager/link/${linkId}/og-image`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "X-API-Key": this.config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Delete the uploaded OG image for a link.
   * @param linkId - UUID of the link
   */
  async deleteOgImage(linkId: string): Promise<void> {
    await this.request<void>(`/api/manager/link/${linkId}/og-image`, {
      method: "DELETE",
    });
  }

  async getQRCode(id: string, options?: QRCodeOptions): Promise<QRCodePngResponse | QRCodeSvgResponse> {
    const params = new URLSearchParams();
    if (options?.width) params.set("width", options.width.toString());
    if (options?.margin !== undefined) params.set("margin", options.margin.toString());
    if (options?.darkColor) params.set("darkColor", options.darkColor);
    if (options?.lightColor) params.set("lightColor", options.lightColor);
    if (options?.errorCorrectionLevel) params.set("errorCorrectionLevel", options.errorCorrectionLevel);
    if (options?.format) params.set("format", options.format);

    const queryString = params.toString();
    return this.request<QRCodePngResponse | QRCodeSvgResponse>(
      `/api/link/${id}/qrcode${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getQRCodePng(id: string, options?: Omit<QRCodeOptions, "format">): Promise<QRCodePngResponse> {
    return this.getQRCode(id, { ...options, format: QRCodeFormat.PNG }) as Promise<QRCodePngResponse>;
  }

  async getQRCodeSvg(id: string, options?: Omit<QRCodeOptions, "format">): Promise<QRCodeSvgResponse> {
    return this.getQRCode(id, { ...options, format: QRCodeFormat.SVG }) as Promise<QRCodeSvgResponse>;
  }

  // ─── Smart Routing (Link Rules) ───

  async getLinkRules(linkId: string): Promise<LinkRule[]> {
    return this.request<LinkRule[]>(`/api/link/${linkId}/rules`);
  }

  async createLinkRule(linkId: string, data: CreateLinkRuleDto): Promise<LinkRule> {
    return this.request<LinkRule>(`/api/link/${linkId}/rules`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLinkRule(linkId: string, ruleId: string, data: UpdateLinkRuleDto): Promise<LinkRule> {
    return this.request<LinkRule>(`/api/link/${linkId}/rules/${ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLinkRule(linkId: string, ruleId: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/api/link/${linkId}/rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  async reorderLinkRules(linkId: string, ruleIds: string[]): Promise<LinkRule[]> {
    return this.request<LinkRule[]>(`/api/link/${linkId}/rules/reorder`, {
      method: "PUT",
      body: JSON.stringify({ ruleIds }),
    });
  }

  // ─── Webhooks ───

  async getWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>("/api/manager/webhook");
  }

  async getWebhookById(id: string): Promise<Webhook> {
    return this.request<Webhook>(`/api/manager/webhook/${id}`);
  }

  async createWebhook(data: CreateWebhookDto): Promise<WebhookWithSecret> {
    return this.request<WebhookWithSecret>("/api/manager/webhook", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(id: string, data: UpdateWebhookDto): Promise<Webhook> {
    return this.request<Webhook>(`/api/manager/webhook/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/api/manager/webhook/${id}`, {
      method: "DELETE",
    });
  }

  async enableWebhook(id: string): Promise<Webhook> {
    return this.request<Webhook>(`/api/manager/webhook/${id}/enable`, {
      method: "POST",
    });
  }

  async disableWebhook(id: string): Promise<Webhook> {
    return this.request<Webhook>(`/api/manager/webhook/${id}/disable`, {
      method: "POST",
    });
  }

  async testWebhook(id: string): Promise<TestWebhookResult> {
    return this.request<TestWebhookResult>(`/api/manager/webhook/${id}/test`, {
      method: "POST",
    });
  }

  async regenerateWebhookSecret(id: string): Promise<WebhookWithSecret> {
    return this.request<WebhookWithSecret>(`/api/manager/webhook/${id}/regenerate-secret`, {
      method: "POST",
    });
  }

  async getWebhookSecret(id: string): Promise<{ secret: string }> {
    return this.request<{ secret: string }>(`/api/manager/webhook/${id}/secret`);
  }

  async getWebhookLogs(id: string, page = 1, limit = 20, success?: boolean): Promise<PaginatedResponse<WebhookLog>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: Math.min(limit, 100).toString(),
    });
    if (success !== undefined) params.set("success", success.toString());
    return this.request<PaginatedResponse<WebhookLog>>(`/api/manager/webhook/${id}/logs?${params}`);
  }

  async getWebhookStats(): Promise<WebhookStats> {
    return this.request<WebhookStats>("/api/manager/webhook/stats");
  }

  // ─── Pixel Presets ───

  async listPixelPresets(): Promise<PixelPreset[]> {
    return this.request<PixelPreset[]>("/api/manager/pixel-preset");
  }

  async getPixelPreset(id: string): Promise<PixelPreset> {
    return this.request<PixelPreset>(`/api/manager/pixel-preset/${id}`);
  }

  async createPixelPreset(data: CreatePixelPresetDto): Promise<PixelPreset> {
    return this.request<PixelPreset>("/api/manager/pixel-preset", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePixelPreset(id: string, data: UpdatePixelPresetDto): Promise<PixelPreset> {
    return this.request<PixelPreset>(`/api/manager/pixel-preset/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePixelPreset(id: string): Promise<void> {
    await this.request<void>(`/api/manager/pixel-preset/${id}`, {
      method: "DELETE",
    });
  }

  // ─── Custom Domains ───

  async listDomains(): Promise<CustomDomain[]> {
    return this.request<CustomDomain[]>("/api/domains");
  }

  async getDomain(id: string): Promise<CustomDomain> {
    return this.request<CustomDomain>(`/api/domains/${id}`);
  }

  async createDomain(data: CreateCustomDomainDto): Promise<CustomDomain> {
    return this.request<CustomDomain>("/api/domains", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyDomain(id: string): Promise<CustomDomain> {
    return this.request<CustomDomain>(`/api/domains/${id}/verify`, {
      method: "POST",
    });
  }

  async changeDomainVerificationMethod(id: string, method: VerificationMethod): Promise<CustomDomain> {
    return this.request<CustomDomain>(`/api/domains/${id}/verification-method`, {
      method: "PATCH",
      body: JSON.stringify({ method }),
    });
  }

  async deleteDomain(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/domains/${id}`, {
      method: "DELETE",
    });
  }

  // ─── Bio Pages (Multi Link-in-Bio) ───

  async listBioPages(): Promise<BioPageSummary[]> {
    return this.request<BioPageSummary[]>("/api/manager/profile/bio-pages");
  }

  async getBioPage(id: string): Promise<BioPage> {
    return this.request<BioPage>(`/api/manager/profile/bio-pages/${id}`);
  }

  async createBioPage(data: CreateBioPageDto): Promise<BioPage> {
    return this.request<BioPage>("/api/manager/profile/bio-pages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBioPage(id: string, data: UpdateBioPageDto): Promise<BioPage> {
    return this.request<BioPage>(`/api/manager/profile/bio-pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteBioPage(id: string): Promise<void> {
    await this.request<void>(`/api/manager/profile/bio-pages/${id}`, {
      method: "DELETE",
    });
  }

  async setBioPageAsDefault(id: string): Promise<BioPage> {
    return this.request<BioPage>(`/api/manager/profile/bio-pages/${id}/set-default`, {
      method: "PATCH",
    });
  }

  async attachCustomDomainToBioPage(id: string, data: AttachCustomDomainToBioPageDto): Promise<BioPage> {
    return this.request<BioPage>(`/api/manager/profile/bio-pages/${id}/custom-domain`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export function createHoulaClient(config: HoulaConfig): HoulaClient {
  return new HoulaClient(config);
}
