# ADR-006: Calendar RRULE Expansion Strategy

## Status: Accepted
## Date: 2026-01-15

## Context

The Calendar module supports recurring events (daily, weekly, monthly, yearly). Two approaches were considered:

1. **Materialized instances**: Create a database row for each occurrence at creation time
2. **Virtual expansion**: Store only the RRULE string and expand occurrences at query time

## Decision

Use **virtual expansion** with the `rrule` npm package.

- Recurring events store an `rrule` string (RFC 5545 format) in the database
- `list-events` use case expands the RRULE within the requested date range
- Maximum expansion range: 90 days (prevents unbounded expansion)
- Each expanded occurrence carries the parent event's ID + the occurrence date
- Edits to a single occurrence would create an exception (EXDATE) — not yet implemented
- `DTSTART` is derived from the event's `startDate`

## Consequences

**Positive:**
- No database bloat (a weekly recurring event = 1 row, not 52/year)
- Changing the recurrence rule takes effect immediately
- No background jobs needed to pre-generate instances
- RRULE is a well-known standard (iCal compatible)

**Negative:**
- Query-time expansion adds CPU cost (~1-5ms per event)
- 90-day limit means calendar views beyond that range won't show recurring events
- Single-occurrence editing (exceptions) requires additional complexity
- Sorting mixed one-time and expanded recurring events requires post-query merge
