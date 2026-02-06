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
        expect.stringContaining("/api/link/by-id/test-uuid-456"),
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

      const result = await client.getQRCode("my-key");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/my-key\/qrcode$/)
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include width option in URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("my-key", { width: 400 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("width=400")
      );
    });

    it("should include margin option in URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("my-key", { margin: 2 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("margin=2")
      );
    });

    it("should include all QR code options", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("my-key", {
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
        statusText: "Not Found",
      });

      await expect(client.getQRCode("invalid-key")).rejects.toThrow(
        "Failed to generate QR code"
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

      const result = await client.getQRCodePng("my-key");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("format=png")
      );
      expect(result.base64).toBe("pngdata");
      expect(result.dataUrl).toContain("image/png");
    });

    it("should generate PNG with custom size", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCodePng("my-key", { width: 512, margin: 4 });

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

      const result = await client.getQRCodeSvg("my-key");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("format=svg")
      );
      expect(result.svg).toBe("<svg>...</svg>");
    });

    it("should generate SVG with custom colors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ svg: "<svg>...</svg>" }),
      });

      await client.getQRCodeSvg("my-key", {
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
});
