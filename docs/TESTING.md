# Testing

## Tools

- Vitest runs the suite in `test/index.test.ts`; the file imports `describe`, `expect`, `it` and `vi` from `vitest`.

## Commands

```sh
npx vitest run test/index.test.ts
```

## Rules

- Tests exercise the public entry point `src/index.ts` and assert return values, thrown `TeamsCardError` codes and emitted events.
- HTTP behavior is simulated with Vitest mock transports; tests do not call the network.
- Error and event assertions check that the webhook URL path, signature and card text are not leaked.

## Tiers

Only one local unit tier exists: `test/index.test.ts`. No conformance or external-tool test files are present in the repository.

## Reports

No separate test report structure is defined in the source; Vitest output is the test report.

## Coverage of `test/index.test.ts`

- `textBlock`: minimal output, option key order, explicit `isSubtle: false`, and `color`.
- `factSet`: one fact, 50 accepted, empty array rejected, more than 50 rejected, empty title rejected.
- `openUrl`: `http:` and `https:` accepted; `javascript:`, `ftp:` and invalid URLs throw `invalid_url`.
- `adaptiveCard`: body-only card, non-empty actions included, empty actions omitted, empty body rejected, more than 100 body elements rejected, same element passed twice allowed, more than 10 actions throw `too_many_actions`.
- `webhookMessage`: exact envelope JSON, 28,672-byte boundary accepted, one byte over rejected, multi-byte `é` text rejected, emoji text measured in UTF-8 bytes and boundary cases, custom `maxBytes` rejected.
- `sendWebhook`: 200 with body `1`, 202 with empty body, 200 body containing `error` gives `delivery_failed`, 429 gives `rate_limited`, 500 gives `http_error`, throwing transport gives `transport_failed`, non-https URL gives `invalid_url` without calling the transport, and errors or events do not contain the webhook URL path, signature or card text.
