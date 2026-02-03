import { HoulaConfig, createConfig } from "./config";
import {
  Link,
  CreateLinkDto,
  UpdateLinkDto,
  PaginatedResponse,
  LinkWithQRCodeResponse,
  CheckAvailabilityResponse,
  DeleteLinkResponse,
  QRCodeOptions,
  QRCodePngResponse,
  QRCodeSvgResponse,
  QRCodeFormat,
  LinkCreatedType,
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
    return this.request<Link>(`/api/link/by-id/${id}`);
  }

  async getLinkByKey(key: string): Promise<Link> {
    return this.request<Link>(`/api/link/${key}`);
  }

  async checkAvailability(key: string): Promise<CheckAvailabilityResponse> {
    const response = await fetch(`${this.baseUrl}/${key}/availability`);
    return response.json();
  }

  async createLink(data: CreateLinkDto, source: LinkCreatedType = LinkCreatedType.API): Promise<LinkWithQRCodeResponse> {
    return this.request<LinkWithQRCodeResponse>("/api/link", {
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

  async getQRCode(key: string, options?: QRCodeOptions): Promise<QRCodePngResponse | QRCodeSvgResponse> {
    const params = new URLSearchParams();
    if (options?.width) params.set("width", options.width.toString());
    if (options?.margin !== undefined) params.set("margin", options.margin.toString());
    if (options?.darkColor) params.set("darkColor", options.darkColor);
    if (options?.lightColor) params.set("lightColor", options.lightColor);
    if (options?.errorCorrectionLevel) params.set("errorCorrectionLevel", options.errorCorrectionLevel);
    if (options?.format) params.set("format", options.format);

    const queryString = params.toString();
    const url = `${this.baseUrl}/${key}/qrcode${queryString ? `?${queryString}` : ""}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to generate QR code: ${response.statusText}`);
    }
    return response.json();
  }

  async getQRCodePng(key: string, options?: Omit<QRCodeOptions, "format">): Promise<QRCodePngResponse> {
    return this.getQRCode(key, { ...options, format: QRCodeFormat.PNG }) as Promise<QRCodePngResponse>;
  }

  async getQRCodeSvg(key: string, options?: Omit<QRCodeOptions, "format">): Promise<QRCodeSvgResponse> {
    return this.getQRCode(key, { ...options, format: QRCodeFormat.SVG }) as Promise<QRCodeSvgResponse>;
  }
}

export function createHoulaClient(config: HoulaConfig): HoulaClient {
  return new HoulaClient(config);
}
