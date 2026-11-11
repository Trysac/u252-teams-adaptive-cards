# Architecture

## Overview

`@trysac/teams-adaptive-cards` is a TypeScript library that provides typed builders for Adaptive Cards 1.5 and a sender for Microsoft Teams webhooks. It avoids runtime dependencies and relies only on Node.js built-ins (`URL`, `TextEncoder`).

## Modules

- `src/error.ts`: `TeamsCardError` with stable codes.
- `src/types.ts`: public TypeScript interfaces and unions for Adaptive Card elements, actions, and the Teams message envelope.
- `src/builders.ts`: pure builder functions (`textBlock`, `factSet`, `openUrl`, `adaptiveCard`, `webhookMessage`) that validate input and produce objects with deterministic key order.
- `src/send.ts`: `sendWebhook` with pluggable transport and event emission.
- `src/index.ts`: public entry point that re-exports all APIs.

## Design decisions

- **No runtime dependencies**: all functionality uses standard library; no `fetch` or external HTTP client is imposed; callers provide a `transport` function.
- **Size validation before sending**: `webhookMessage` measures UTF-8 bytes of the serialized envelope and enforces the documented 28 KB limit (28×1024 bytes) by default.
- **Secret safety**: all error messages are generic and never include the webhook URL or card content. The transport does not receive the URL in error contexts.
- **Stable error codes**: `TeamsCardError` exposes a machine-readable `code` for programmatic handling.
- **Deterministic key order**: builders construct objects with insertion order matching the Adaptive Card schema, ensuring predictable JSON output.

## Testing

- Unit tests in `test/index.test.ts` cover all builders, validation, size boundaries, and send outcomes.
- Mock transports simulate HTTP responses without network access.
- Coverage target: 80% lines, branches, functions, statements.
