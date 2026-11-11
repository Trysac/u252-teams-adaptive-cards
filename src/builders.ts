import { TeamsCardError } from "./error.js";
import type {
  Action,
  AdaptiveCard,
  Element,
  FactSet,
  OpenUrlAction,
  TeamsMessage,
  TextBlock,
} from "./types.js";

export function textBlock(
  text: string,
  opts?: {
    weight?: "Default" | "Lighter" | "Bolder";
    size?: "Small" | "Default" | "Medium" | "Large" | "ExtraLarge";
    color?: "Default" | "Good" | "Warning" | "Attention" | "Accent";
    isSubtle?: boolean;
  },
): TextBlock {
  const block: TextBlock = {
    type: "TextBlock",
    text,
    wrap: true,
  };
  if (opts?.weight !== undefined) block.weight = opts.weight;
  if (opts?.size !== undefined) block.size = opts.size;
  if (opts?.color !== undefined) block.color = opts.color;
  if (opts?.isSubtle !== undefined) block.isSubtle = opts.isSubtle;
  return block;
}

export function factSet(facts: Array<[string, string]>): FactSet {
  if (!Array.isArray(facts) || facts.length < 1 || facts.length > 50) {
    throw new TeamsCardError("invalid_facts", "factSet requires 1 to 50 facts");
  }
  for (const [title] of facts) {
    if (title.trim() === "") {
      throw new TeamsCardError("invalid_facts", "Fact titles must not be empty");
    }
  }
  return {
    type: "FactSet",
    facts: facts.map(([title, value]) => ({ title, value })),
  };
}

export function openUrl(title: string, url: string): OpenUrlAction {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TeamsCardError("invalid_url", "Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TeamsCardError("invalid_url", "URL protocol must be http: or https:");
  }
  return {
    type: "Action.OpenUrl",
    title,
    url,
  };
}

export function adaptiveCard(body: Element[], actions?: Action[]): AdaptiveCard {
  if (!Array.isArray(body) || body.length < 1 || body.length > 100) {
    throw new TeamsCardError("invalid_body", "adaptiveCard requires 1 to 100 body elements");
  }
  const card: AdaptiveCard = {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body,
  };
  if (actions !== undefined) {
    if (actions.length > 10) {
      throw new TeamsCardError("too_many_actions", "adaptiveCard allows at most 10 actions");
    }
    if (actions.length > 0) {
      card.actions = actions;
    }
  }
  return card;
}

export function webhookMessage(card: AdaptiveCard, opts?: { maxBytes?: number }): TeamsMessage {
  const message: TeamsMessage = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
  };
  const maxBytes = opts?.maxBytes ?? 28 * 1024;
  const bytes = new TextEncoder().encode(JSON.stringify(message)).length;
  if (bytes > maxBytes) {
    throw new TeamsCardError("message_too_large", `Message exceeds ${maxBytes} bytes`);
  }
  return message;
}
