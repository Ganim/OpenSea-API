# ADR-008: Email IMAP Sync Strategy

## Status: Accepted
## Date: 2026-02-01

## Context

The Email module needed to sync messages from external IMAP servers (Gmail, Outlook, etc.) into OpenSea's database for a unified inbox experience.

Challenges:
- IMAP connections are stateful and slow to establish
- Large mailboxes can have 100K+ messages
- Multiple users may connect the same email account
- Account credentials need secure storage

## Decision

**Incremental sync with BullMQ scheduling:**

1. Users register email accounts with IMAP/SMTP credentials
2. Credentials are encrypted with AES-GCM (per-account, key rotation supported)
3. A BullMQ scheduler enqueues sync jobs every 5 minutes per account
4. Each sync job fetches only new messages since last sync (IMAP SEARCH SINCE)
5. Messages are stored in PostgreSQL with full headers, text/html body, and attachment metadata
6. Attachments are stored in S3

**Connection pooling:**
- `imap-connection-pool.ts` maintains a singleton pool with mutex and 60s idle TTL
- Connections are reused across sync cycles for the same account
- Graceful shutdown drains all connections

**Credential security:**
- AES-GCM encryption with `EMAIL_CREDENTIALS_KEY` env variable
- Previous key support (`EMAIL_CREDENTIALS_KEY_PREVIOUS`) for zero-downtime rotation
- `tlsVerify` per-account flag for self-signed certificate environments

## Consequences

**Positive:**
- Incremental sync is efficient (only new messages per cycle)
- Connection pooling reduces IMAP handshake overhead
- Encrypted credentials at rest
- BullMQ ensures sync continues even after API restart

**Negative:**
- IMAP protocol is complex and inconsistent across providers
- 5-minute sync interval means emails appear with up to 5 minutes delay
- Large initial sync (first time) can be slow
- Connection pool adds complexity (mutex, idle eviction, error recovery)
