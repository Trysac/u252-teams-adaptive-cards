import { TeamsCardError } from "./error.js";
import type { TeamsMessage } from "./types.js";

export type Transport = (req: {
  url: string;
  body: string;
  headers: Record<string, string>;
}) => Promise<{ status: number; text: string }>;

export type SendEvent =
  | { event: "sent"; status: number }
  | { event: "failed"; code: TeamsCardError["code"]; status?: number };

export async function sendWebhook(
  url: string,
  message: TeamsMessage,
  opts: {
    transport: Transport;
    onEvent?: (e: SendEvent) => void;
  },
): Promise<{ status: number }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TeamsCardError("invalid_url", "Invalid webhook URL");
  }
  if (parsed.protocol !== "https:") {
    throw new TeamsCardError("invalid_url", "Webhook URL must use https:");
  }

  const body = JSON.stringify(message);
  const headers = { "content-type": "application/json" };

  let response: { status: number; text: string };
  try {
    response = await opts.transport({ url, body, headers });
  } catch {
    opts.onEvent?.({ event: "failed", code: "transport_failed" });
    throw new TeamsCardError("transport_failed", "Webhook transport failed");
  }

  const { status, text } = response;

  if (status >= 200 && status < 300) {
    if (text.toLowerCase().includes("error")) {
      const error = new TeamsCardError(
        "delivery_failed",
        "Webhook delivery failed: error in response",
        {
          status,
        },
      );
      opts.onEvent?.({ event: "failed", code: error.code, status });
      throw error;
    }
    opts.onEvent?.({ event: "sent", status });
    return { status };
  }

  if (status === 429) {
    const error = new TeamsCardError("rate_limited", "Webhook rate limited", { status });
    opts.onEvent?.({ event: "failed", code: error.code, status });
    throw error;
  }

  const error = new TeamsCardError("http_error", `Webhook HTTP error: status ${status}`, {
    status,
  });
  opts.onEvent?.({ event: "failed", code: error.code, status });
  throw error;
}
