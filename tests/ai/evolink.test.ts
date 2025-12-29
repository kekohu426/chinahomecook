import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EvolinkClient } from "@/lib/ai/evolink";

const originalFetch = global.fetch;

describe("EvolinkClient", () => {
  beforeEach(() => {
    process.env.EVOLINK_API_KEY = "test-key";
    process.env.EVOLINK_API_URL = "https://example.com";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("retries when response is not ok", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "fail" }), { status: 500 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ url: "https://img" }] }), {
          status: 200,
        })
      );
    global.fetch = mockFetch as any;

    const client = new EvolinkClient();
    const result = await client.generateImage({
      prompt: "test",
      retries: 1,
      timeoutMs: 1000,
    });

    expect(result.success).toBe(true);
    expect(result.imageUrl).toBe("https://img");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns error when response missing image url", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{}] }), { status: 200 })
    );
    global.fetch = mockFetch as any;

    const client = new EvolinkClient();
    const result = await client.generateImage({
      prompt: "test",
      retries: 0,
      timeoutMs: 1000,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/未获取到图片 URL/);
  });

  it("times out when request exceeds timeout", async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn((_: string, options: any) => {
      return new Promise((_, reject) => {
        const signal = options?.signal;
        const abortError =
          typeof DOMException !== "undefined"
            ? new DOMException("Aborted", "AbortError")
            : new Error("AbortError");
        signal?.addEventListener("abort", () => reject(abortError));
      });
    });
    global.fetch = mockFetch as any;

    const client = new EvolinkClient();
    const promise = client.generateImage({
      prompt: "test",
      retries: 0,
      timeoutMs: 10,
    });

    vi.advanceTimersByTime(20);
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/超时/);
  });
});
