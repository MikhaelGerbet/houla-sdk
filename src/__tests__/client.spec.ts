import { describe, it, expect, vi, beforeEach } from "vitest";
import { HoulaClient } from "../client";
import { QRCodeFormat } from "../types";

describe("HoulaClient", () => {
  const mockConfig = {
    apiKey: "houla_sk_test_key_12345678901234567890",
    apiUrl: "https://api.test.com",
    timeout: 5000,
  };

  let client: HoulaClient;

  beforeEach(() => {
    client = new HoulaClient(mockConfig);
    vi.clearAllMocks();
  });

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

    it("should use default values when not provided", () => {
      const minimalClient = new HoulaClient({ apiKey: "houla_sk_test_key_12345678901234567890" });
      expect(minimalClient).toBeInstanceOf(HoulaClient);
    });
  });

  describe("getLinks", () => {
    it("should fetch links with default pagination", async () => {
      const mockResponse = {
        data: [{ id: "1", key: "test", url: "https://example.com" }],
        total: 1,
        page: 1,
        pageCount: 1,
        count: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getLinks();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link?page=1&limit=20"),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it("should cap limit at 100", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, page: 1, pageCount: 0, count: 0 }),
      });

      await client.getLinks(1, 200);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=100"),
        expect.any(Object)
      );
    });
  });

  describe("getLinkById", () => {
    it("should fetch link by id", async () => {
      const mockLink = { id: "test-id", key: "test", url: "https://example.com" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.getLinkById("test-id");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/by-id/test-id"),
        expect.any(Object)
      );
      expect(result).toEqual(mockLink);
    });
  });

  describe("createLink", () => {
    it("should create link", async () => {
      const mockResponse = {
        link: { id: "1", key: "abc123", url: "https://example.com" },
        shortUrl: "https://hou.la/abc123",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.createLink({ url: "https://example.com" });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link"),
        expect.objectContaining({ method: "POST" })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updateLink", () => {
    it("should update link", async () => {
      const mockLink = { id: "test-id", key: "test", url: "https://new-url.com" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLink),
      });

      const result = await client.updateLink("test-id", { url: "https://new-url.com" });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/test-id"),
        expect.objectContaining({ method: "PATCH" })
      );
      expect(result).toEqual(mockLink);
    });
  });

  describe("deleteLink", () => {
    it("should delete link", async () => {
      const mockResponse = { success: true, message: "Link deleted" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.deleteLink("test-id");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/link/test-id"),
        expect.objectContaining({ method: "DELETE" })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getQRCode", () => {
    it("should generate QR code", async () => {
      const mockResponse = { base64: "abc", dataUrl: "data:image/png;base64,abc" };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getQRCode("my-key");

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/my-key/qrcode"));
      expect(result).toEqual(mockResponse);
    });

    it("should include QR code options in URL", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ base64: "", dataUrl: "" }),
      });

      await client.getQRCode("my-key", {
        width: 300,
        margin: 2,
        format: QRCodeFormat.PNG,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/width=300.*margin=2.*format=png/)
      );
    });
  });

  describe("error handling", () => {
    it("should throw error on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({ message: "Invalid API key" }),
      });

      await expect(client.getLinks()).rejects.toThrow("Invalid API key");
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(client.getLinks()).rejects.toThrow("Network error");
    });
  });
});
