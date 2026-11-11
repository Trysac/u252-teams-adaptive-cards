import { describe, expect, it, vi } from "vitest";
import type { Transport } from "../src/index.js";
import {
  adaptiveCard,
  factSet,
  openUrl,
  sendWebhook,
  type TeamsCardError,
  textBlock,
  webhookMessage,
} from "../src/index.js";

describe("textBlock", () => {
  it("returns a TextBlock with type, text, wrap", () => {
    expect(textBlock("Hi")).toEqual({ type: "TextBlock", text: "Hi", wrap: true });
  });

  it("includes options in order: weight, size, color, isSubtle", () => {
    const block = textBlock("Build 42 passed", { weight: "Bolder", size: "Medium" });
    expect(block).toEqual({
      type: "TextBlock",
      text: "Build 42 passed",
      wrap: true,
      weight: "Bolder",
      size: "Medium",
    });
    expect(Object.keys(block)).toEqual(["type", "text", "wrap", "weight", "size"]);
  });

  it("emits isSubtle: false when explicitly given", () => {
    const block = textBlock("x", { isSubtle: false });
    expect(block).toEqual({ type: "TextBlock", text: "x", wrap: true, isSubtle: false });
    expect(Object.keys(block)).toEqual(["type", "text", "wrap", "isSubtle"]);
  });

  it("emits color when given", () => {
    const block = textBlock("y", { color: "Good" });
    expect(block).toEqual({ type: "TextBlock", text: "y", wrap: true, color: "Good" });
    expect(Object.keys(block)).toEqual(["type", "text", "wrap", "color"]);
  });
});

describe("factSet", () => {
  it("creates a FactSet with facts", () => {
    expect(factSet([["env", "prod"]])).toEqual({
      type: "FactSet",
      facts: [{ title: "env", value: "prod" }],
    });
  });

  it("accepts up to 50 facts", () => {
    const facts = Array.from(
      { length: 50 },
      (_, i) => [`title${i}`, `value${i}`] as [string, string],
    );
    expect(() => factSet(facts)).not.toThrow();
  });

  it("throws for empty array", () => {
    expect(() => factSet([])).toThrowError(expect.objectContaining({ code: "invalid_facts" }));
  });

  it("throws for more than 50 facts", () => {
    const facts = Array.from(
      { length: 51 },
      (_, i) => [`title${i}`, `value${i}`] as [string, string],
    );
    expect(() => factSet(facts)).toThrowError(expect.objectContaining({ code: "invalid_facts" }));
  });

  it("throws for empty title", () => {
    expect(() => factSet([["", "v"]])).toThrowError(
      expect.objectContaining({ code: "invalid_facts" }),
    );
  });
});

describe("openUrl", () => {
  it("accepts http and https URLs", () => {
    expect(openUrl("Logs", "https://ci.example.com/42")).toEqual({
      type: "Action.OpenUrl",
      title: "Logs",
      url: "https://ci.example.com/42",
    });
    expect(openUrl("HTTP", "http://example.com")).toEqual({
      type: "Action.OpenUrl",
      title: "HTTP",
      url: "http://example.com",
    });
  });

  it("throws for javascript: protocol", () => {
    expect(() => openUrl("x", "javascript:alert(1)")).toThrowError(
      expect.objectContaining({ code: "invalid_url" }),
    );
  });

  it("throws for ftp: protocol", () => {
    expect(() => openUrl("x", "ftp://a.example")).toThrowError(
      expect.objectContaining({ code: "invalid_url" }),
    );
  });

  it("throws for invalid URL", () => {
    expect(() => openUrl("x", "not a url")).toThrowError(
      expect.objectContaining({ code: "invalid_url" }),
    );
  });
});

describe("adaptiveCard", () => {
  it("creates card with body only", () => {
    const card = adaptiveCard([textBlock("Hi")]);
    expect(card).toEqual({
      type: "AdaptiveCard",
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.5",
      body: [textBlock("Hi")],
    });
  });

  it("includes actions only when non-empty", () => {
    const actions = [openUrl("Logs", "https://example.com")];
    const card = adaptiveCard([textBlock("Hi")], actions);
    expect(card.actions).toEqual(actions);
  });

  it("omits actions property when actions is empty array", () => {
    const card = adaptiveCard([textBlock("Hi")], []);
    expect(card).not.toHaveProperty("actions");
  });

  it("throws for empty body", () => {
    expect(() => adaptiveCard([])).toThrowError(expect.objectContaining({ code: "invalid_body" }));
  });

  it("throws for more than 100 body elements", () => {
    const body = Array.from({ length: 101 }, () => textBlock("x"));
    expect(() => adaptiveCard(body)).toThrowError(
      expect.objectContaining({ code: "invalid_body" }),
    );
  });

  it("allows the same element passed twice", () => {
    const el = textBlock("x");
    const card = adaptiveCard([el, el]);
    expect(card.body).toHaveLength(2);
    expect(card.body[0]).toBe(card.body[1]);
  });

  it("throws for more than 10 actions", () => {
    const actions = Array.from({ length: 11 }, () => openUrl("x", "https://example.com"));
    expect(() => adaptiveCard([textBlock("x")], actions)).toThrowError(
      expect.objectContaining({ code: "too_many_actions" }),
    );
  });
});

describe("webhookMessage", () => {
  it("creates the exact envelope for a simple card", () => {
    const message = webhookMessage(adaptiveCard([textBlock("Hi")]));
    expect(JSON.stringify(message)).toBe(
      '{"type":"message","attachments":[{"contentType":"application/vnd.microsoft.card.adaptive","contentUrl":null,"content":{"type":"AdaptiveCard","$schema":"http://adaptivecards.io/schemas/adaptive-card.json","version":"1.5","body":[{"type":"TextBlock","text":"Hi","wrap":true}]}}]}',
    );
  });

  it("accepts exactly 28,672 bytes with 28397 x characters", () => {
    const card = adaptiveCard([textBlock("x".repeat(28397))]);
    expect(() => webhookMessage(card)).not.toThrow();
    const message = webhookMessage(card);
    const bytes = new TextEncoder().encode(JSON.stringify(message)).length;
    expect(bytes).toBe(28672);
  });

  it("throws for one byte over limit", () => {
    const card = adaptiveCard([textBlock("x".repeat(28398))]);
    expect(() => webhookMessage(card)).toThrowError(
      expect.objectContaining({ code: "message_too_large" }),
    );
  });

  it("throws when multibyte characters exceed limit", () => {
    const card = adaptiveCard([textBlock("é".repeat(14199))]);
    expect(() => webhookMessage(card)).toThrowError(
      expect.objectContaining({ code: "message_too_large" }),
    );
  });

  it("measures emoji text in UTF-8 bytes and accepts exactly 28,671 bytes", () => {
    const card = adaptiveCard([textBlock("\u{1F600}".repeat(7099))]);
    expect(() => webhookMessage(card)).not.toThrow();
    const bytes = new TextEncoder().encode(JSON.stringify(webhookMessage(card))).length;
    expect(bytes).toBe(28671);
  });

  it("throws when emoji text exceeds the limit", () => {
    const card = adaptiveCard([textBlock("\u{1F600}".repeat(7100))]);
    expect(() => webhookMessage(card)).toThrowError(
      expect.objectContaining({ code: "message_too_large" }),
    );
  });

  it("respects custom maxBytes", () => {
    const card = adaptiveCard([textBlock("hello")]);
    expect(() => webhookMessage(card, { maxBytes: 10 })).toThrowError(
      expect.objectContaining({ code: "message_too_large" }),
    );
  });
});

describe("sendWebhook", () => {
  const webhookUrl =
    "https://flows.example.com/workflows/abc/triggers/manual/paths/invoke?sig=abc123";
  const card = adaptiveCard([textBlock("Secret card text")]);
  const message = webhookMessage(card);

  function mockTransport(response: { status: number; text: string }): Transport {
    return vi.fn(async () => response);
  }

  it("resolves {status} for 200 with body '1'", async () => {
    const transport = mockTransport({ status: 200, text: "1" });
    const onEvent = vi.fn();
    const result = await sendWebhook(webhookUrl, message, { transport, onEvent });
    expect(result).toEqual({ status: 200 });
    expect(onEvent).toHaveBeenCalledWith({ event: "sent", status: 200 });
    expect(transport).toHaveBeenCalledWith({
      url: webhookUrl,
      body: JSON.stringify(message),
      headers: { "content-type": "application/json" },
    });
  });

  it("resolves {status} for 202 with empty body", async () => {
    const transport = mockTransport({ status: 202, text: "" });
    const result = await sendWebhook(webhookUrl, message, { transport });
    expect(result).toEqual({ status: 202 });
  });

  it("rejects with delivery_failed when 200 body contains 'error'", async () => {
    const transport = mockTransport({
      status: 200,
      text: "Webhook message delivery failed with error: Microsoft Teams endpoint returned HTTP error 413",
    });
    const onEvent = vi.fn();
    await expect(sendWebhook(webhookUrl, message, { transport, onEvent })).rejects.toMatchObject({
      code: "delivery_failed",
      status: 200,
    });
    expect(onEvent).toHaveBeenCalledWith({ event: "failed", code: "delivery_failed", status: 200 });
  });

  it("rejects with rate_limited for 429", async () => {
    const transport = mockTransport({ status: 429, text: "Too many requests" });
    const onEvent = vi.fn();
    await expect(sendWebhook(webhookUrl, message, { transport, onEvent })).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
    });
    expect(onEvent).toHaveBeenCalledWith({ event: "failed", code: "rate_limited", status: 429 });
  });

  it("rejects with http_error for 500", async () => {
    const transport = mockTransport({ status: 500, text: "Internal Server Error" });
    await expect(sendWebhook(webhookUrl, message, { transport })).rejects.toMatchObject({
      code: "http_error",
      status: 500,
    });
  });

  it("rejects with transport_failed when transport throws", async () => {
    const transport = vi.fn(async () => {
      throw new Error("network down");
    });
    const onEvent = vi.fn();
    await expect(sendWebhook(webhookUrl, message, { transport, onEvent })).rejects.toMatchObject({
      code: "transport_failed",
    });
    expect(onEvent).toHaveBeenCalledWith({ event: "failed", code: "transport_failed" });
  });

  it("rejects with invalid_url for non-https and does not call transport", async () => {
    const transport = vi.fn();
    await expect(sendWebhook("http://example.com", message, { transport })).rejects.toMatchObject({
      code: "invalid_url",
    });
    expect(transport).not.toHaveBeenCalled();
  });

  it("does not leak URL or card text in error messages or events", async () => {
    const transport = mockTransport({ status: 200, text: "error: something bad" });
    const onEvent = vi.fn();
    const p = sendWebhook(webhookUrl, message, { transport, onEvent });
    await expect(p).rejects.toMatchObject({ code: "delivery_failed" });
    const err = await p.then(
      () => {
        throw new Error("expected sendWebhook to reject");
      },
      (e: TeamsCardError) => e,
    );
    const payloads = [err.message, ...onEvent.mock.calls.map(([e]) => JSON.stringify(e))];
    for (const s of payloads) {
      expect(s).not.toContain("workflows/abc");
      expect(s).not.toContain("abc123");
      expect(s).not.toContain("Secret card text");
    }
    expect(onEvent).toHaveBeenCalledTimes(1);
  });
});
