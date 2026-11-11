# Security practices

How this repository keeps the package and its users safe. The disclosure policy is in [../SECURITY.md](../SECURITY.md).

## Threat model

### Defended

- `openUrl` accepts only `http:` and `https:` URLs and throws `invalid_url` for unparsable or other-scheme URLs, including `javascript:` and `ftp:`.
- `sendWebhook` requires an `https:` webhook URL and throws `invalid_url` before calling the caller-provided transport.
- `webhookMessage` measures the serialized envelope as UTF-8 bytes with `TextEncoder` and enforces `maxBytes` (default 28,672) before sending, throwing `message_too_large`.
- `adaptiveCard` enforces 1 to 100 body elements and at most 10 actions; `factSet` enforces 1 to 50 facts with non-empty titles.
- Library-generated error messages and `onEvent` payloads contain the error code, status and limit values only; they do not contain the webhook URL or card text.
- Library code does not use `eval` or dynamic `Function` construction and does not perform network I/O; the transport is supplied by the caller.

### Not defended

- A caller-provided transport can log the webhook URL or request body; the library cannot redact data outside its own errors and events.
- TLS certificate validation and connection handling are delegated to the transport; the library checks only the URL scheme.
- `429` responses are reported as `rate_limited`; the library does not retry, back off or impose outbound rate limiting.
- A 2xx response whose body does not contain `error` is treated as sent; a `202 Accepted` from Power Automate means accepted, not posted.
- Raw `Element` and `Action` objects are serialized as provided and their fields are not schema-validated.
- `FactSet` values are not checked for emptiness; only titles are checked.
- `maxBytes` is caller-overridable and may be set above or below the actual Teams or flow limit.
- The library does not authenticate or verify webhook responses beyond the documented status and body checks.

## Secrets

No secrets are required in source. Webhook URLs can embed secrets and are accepted only by `sendWebhook`; callers must keep them out of logs, telemetry and transport error handling.

## Dependencies

There are no runtime dependencies. The library code uses `URL` and `TextEncoder`; tests use Vitest.

## Code

Inputs from callers are validated with explicit `TeamsCardError` codes. Error payloads are generic and do not include the webhook URL or card text.

## Publishing

Publishing credentials and package publication are outside the library code and must not be stored in the repository.
