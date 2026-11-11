# Project record: teams-adaptive-cards

## Objective

Provide typed builders for Adaptive Cards 1.5 and a Microsoft Teams webhook sender. The utility validates text, facts, URL actions, card body and action counts; enforces a default 28,672-byte UTF-8 message limit; and reports delivery outcomes with stable `TeamsCardError` codes without putting the webhook URL or card text into library-generated errors or events.

## Scope

In scope:

- The public API exported from `src/index.ts`: `textBlock`, `factSet`, `openUrl`, `adaptiveCard`, `webhookMessage`, `sendWebhook` and `TeamsCardError`.
- Local validation of text blocks, fact sets, URL actions, card body size, action count and message byte size.
- The Teams webhook message envelope with `type: 'message'` and an Adaptive Card attachment.
- A sender that uses a caller-provided `Transport` and reports sent, failed, rate-limited, HTTP-error and transport-error outcomes.
- Stable machine-readable error codes and optional HTTP status values.

Out of scope:

- Bot Framework support.
- Card templating.
- Rendering or image previews.
- Automatic retries, backoff or rate-limit handling beyond reporting `429` as `rate_limited`.
- Builders for Adaptive Card elements other than the documented `TextBlock`, `FactSet` and `Action.OpenUrl`; raw objects can be passed as `Element` or `Action`.
- Network I/O inside library code; the caller supplies the transport.
- Confirming that Teams or Power Automate posted the card after accepting the request.

## Timeline

| Date | Milestone |
|---|---|
| 2026 | Repository created from the factory utility template. |

## Effort metrics

Measured values only. Leave 'pending measurement' until a real figure is recorded; never estimate here.

| Metric | Value | Source |
|---|---|---|
| Tokens (input / output) | 413661 / 49244 | factory ledger |
| Hours (human) | pending measurement | time log |
| Cost (USD) | 0.0674 | factory ledger |

## Factory run u252 (measured from API usage)

| Date (UTC) | Phase | Model | Batch | Input | Output | Cache write | Cache read | Cost (USD) |
|---|---|---|---|---|---|---|---|---|
| 2026-11-11 | generation | deepseek-v4-pro | yes | 5602 | 18893 | 0 | 0 | 0.0411 |
| 2026-11-11 | fix-1 | deepseek-flash | no | 7793 | 304 | 0 | 17536 | 0.0014 |
| 2026-11-11 | audit | deepseek-flash | no | 20053 | 16846 | 0 | 280448 | 0.0140 |
| 2026-11-11 | fix-2 | deepseek-flash | no | 6860 | 2347 | 0 | 63232 | 0.0026 |
| 2026-11-11 | docs | deepseek-flash | no | 11881 | 10854 | 0 | 256 | 0.0083 |

Total: $0.0674. Prices: deepseek line, as measured by its adapter. Providers serve the current version of each model id, so the date tells which version answered; versions, launch stages and price sources per line are in the factory's model register (docs/MODELS.md).
