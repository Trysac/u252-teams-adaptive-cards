# Typed builders and validated webhook sender for Adaptive Cards

Status: accepted (generated, pending human review)

## Context

Teams notifications are often hand-written JSON with silent failures. Need a typed, safe API for building cards and sending via webhooks.

## Decision

Implement pure builder functions with strict validation and size limits, plus an asynchronous sender that accepts a pluggable transport. Use a single error class with stable codes. Keep zero runtime dependencies.

## Consequences

Callers must supply a transport function (e.g., using fetch), giving flexibility and testability. The library enforces documented limits and never logs secrets. All failure modes are represented by typed errors.
