import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HoulaClient, createHoulaClient } from "../client";
import {
  QRCodeFormat,
  QRCodeErrorCorrectionLevel,
  LinkCreatedType,
  EphemeralDuration,
  LinkStatus,
  LinkHealthStatus,
  Link,
  WebhookEvent,
  Webhook,
  WebhookWithSecret,
  PixelPreset,
  CustomDomain,
  CustomDomainStatus,
  VerificationMethod,
} from "../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("HoulaClient", () => {
  const mockConfig = {
    apiKey: "houla_sk_test_key_12345678901234567890",
    apiUrl: "https://api.test.com",
    timeout: 5000,
  };

  let client: HoulaClient;

  const createMockLink = (overrides: Partial<Link> = {}): Link => ({
    id: "test-uuid-123",
    key: "abc123",
    url: "https://example.com",
    shortUrl: "https://hou.la/abc123",
    flashUrl: "https://hou.la/abc123/f",
    title: "Test Link",
    createdAt: new Date().toISOString(),
    hitsCount: 0,
    flashsCount: 0,
    createdByType: LinkCreatedType.API,
    utm: false,
    status: LinkStatus.ACTIVE,
    healthStatus: LinkHealthStatus.UNKNOWN,
    ...overrides,
  });

  beforeEach(() => {
    client = new HoulaClient(mockConfig);
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Constructor Tests ====================
  describe("constructor", () => {
    it("should create client with valid config", () => {
      expect(client).toBeInstanceOf(HoulaClient);
    });

    it("should throw error for missing API key", () => {
      expect(() => new HoulaClient({ apiKey: "" })).toThrow("apiKey is required");
    });

    it("should throw error for invalid API key format", () => {
      expect(() => new HoulaClient({ apiKey: "invalid_key" })).toThrow("Invalid API key format");
    });

    it("should throw error for API key without proper prefix", () => {
      expect(() => new HoulaClient({ apiKey: "sk_test_12345678901234567890123456" })).toThrow(
        "Invalid API key format"
      );
    });

    it("should accept both live and test API keys", () => {
      const liveClient = new HoulaClient({ apiKey: "houla_sk_live_key_12345678901234567890" });
      const testClient = new HoulaClient({ apiKey: "houla_sk_test_key_12345678901234567890" });
      expect(liveClient).toBeInstanceOf(HoulaClient);
      expect(testClient).toBeInstanceOf(HoulaClient);
    });

    it("should use default values when not provided", () => {
      const minimalClient = new HoulaClient({ apiKey: "houla_sk_test_key_12345678901234567890" });
      expect(minimalClient).toBeInstanceOf(HoulaClient);
    });

    it("should use custom apiUrl when provided", async () => {
      const customClient = new HoulaClient({
        apiKey: "houla_sk_test_key_12345678901234567890",
        apiUrl: "https://custom-api.example.com",
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
      });
      await customClient.getLinks();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://custom-api.example.com"),
        expect.any(Object)
      );
    });
  });

  // ==================== Factory Function Test ====================
  describe("createHoulaClient", () => {
    it("should create client using factory function", () => {
      const factoryClient = createHoulaClient(mockConfig);
      expect(factoryClient).toBeInstanceOf(HoulaClient);
    });
  });

  // ==================== getLinks Tests ====================
  describe("getLinks", () => {
    it("should fetch links with default pagination", async () => {
      const mockResponse = {
        data: [createMockLink()],
        total: 1,
        page: 1,
        pageCount: 1,
        count: 1,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getLinks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link?page=1&limit=20"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": mockConfig.apiKey,
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch links with custom pagination", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 3, pageCount: 5, count: 0 }),
      });

      await client.getLinks(3, 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=3&limit=50"),
        expect.any(Object)
      );
    });

    it("should cap limit at 100", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
      });

      await client.getLinks(1, 200);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=100"),
        expect.any(Object)
      );
    });

    it("should handle empty response", async () => {
      const emptyResponse = { data: [], total: 0, page: 1, pageCount: 0, count: 0 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      });

      const result = await client.getLinks();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ==================== getLinkById Tests ====================
  describe("getLinkById", () => {
    it("should fetch link by id", async () => {
      const mockLink = createMockLink({ id: "test-uuid-456" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.getLinkById("test-uuid-456");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/test-uuid-456"),
        expect.any(Object)
      );
      expect(result).toEqual(mockLink);
    });

    it("should return link with all properties", async () => {
      const fullLink = createMockLink({
        id: "full-uuid",
        key: "fullkey",
        url: "https://full-example.com",
        title: "Full Title",
        utm: true,
        utm_source: "test",
        utm_medium: "email",
        utm_campaign: "campaign1",
        isEphemeral: true,
        ephemeralDuration: EphemeralDuration.HOURS_24,
        expiresAt: new Date().toISOString(),
        hitsCount: 150,
        flashsCount: 25,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fullLink),
      });

      const result = await client.getLinkById("full-uuid");
      expect(result.utm).toBe(true);
      expect(result.utm_source).toBe("test");
      expect(result.isEphemeral).toBe(true);
      expect(result.hitsCount).toBe(150);
    });
  });

  // ==================== getLinkByKey Tests ====================
  describe("getLinkByKey", () => {
    it("should fetch link by key", async () => {
      const mockLink = createMockLink({ key: "my-custom-key" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.getLinkByKey("my-custom-key");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/my-custom-key"),
        expect.any(Object)
      );
      expect(result.key).toBe("my-custom-key");
    });
  });

  // ==================== checkAvailability Tests ====================
  describe("checkAvailability", () => {
    it("should return available true for available key", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      });

      const result = await client.checkAvailability("new-key");
      expect(result.available).toBe(true);
    });

    it("should return available false for taken key", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: false }),
      });

      const result = await client.checkAvailability("existing-key");
      expect(result.available).toBe(false);
    });

    it("should call correct endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      });

      await client.checkAvailability("check-this-key");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/check-this-key/availability")
      );
    });
  });

  // ==================== createLink Tests ====================
  describe("createLink", () => {
    it("should create link with minimal data", async () => {
      const mockLink = createMockLink();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({ url: "https://example.com" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ url: "https://example.com" }),
        })
      );
      expect(result).toEqual(mockLink);
    });

    it("should return shortUrl and flashUrl in response", async () => {
      const mockLink = createMockLink({
        key: "test-key",
        shortUrl: "https://hou.la/test-key",
        flashUrl: "https://hou.la/test-key/f",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({ url: "https://example.com" });

      expect(result.shortUrl).toBe("https://hou.la/test-key");
      expect(result.flashUrl).toBe("https://hou.la/test-key/f");
    });

    it("should create link with custom key", async () => {
      const mockLink = createMockLink({ key: "my-custom-key" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({
        url: "https://example.com",
        key: "my-custom-key",
      });

      expect(result.key).toBe("my-custom-key");
    });

    it("should create link with UTM parameters", async () => {
      const mockLink = createMockLink({
        utm: true,
        utm_source: "newsletter",
        utm_medium: "email",
        utm_campaign: "spring_sale",
        utm_term: "discount",
        utm_content: "header_link",
        utm_id: "campaign123",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({
        url: "https://example.com",
        utm: true,
        utm_source: "newsletter",
        utm_medium: "email",
        utm_campaign: "spring_sale",
        utm_term: "discount",
        utm_content: "header_link",
        utm_id: "campaign123",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"utm":true'),
        })
      );
      expect(result.utm).toBe(true);
      expect(result.utm_source).toBe("newsletter");
    });

    it("should create ephemeral link", async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const mockLink = createMockLink({
        isEphemeral: true,
        ephemeralDuration: EphemeralDuration.HOURS_24,
        expiresAt,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({
        url: "https://example.com",
        isEphemeral: true,
        ephemeralDuration: EphemeralDuration.HOURS_24,
      });

      expect(result.isEphemeral).toBe(true);
      expect(result.ephemeralDuration).toBe(EphemeralDuration.HOURS_24);
      expect(result.expiresAt).toBeDefined();
    });

    it("should send X-Source header with default API value", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockLink()),
      });

      await client.createLink({ url: "https://example.com" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Source": LinkCreatedType.API,
          }),
        })
      );
    });

    it("should send custom X-Source header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockLink({ createdByType: LinkCreatedType.EXTENSION })),
      });

      await client.createLink({ url: "https://example.com" }, LinkCreatedType.EXTENSION);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Source": LinkCreatedType.EXTENSION,
          }),
        })
      );
    });

    it("should create link with title", async () => {
      const mockLink = createMockLink({ title: "My Custom Title" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({
        url: "https://example.com",
        title: "My Custom Title",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"title":"My Custom Title"'),
        })
      );
      expect(result.title).toBe("My Custom Title");
    });
  });

  // ==================== updateLink Tests ====================
  describe("updateLink", () => {
    it("should update link URL", async () => {
      const mockLink = createMockLink({ url: "https://new-url.com" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.updateLink("test-id", { url: "https://new-url.com" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/test-id"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ url: "https://new-url.com" }),
        })
      );
      expect(result.url).toBe("https://new-url.com");
    });

    it("should update link key", async () => {
      const mockLink = createMockLink({ key: "new-key-456" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.updateLink("test-id", { key: "new-key-456" });
      expect(result.key).toBe("new-key-456");
    });

    it("should update link title", async () => {
      const mockLink = createMockLink({ title: "Updated Title" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.updateLink("test-id", { title: "Updated Title" });
      expect(result.title).toBe("Updated Title");
    });

    it("should update UTM parameters", async () => {
      const mockLink = createMockLink({
        utm: true,
        utm_source: "updated_source",
        utm_campaign: "new_campaign",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.updateLink("test-id", {
        utm: true,
        utm_source: "updated_source",
        utm_campaign: "new_campaign",
      });

      expect(result.utm).toBe(true);
      expect(result.utm_source).toBe("updated_source");
    });

    it("should enable ephemeral on existing link", async () => {
      const mockLink = createMockLink({
        isEphemeral: true,
        ephemeralDuration: EphemeralDuration.HOURS_6,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.updateLink("test-id", {
        isEphemeral: true,
        ephemeralDuration: EphemeralDuration.HOURS_6,
      });

      expect(result.isEphemeral).toBe(true);
      expect(result.ephemeralDuration).toBe(EphemeralDuration.HOURS_6);
    });
  });

  // ==================== deleteLink Tests ====================
  describe("deleteLink", () => {
    it("should delete link successfully", async () => {
      const mockResponse = { success: true, message: "Link deleted" };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.deleteLink("test-id");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/test-id"),
        expect.objectContaining({ method: "DELETE" })
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe("Link deleted");
    });

    it("should include API key header in delete request", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, message: "Deleted" }),
      });

      await client.deleteLink("delete-me");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": mockConfig.apiKey,
          }),
        })
      );
    });
  });

  // ==================== getQRCode Tests ====================
  describe("getQRCode", () => {
    it("should generate QR code with default options", async () => {
      const mockResponse = { base64: "abc123", dataUrl: "data:image/png;base64,abc123" };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getQRCode("test-uuid-123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/test-uuid-123\/qrcode$/),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include width option in URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("test-uuid-123", { width: 400 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("width=400"),
        expect.any(Object)
      );
    });

    it("should include margin option in URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("test-uuid-123", { margin: 2 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("margin=2"),
        expect.any(Object)
      );
    });

    it("should include all QR code options", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("test-uuid-123", {
        width: 300,
        margin: 2,
        darkColor: "#000000",
        lightColor: "#FFFFFF",
        errorCorrectionLevel: QRCodeErrorCorrectionLevel.H,
        format: QRCodeFormat.PNG,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("width=300");
      expect(calledUrl).toContain("margin=2");
      expect(calledUrl).toContain("darkColor=");
      expect(calledUrl).toContain("lightColor=");
      expect(calledUrl).toContain("errorCorrectionLevel=H");
      expect(calledUrl).toContain("format=png");
    });

    it("should handle QR code generation error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Link not found" }),
      });

      await expect(client.getQRCode("invalid-id")).rejects.toThrow(
        "Link not found"
      );
    });
  });

  // ==================== getQRCodePng Tests ====================
  describe("getQRCodePng", () => {
    it("should generate PNG QR code", async () => {
      const mockResponse = { base64: "pngdata", dataUrl: "data:image/png;base64,pngdata" };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getQRCodePng("test-uuid-123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("format=png"),
        expect.any(Object)
      );
      expect(result.base64).toBe("pngdata");
      expect(result.dataUrl).toContain("image/png");
    });

    it("should generate PNG with custom size", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCodePng("test-uuid-123", { width: 512, margin: 4 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("width=512");
      expect(calledUrl).toContain("margin=4");
      expect(calledUrl).toContain("format=png");
    });
  });

  // ==================== getQRCodeSvg Tests ====================
  describe("getQRCodeSvg", () => {
    it("should generate SVG QR code", async () => {
      const mockResponse = { svg: "<svg>...</svg>" };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getQRCodeSvg("test-uuid-123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("format=svg"),
        expect.any(Object)
      );
      expect(result.svg).toBe("<svg>...</svg>");
    });

    it("should generate SVG with custom colors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ svg: "<svg>...</svg>" }),
      });

      await client.getQRCodeSvg("test-uuid-123", {
        darkColor: "#FF0000",
        lightColor: "#00FF00",
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("format=svg");
      expect(calledUrl).toContain("darkColor=");
      expect(calledUrl).toContain("lightColor=");
    });
  });

  // ==================== Error Handling Tests ====================
  describe("error handling", () => {
    it("should throw error on 401 Unauthorized", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({ message: "Invalid API key" }),
      });

      await expect(client.getLinks()).rejects.toThrow("Invalid API key");
    });

    it("should throw error on 403 Forbidden", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () => Promise.resolve({ message: "Access denied" }),
      });

      await expect(client.getLinkById("some-id")).rejects.toThrow("Access denied");
    });

    it("should throw error on 404 Not Found", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "Link not found" }),
      });

      await expect(client.getLinkById("non-existent")).rejects.toThrow("Link not found");
    });

    it("should throw error on 409 Conflict (duplicate key)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: () => Promise.resolve({ message: "Key already exists" }),
      });

      await expect(
        client.createLink({ url: "https://example.com", key: "taken-key" })
      ).rejects.toThrow("Key already exists");
    });

    it("should throw error on 400 Bad Request", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ message: "Invalid URL format" }),
      });

      await expect(client.createLink({ url: "not-a-url" })).rejects.toThrow("Invalid URL format");
    });

    it("should throw error on 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ message: "Server error" }),
      });

      await expect(client.getLinks()).rejects.toThrow("Server error");
    });

    it("should handle error response without message", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(client.getLinks()).rejects.toThrow("Internal Server Error");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(client.getLinks()).rejects.toThrow("Network error");
    });

    it("should handle timeout errors", async () => {
      mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));

      await expect(client.getLinks()).rejects.toThrow();
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      });

      await expect(client.getLinks()).rejects.toThrow();
    });
  });

  // ==================== Request Headers Tests ====================
  describe("request headers", () => {
    it("should include X-API-Key header in all requests", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
      });

      await client.getLinks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": mockConfig.apiKey,
          }),
        })
      );
    });

    it("should include Content-Type header in all requests", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockLink()),
      });

      await client.createLink({ url: "https://example.com" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  // ==================== Edge Cases ====================
  describe("edge cases", () => {
    it("should handle link with special characters in key", async () => {
      const mockLink = createMockLink({ key: "test-key_123" });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.getLinkByKey("test-key_123");
      expect(result.key).toBe("test-key_123");
    });

    it("should handle very long URL", async () => {
      const longUrl = "https://example.com/" + "a".repeat(2000);
      const mockLink = createMockLink({ url: longUrl });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({ url: longUrl });
      expect(result.url).toBe(longUrl);
    });

    it("should handle URL with query parameters", async () => {
      const urlWithParams = "https://example.com?foo=bar&baz=qux";
      const mockLink = createMockLink({ url: urlWithParams });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({ url: urlWithParams });
      expect(result.url).toBe(urlWithParams);
    });

    it("should handle URL with unicode characters", async () => {
      const unicodeUrl = "https://example.com/日本語";
      const mockLink = createMockLink({ url: unicodeUrl });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.createLink({ url: unicodeUrl });
      expect(result.url).toBe(unicodeUrl);
    });

    it("should handle pagination with page 0 (should default to 1)", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
      });

      await client.getLinks(0, 20);

      // The SDK should pass 0, server handles defaults
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=0"),
        expect.any(Object)
      );
    });
  });

  // ==================== Password-Protected Links ====================
  describe("password-protected links", () => {
    it("should create a password-protected link", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({
        url: "https://example.com",
        isPasswordProtected: true,
        password: "my-secret-pass",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"isPasswordProtected":true'),
        })
      );
      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.isPasswordProtected).toBe(true);
      expect(body.password).toBe("my-secret-pass");
    });

    it("should create a link without password when not specified", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({ url: "https://example.com" });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.isPasswordProtected).toBeUndefined();
      expect(body.password).toBeUndefined();
    });
  });

  // ==================== Retargeting Pixels ====================
  describe("retargeting pixels", () => {
    it("should create a link with Facebook Pixel", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({
        url: "https://example.com",
        fbPixelId: "1234567890123456",
      });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.fbPixelId).toBe("1234567890123456");
    });

    it("should create a link with Google Tag", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({
        url: "https://example.com",
        googleTagId: "G-ABC123XYZ",
      });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.googleTagId).toBe("G-ABC123XYZ");
    });

    it("should create a link with TikTok Pixel", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({
        url: "https://example.com",
        tiktokPixelId: "CABCDEF12345678901",
      });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.tiktokPixelId).toBe("CABCDEF12345678901");
    });

    it("should create a link with all three pixels", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({
        url: "https://example.com",
        fbPixelId: "9876543210123456",
        googleTagId: "AW-123456789",
        tiktokPixelId: "CXYZ1234567890ABC",
      });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.fbPixelId).toBe("9876543210123456");
      expect(body.googleTagId).toBe("AW-123456789");
      expect(body.tiktokPixelId).toBe("CXYZ1234567890ABC");
    });

    it("should not include pixel fields when not specified", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.createLink({ url: "https://example.com" });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.fbPixelId).toBeUndefined();
      expect(body.googleTagId).toBeUndefined();
      expect(body.tiktokPixelId).toBeUndefined();
    });

    it("should update a link to add pixels", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.updateLink("test-link-id", {
        fbPixelId: "1111111111111111",
        googleTagId: "G-UPDATED123",
      });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.fbPixelId).toBe("1111111111111111");
      expect(body.googleTagId).toBe("G-UPDATED123");
    });

    it("should update a link to remove pixels with null", async () => {
      const mockLink = createMockLink();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      await client.updateLink("test-link-id", {
        fbPixelId: null,
      });

      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.fbPixelId).toBeNull();
    });
  });

  // ==================== Smart Routing (Link Rules) ====================
  describe("smart routing rules", () => {
    const linkId = "test-link-uuid-123";

    it("should get link rules", async () => {
      const mockRules = [
        {
          id: "rule-1", linkId, priority: 1, label: "Rule 1",
          destinationUrl: "https://example.com/a", matchType: "all",
          isActive: true, weight: 0, conditions: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRules),
      });

      const rules = await client.getLinkRules(linkId);
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("rule-1");
    });

    it("should create a conditional rule", async () => {
      const mockRule = {
        id: "rule-new", linkId, priority: 1, label: "FR rule",
        destinationUrl: "https://example.com/fr", matchType: "all",
        isActive: true, weight: 0,
        conditions: [{ id: "cond-1", field: "country", operator: "equals", value: "FR" }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRule),
      });

      const result = await client.createLinkRule(linkId, {
        label: "FR rule",
        destinationUrl: "https://example.com/fr",
        matchType: "all",
        conditions: [{ field: "country", operator: "equals", value: "FR" }],
      });

      expect(result.id).toBe("rule-new");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/link/${linkId}/rules`),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should create an A/B testing variant with weight", async () => {
      const mockRule = {
        id: "ab-1", linkId, priority: 1, label: "Variante A",
        destinationUrl: "https://example.com/a", matchType: "all",
        isActive: true, weight: 50, conditions: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRule),
      });

      const result = await client.createLinkRule(linkId, {
        label: "Variante A",
        destinationUrl: "https://example.com/a",
        weight: 50,
        conditions: [],
      });

      expect(result.weight).toBe(50);
      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.weight).toBe(50);
    });

    it("should update a rule with new weight", async () => {
      const mockRule = {
        id: "ab-1", linkId, priority: 1, label: "Variante A",
        destinationUrl: "https://example.com/a", matchType: "all",
        isActive: true, weight: 70, conditions: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRule),
      });

      const result = await client.updateLinkRule(linkId, "ab-1", { weight: 70 });

      expect(result.weight).toBe(70);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/link/${linkId}/rules/ab-1`),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should create rule with matchType any (OR logic)", async () => {
      const mockRule = {
        id: "or-rule", linkId, priority: 1, label: "OR Rule",
        destinationUrl: "https://example.com/or", matchType: "any",
        isActive: true, weight: 0,
        conditions: [
          { id: "c1", field: "country", operator: "equals", value: "FR" },
          { id: "c2", field: "country", operator: "equals", value: "BE" },
        ],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRule),
      });

      const result = await client.createLinkRule(linkId, {
        label: "OR Rule",
        destinationUrl: "https://example.com/or",
        matchType: "any",
        conditions: [
          { field: "country", operator: "equals", value: "FR" },
          { field: "country", operator: "equals", value: "BE" },
        ],
      });

      expect(result.matchType).toBe("any");
      expect(result.conditions).toHaveLength(2);
    });

    it("should delete a rule", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      });

      const result = await client.deleteLinkRule(linkId, "rule-1");

      expect(result.deleted).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/link/${linkId}/rules/rule-1`),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should reorder rules", async () => {
      const mockRules = [
        { id: "rule-2", priority: 1 },
        { id: "rule-1", priority: 2 },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRules),
      });

      await client.reorderLinkRules(linkId, ["rule-2", "rule-1"]);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/link/${linkId}/rules/reorder`),
        expect.objectContaining({ method: "PUT" })
      );
      const body = JSON.parse(
        (mockFetch.mock.calls[0][1] as RequestInit).body as string
      );
      expect(body.ruleIds).toEqual(["rule-2", "rule-1"]);
    });
  });

  // ==================== Webhook Tests ====================
  describe("Webhooks", () => {
    const createMockWebhook = (overrides: Partial<Webhook> = {}): Webhook => ({
      id: "wh-uuid-123",
      name: "Test Webhook",
      url: "https://example.com/webhook",
      events: [WebhookEvent.LINK_CLICKED, WebhookEvent.LINK_CREATED],
      enabled: true,
      consecutiveFailures: 0,
      batchSize: 1,
      batchDelayMs: 0,
      samplingRate: 100,
      anonymizeIp: false,
      excludeGeoCity: false,
      totalDelivered: 42,
      totalFailed: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    });

    describe("getWebhooks", () => {
      it("should fetch all webhooks", async () => {
        const mockWebhooks = [createMockWebhook()];
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWebhooks),
        });

        const result = await client.getWebhooks();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook"),
          expect.objectContaining({
            headers: expect.objectContaining({ "X-API-Key": mockConfig.apiKey }),
          })
        );
        expect(result).toEqual(mockWebhooks);
      });
    });

    describe("getWebhookById", () => {
      it("should fetch a webhook by ID", async () => {
        const mockWebhook = createMockWebhook();
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWebhook),
        });

        const result = await client.getWebhookById("wh-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123"),
          expect.any(Object)
        );
        expect(result).toEqual(mockWebhook);
      });
    });

    describe("createWebhook", () => {
      it("should create a webhook and return secret", async () => {
        const mockResponse: WebhookWithSecret = {
          ...createMockWebhook(),
          secret: "whsec_abcdef123456",
        };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.createWebhook({
          name: "Test Webhook",
          url: "https://example.com/webhook",
          events: [WebhookEvent.LINK_CLICKED],
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook"),
          expect.objectContaining({ method: "POST" })
        );
        expect(result.secret).toBe("whsec_abcdef123456");
      });
    });

    describe("updateWebhook", () => {
      it("should update a webhook", async () => {
        const mockResponse = createMockWebhook({ name: "Updated" });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await client.updateWebhook("wh-uuid-123", { name: "Updated" });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123"),
          expect.objectContaining({ method: "PATCH" })
        );
      });
    });

    describe("deleteWebhook", () => {
      it("should delete a webhook", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ deleted: true }),
        });

        const result = await client.deleteWebhook("wh-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123"),
          expect.objectContaining({ method: "DELETE" })
        );
        expect(result.deleted).toBe(true);
      });
    });

    describe("enableWebhook", () => {
      it("should enable a webhook", async () => {
        const mockResponse = createMockWebhook({ enabled: true });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.enableWebhook("wh-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123/enable"),
          expect.objectContaining({ method: "POST" })
        );
        expect(result.enabled).toBe(true);
      });
    });

    describe("disableWebhook", () => {
      it("should disable a webhook", async () => {
        const mockResponse = createMockWebhook({ enabled: false });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.disableWebhook("wh-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123/disable"),
          expect.objectContaining({ method: "POST" })
        );
        expect(result.enabled).toBe(false);
      });
    });

    describe("testWebhook", () => {
      it("should test a webhook", async () => {
        const mockResult = { success: true, httpStatus: 200, responseTimeMs: 150 };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResult),
        });

        const result = await client.testWebhook("wh-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123/test"),
          expect.objectContaining({ method: "POST" })
        );
        expect(result.success).toBe(true);
        expect(result.httpStatus).toBe(200);
      });
    });

    describe("regenerateWebhookSecret", () => {
      it("should regenerate the webhook secret", async () => {
        const mockResponse: WebhookWithSecret = {
          ...createMockWebhook(),
          secret: "whsec_new_secret_456",
        };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.regenerateWebhookSecret("wh-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123/regenerate-secret"),
          expect.objectContaining({ method: "POST" })
        );
        expect(result.secret).toBe("whsec_new_secret_456");
      });
    });

    describe("getWebhookSecret", () => {
      it("should get the webhook secret", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ secret: "whsec_my_secret" }),
        });

        const result = await client.getWebhookSecret("wh-uuid-123");

        expect(result.secret).toBe("whsec_my_secret");
      });
    });

    describe("getWebhookLogs", () => {
      it("should fetch webhook logs with pagination", async () => {
        const mockResponse = {
          data: [{ id: "log-1", event: WebhookEvent.LINK_CLICKED, success: true }],
          total: 1,
          page: 1,
          pageCount: 1,
          count: 1,
        };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.getWebhookLogs("wh-uuid-123", 1, 20);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/wh-uuid-123/logs?page=1&limit=20"),
          expect.any(Object)
        );
        expect(result.data).toHaveLength(1);
      });

      it("should filter logs by success status", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
        });

        await client.getWebhookLogs("wh-uuid-123", 1, 20, false);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("success=false"),
          expect.any(Object)
        );
      });
    });

    describe("getWebhookStats", () => {
      it("should fetch webhook stats", async () => {
        const mockStats = {
          totalWebhooks: 5,
          activeWebhooks: 3,
          disabledWebhooks: 2,
          totalDelivered24h: 100,
          totalFailed24h: 5,
          successRate: 95.24,
        };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockStats),
        });

        const result = await client.getWebhookStats();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/webhook/stats"),
          expect.any(Object)
        );
        expect(result.totalWebhooks).toBe(5);
      });
    });
  });

  // ==================== Pixel Preset Tests ====================
  describe("Pixel Presets", () => {
    const createMockPreset = (overrides: Partial<PixelPreset> = {}): PixelPreset => ({
      id: "pp-uuid-123",
      name: "Test Preset",
      isDefault: false,
      fbPixelId: "1234567890",
      googleTagId: "G-XXXXXXXXXX",
      tiktokPixelId: "C1234567890123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    });

    describe("listPixelPresets", () => {
      it("should fetch all pixel presets", async () => {
        const mockPresets = [createMockPreset(), createMockPreset({ id: "pp-uuid-456", name: "Preset 2" })];
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockPresets),
        });

        const result = await client.listPixelPresets();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/pixel-preset"),
          expect.objectContaining({
            headers: expect.objectContaining({ "X-API-Key": mockConfig.apiKey }),
          })
        );
        expect(result).toEqual(mockPresets);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no presets exist", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        });

        const result = await client.listPixelPresets();

        expect(result).toEqual([]);
      });
    });

    describe("getPixelPreset", () => {
      it("should fetch a preset by ID", async () => {
        const mockPreset = createMockPreset();
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockPreset),
        });

        const result = await client.getPixelPreset("pp-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/pixel-preset/pp-uuid-123"),
          expect.any(Object)
        );
        expect(result).toEqual(mockPreset);
      });

      it("should handle 404 for non-existent preset", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: () => Promise.resolve({ message: "Preset non trouvé" }),
        });

        await expect(client.getPixelPreset("non-existent")).rejects.toThrow();
      });
    });

    describe("createPixelPreset", () => {
      it("should create a preset with all pixels", async () => {
        const mockPreset = createMockPreset({ isDefault: true });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockPreset),
        });

        const result = await client.createPixelPreset({
          name: "Test Preset",
          isDefault: true,
          fbPixelId: "1234567890",
          googleTagId: "G-XXXXXXXXXX",
          tiktokPixelId: "C1234567890123",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/pixel-preset"),
          expect.objectContaining({ method: "POST" })
        );
        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.name).toBe("Test Preset");
        expect(body.fbPixelId).toBe("1234567890");
        expect(body.googleTagId).toBe("G-XXXXXXXXXX");
        expect(body.tiktokPixelId).toBe("C1234567890123");
        expect(body.isDefault).toBe(true);
        expect(result).toEqual(mockPreset);
      });

      it("should create a preset with only one pixel", async () => {
        const mockPreset = createMockPreset({
          googleTagId: undefined,
          tiktokPixelId: undefined,
        });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockPreset),
        });

        await client.createPixelPreset({
          name: "Facebook only",
          fbPixelId: "1234567890",
        });

        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.name).toBe("Facebook only");
        expect(body.fbPixelId).toBe("1234567890");
        expect(body.googleTagId).toBeUndefined();
      });
    });

    describe("updatePixelPreset", () => {
      it("should update a preset", async () => {
        const mockResponse = createMockPreset({ name: "Updated Preset" });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await client.updatePixelPreset("pp-uuid-123", { name: "Updated Preset" });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/pixel-preset/pp-uuid-123"),
          expect.objectContaining({ method: "PATCH" })
        );
        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.name).toBe("Updated Preset");
      });

      it("should update isDefault to true", async () => {
        const mockResponse = createMockPreset({ isDefault: true });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await client.updatePixelPreset("pp-uuid-123", { isDefault: true });

        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.isDefault).toBe(true);
      });
    });

    describe("deletePixelPreset", () => {
      it("should delete a preset", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(undefined),
        });

        await client.deletePixelPreset("pp-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/manager/pixel-preset/pp-uuid-123"),
          expect.objectContaining({ method: "DELETE" })
        );
      });

      it("should handle 404 when deleting non-existent preset", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: () => Promise.resolve({ message: "Preset non trouvé" }),
        });

        await expect(client.deletePixelPreset("non-existent")).rejects.toThrow();
      });
    });
  });

  // ==================== Custom Domains Tests ====================
  describe("Custom Domains", () => {
    const createMockDomain = (overrides: Partial<CustomDomain> = {}): CustomDomain => ({
      id: "dom-uuid-123",
      domain: "links.mysite.com",
      status: CustomDomainStatus.PENDING,
      verificationToken: "houla-verify-abc123def456",
      verificationMethod: VerificationMethod.CNAME,
      dnsVerified: false,
      sslConfigured: false,
      isActive: false,
      cnameTarget: "custom.hou.la",
      txtRecordName: "_houla-verify.links.mysite.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    });

    describe("listDomains", () => {
      it("should list all domains", async () => {
        const mockDomains = [createMockDomain(), createMockDomain({ id: "dom-uuid-456", domain: "go.example.com" })];
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomains),
        });

        const result = await client.listDomains();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/domains"),
          expect.any(Object)
        );
        expect(result).toHaveLength(2);
      });

      it("should return empty array when no domains", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        });

        const result = await client.listDomains();
        expect(result).toEqual([]);
      });
    });

    describe("getDomain", () => {
      it("should get a domain by id", async () => {
        const mockDomain = createMockDomain();
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomain),
        });

        const result = await client.getDomain("dom-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/domains/dom-uuid-123"),
          expect.any(Object)
        );
        expect(result.domain).toBe("links.mysite.com");
      });

      it("should handle 404 for non-existent domain", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: () => Promise.resolve({ message: "Domain not found" }),
        });

        await expect(client.getDomain("non-existent")).rejects.toThrow();
      });
    });

    describe("createDomain", () => {
      it("should create a domain", async () => {
        const mockDomain = createMockDomain();
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomain),
        });

        const result = await client.createDomain({ domain: "links.mysite.com" });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/domains"),
          expect.objectContaining({ method: "POST" })
        );
        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.domain).toBe("links.mysite.com");
        expect(result.verificationToken).toBeDefined();
        expect(result.cnameTarget).toBe("custom.hou.la");
      });

      it("should handle 403 for free plan users", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: () => Promise.resolve({ message: "Custom domains require a Pro or Business plan" }),
        });

        await expect(client.createDomain({ domain: "links.mysite.com" })).rejects.toThrow();
      });

      it("should handle 409 for duplicate domain", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 409,
          statusText: "Conflict",
          json: () => Promise.resolve({ message: "Domain already exists" }),
        });

        await expect(client.createDomain({ domain: "links.mysite.com" })).rejects.toThrow();
      });
    });

    describe("verifyDomain", () => {
      it("should verify domain DNS", async () => {
        const mockDomain = createMockDomain({
          status: CustomDomainStatus.ACTIVE,
          dnsVerified: true,
          isActive: true,
        });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomain),
        });

        const result = await client.verifyDomain("dom-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/domains/dom-uuid-123/verify"),
          expect.objectContaining({ method: "POST" })
        );
        expect(result.status).toBe(CustomDomainStatus.ACTIVE);
        expect(result.dnsVerified).toBe(true);
      });

      it("should return failed status if DNS not configured", async () => {
        const mockDomain = createMockDomain({
          status: CustomDomainStatus.FAILED,
          dnsVerified: false,
        });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomain),
        });

        const result = await client.verifyDomain("dom-uuid-123");
        expect(result.status).toBe(CustomDomainStatus.FAILED);
      });
    });

    describe("changeDomainVerificationMethod", () => {
      it("should change to TXT method", async () => {
        const mockDomain = createMockDomain({
          verificationMethod: VerificationMethod.TXT,
          dnsVerified: false,
          status: CustomDomainStatus.PENDING,
        });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomain),
        });

        const result = await client.changeDomainVerificationMethod("dom-uuid-123", VerificationMethod.TXT);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/domains/dom-uuid-123/verification-method"),
          expect.objectContaining({ method: "PATCH" })
        );
        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.method).toBe("txt");
        expect(result.verificationMethod).toBe(VerificationMethod.TXT);
      });

      it("should change to CNAME method", async () => {
        const mockDomain = createMockDomain({
          verificationMethod: VerificationMethod.CNAME,
        });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockDomain),
        });

        await client.changeDomainVerificationMethod("dom-uuid-123", VerificationMethod.CNAME);

        const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
        expect(body.method).toBe("cname");
      });
    });

    describe("deleteDomain", () => {
      it("should delete a domain", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

        const result = await client.deleteDomain("dom-uuid-123");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/domains/dom-uuid-123"),
          expect.objectContaining({ method: "DELETE" })
        );
        expect(result.success).toBe(true);
      });

      it("should handle 404 when deleting non-existent domain", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: () => Promise.resolve({ message: "Domain not found" }),
        });

        await expect(client.deleteDomain("non-existent")).rejects.toThrow();
      });
    });
  });

  // ==================== Workspaces ====================
  describe("Workspaces", () => {
    const mockWorkspace = {
      id: "ws-uuid-001",
      name: "Mon Agence",
      slug: "mon-agence",
      type: "team",
      ownerId: "user-uuid-001",
      plan: "free",
      maxMembers: 5,
      maxLinks: null,
      maxCustomDomains: 0,
      maxApiKeys: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockMember = {
      id: "member-uuid-001",
      workspaceId: "ws-uuid-001",
      userId: "user-uuid-001",
      role: "owner",
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const mockInvite = {
      id: "invite-uuid-001",
      workspaceId: "ws-uuid-001",
      email: "invited@test.com",
      role: "member",
      token: "invite-token-001",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    describe("setWorkspaceId", () => {
      it("should set workspace ID and include it in subsequent requests", async () => {
        client.setWorkspaceId("ws-uuid-001");
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
        });

        await client.getLinks();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-Workspace-Id": "ws-uuid-001",
            }),
          }),
        );
      });

      it("should not include X-Workspace-Id when cleared", async () => {
        client.setWorkspaceId("ws-uuid-001");
        client.setWorkspaceId(undefined);
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
        });

        await client.getLinks();

        const callHeaders = mockFetch.mock.calls[0][1].headers;
        expect(callHeaders["X-Workspace-Id"]).toBeUndefined();
      });
    });

    describe("listWorkspaces", () => {
      it("should list all workspaces", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([mockWorkspace]),
        });

        const result = await client.listWorkspaces();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces"),
          expect.objectContaining({ method: undefined }),
        );
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Mon Agence");
      });
    });

    describe("getWorkspace", () => {
      it("should get workspace by ID", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWorkspace),
        });

        const result = await client.getWorkspace("ws-uuid-001");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/ws-uuid-001"),
          expect.any(Object),
        );
        expect(result.id).toBe("ws-uuid-001");
      });
    });

    describe("createWorkspace", () => {
      it("should create a team workspace", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWorkspace),
        });

        const result = await client.createWorkspace({
          name: "Mon Agence",
          description: "Test workspace",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ name: "Mon Agence", description: "Test workspace" }),
          }),
        );
        expect(result.name).toBe("Mon Agence");
      });
    });

    describe("updateWorkspace", () => {
      it("should update workspace", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ...mockWorkspace, name: "Updated" }),
        });

        const result = await client.updateWorkspace("ws-uuid-001", { name: "Updated" });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/ws-uuid-001"),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ name: "Updated" }),
          }),
        );
        expect(result.name).toBe("Updated");
      });
    });

    describe("deleteWorkspace", () => {
      it("should delete workspace", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(undefined),
        });

        await client.deleteWorkspace("ws-uuid-001");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/ws-uuid-001"),
          expect.objectContaining({ method: "DELETE" }),
        );
      });
    });

    describe("listWorkspaceMembers", () => {
      it("should list members", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([mockMember]),
        });

        const result = await client.listWorkspaceMembers("ws-uuid-001");

        expect(result).toHaveLength(1);
        expect(result[0].role).toBe("owner");
      });
    });

    describe("updateMemberRole", () => {
      it("should update member role", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ...mockMember, role: "viewer" }),
        });

        const result = await client.updateMemberRole("ws-uuid-001", "member-uuid-001", {
          role: "viewer" as any,
        });

        expect(result.role).toBe("viewer");
      });
    });

    describe("removeMember", () => {
      it("should remove member", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(undefined),
        });

        await client.removeMember("ws-uuid-001", "member-uuid-001");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/ws-uuid-001/members/member-uuid-001"),
          expect.objectContaining({ method: "DELETE" }),
        );
      });
    });

    describe("transferOwnership", () => {
      it("should transfer ownership", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWorkspace),
        });

        await client.transferOwnership("ws-uuid-001", { newOwnerId: "user-uuid-002" });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/ws-uuid-001/transfer"),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ newOwnerId: "user-uuid-002" }),
          }),
        );
      });
    });

    describe("inviteMember", () => {
      it("should invite a member by email", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockInvite),
        });

        const result = await client.inviteMember("ws-uuid-001", {
          email: "invited@test.com",
          role: "member" as any,
        });

        expect(result.email).toBe("invited@test.com");
        expect(result.role).toBe("member");
      });
    });

    describe("listInvites", () => {
      it("should list pending invites", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([mockInvite]),
        });

        const result = await client.listInvites("ws-uuid-001");

        expect(result).toHaveLength(1);
      });
    });

    describe("cancelInvite", () => {
      it("should cancel an invite", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(undefined),
        });

        await client.cancelInvite("ws-uuid-001", "invite-uuid-001");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/ws-uuid-001/invites/invite-uuid-001"),
          expect.objectContaining({ method: "DELETE" }),
        );
      });
    });

    describe("acceptInvite", () => {
      it("should accept an invite by token", async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockMember),
        });

        const result = await client.acceptInvite("invite-token-001");

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/workspaces/invites/invite-token-001/accept"),
          expect.objectContaining({ method: "POST" }),
        );
        expect(result.workspaceId).toBe("ws-uuid-001");
      });
    });

    describe("error handling", () => {
      it("should throw on 403 (not member)", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: () => Promise.resolve({ message: "Vous n'etes pas membre de ce workspace" }),
        });

        await expect(client.getWorkspace("ws-uuid-001")).rejects.toThrow();
      });

      it("should throw on 404 (workspace not found)", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: () => Promise.resolve({ message: "Workspace non trouve" }),
        });

        await expect(client.getWorkspace("non-existent")).rejects.toThrow();
      });
    });
  });
});
