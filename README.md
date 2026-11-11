# @trysac/teams-adaptive-cards

Typed builders for Adaptive Cards 1.5 sent to Microsoft Teams webhooks: validated text, facts and URL actions, the 28 KB message limit and a sender that never leaks the webhook URL.

## Why

Teams notifications from CI jobs and services are usually hand-written JSON that breaks silently: a missing wrap flag, a javascript: link, a card over the size limit or a 200 response that actually carries a delivery error. Webhook URLs are secrets, yet they end up in logs and error messages. This library builds the card with typed helpers, checks the documented limits before sending and reports delivery outcomes with stable codes.

### Why not writing the JSON by hand

Hand-written Adaptive Card JSON is untyped and fails at send time; this library validates locally, measures the serialized message in UTF-8 bytes and keeps the webhook URL out of library-generated errors and events.

## Installation

```bash
npm install @trysac/teams-adaptive-cards
```

## Usage

```typescript
import { adaptiveCard, openUrl, sendWebhook, textBlock, webhookMessage } from '@trysac/teams-adaptive-cards';

const card = adaptiveCard([textBlock('Build 42 passed', { weight: 'Bolder' })], [openUrl('Logs', 'https://ci.example.com/42')]);
const message = webhookMessage(card);
await sendWebhook('https://prod-42.europe-01.logic.azure.com/workflows/abc/triggers/manual/paths/invoke?sig=abc123', message, { transport: async ({ url, body, headers }) => { const r = await fetch(url, { method: 'POST', headers, body }); return { status: r.status, text: await r.text() }; } });
```

## API

### `textBlock(text, opts?)`

Creates a `TextBlock` element. `wrap` is always `true`. Optional `weight`, `size`, `color` and `isSubtle` are included only when provided, in that order after `type`, `text` and `wrap`.

### `factSet(facts)`

Creates a `FactSet` element from 1 to 50 `[title, value]` pairs. Titles must not be empty. Throws `TeamsCardError` with code `invalid_facts` otherwise.

### `openUrl(title, url)`

Creates an `Action.OpenUrl`. The URL is parsed with the WHATWG `URL` parser and must use `http:` or `https:`; otherwise throws `TeamsCardError` with code `invalid_url`.

### `adaptiveCard(body, actions?)`

Creates an `AdaptiveCard` with `$schema` set to `http://adaptivecards.io/schemas/adaptive-card.json`, `version: '1.5'` and 1 to 100 body elements. At most 10 actions are allowed; empty actions are omitted from the card. Throws `invalid_body` or `too_many_actions` when the limits are exceeded.

### `webhookMessage(card, opts?)`

Wraps the card in the Teams envelope `{ type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content: card }] }`. Measures `new TextEncoder().encode(JSON.stringify(message)).length` against `maxBytes` (default 28_672, the library's reading of Microsoft's 28 KB limit as 28 x 1024 UTF-8 bytes). Override with `webhookMessage(card, { maxBytes })`; exceeding the limit throws `message_too_large`.

### `sendWebhook(url, message, opts)`

The URL must parse and use `https:`; otherwise throws `invalid_url` without calling `transport`. Calls `transport({ url, body: JSON.stringify(message), headers: { 'content-type': 'application/json' } })` and returns `{ status }` for a 2xx response whose body does not contain `error` (case-insensitive). A 2xx body containing `error` throws `delivery_failed`; status 429 throws `rate_limited`; other statuses throw `http_error`; a transport rejection throws `transport_failed`. The optional `onEvent` receives `{ event: 'sent', status }` or `{ event: 'failed', code, status? }`. No retries are performed.

### `TeamsCardError`

Error class with `readonly code` (`invalid_url`, `invalid_body`, `invalid_facts`, `too_many_actions`, `message_too_large`, `delivery_failed`, `rate_limited`, `http_error`, `transport_failed`) and optional `readonly status`. Library-generated error messages and events do not contain the webhook URL or card text.

## Important: Microsoft Teams webhook retirement

Office 365 connectors and connector-based incoming webhooks were retired in May 2026. The target is a Workflows webhook (trigger 'When a Teams webhook request is received'). A Power Automate request trigger without a Response action answers `202 Accepted` immediately; this means the request was accepted, not that the card was posted. Check the flow run history. Microsoft throttles more than four requests per second with `429`; this library reports such responses as `rate_limited`.

## Size limit

Microsoft documents 'The message size limit is 28 KB' for Teams incoming webhooks. This library interprets 28 KB as 28 x 1024 bytes (28,672) of the UTF-8 request body, measured with `TextEncoder`. Override the limit with `webhookMessage(card, { maxBytes })`.

## Scenarios

### CI job notifications

Use `adaptiveCard` with `textBlock` and `factSet`, call `webhookMessage`, then call `sendWebhook` with a caller-provided transport.

### Custom raw elements

`Element` and `Action` include `Record<string, unknown>`, so other Adaptive Card objects can be passed through as raw objects to `adaptiveCard`. The library does not validate fields of raw objects.

## Development

TypeScript ESM source for Node.js 20+, with no runtime dependencies; library code uses `URL` and `TextEncoder`. Tests live in `test/index.test.ts`.

Security: see [docs/SECURITY.md](docs/SECURITY.md).

## License

MIT
