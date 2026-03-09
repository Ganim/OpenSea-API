# ADR-009: Refresh Token Rotation with Reuse Detection

## Status: Accepted
## Date: 2026-03-09

## Context

The authentication system uses short-lived access tokens (30 min) and long-lived refresh tokens (7 days). If a refresh token is stolen, an attacker could maintain access indefinitely by continuously refreshing.

## Decision

Implement **single-use refresh token rotation** with **reuse detection**:

1. Each refresh token can only be used once
2. When used, the old token is revoked and a new one is issued
3. **Reuse detection**: If a revoked token is presented again, this indicates token theft (either the attacker or the legitimate user has the old token)
4. On reuse detection: revoke ALL refresh tokens for that session AND revoke the session itself
5. Both the attacker and the legitimate user are forced to re-authenticate

Flow:
```
User has T1 → uses T1 → gets T2, T1 is revoked
Attacker stole T1 → tries T1 → REUSE DETECTED
  → All tokens for session revoked (including T2)
  → Session revoked
  → Both parties must re-login
```

## Consequences

**Positive:**
- Stolen refresh tokens are automatically detected and neutralized
- The window of compromise is limited to the time between the theft and the legitimate user's next refresh
- No additional infrastructure needed (uses existing `revokedAt` field)
- Session revocation ensures the attacker can't use any associated access tokens after expiry

**Negative:**
- Legitimate users may be forced to re-login if their old token is accidentally replayed (e.g., concurrent requests during refresh)
- Race condition: if two tabs refresh simultaneously, the slower one triggers reuse detection (mitigated by frontend token synchronization)
