# Backend Response: Independent Aisle Configurations

## What changed
- ZoneStructure now understands optional `aisleConfigs` (per-aisle shelves/bins), normalizes aggregate fields (aisles=max count/number, shelvesPerAisle=max shelves, binsPerShelf=max bins) and computes totals/bin generation using per-aisle sums.
- Configure/Preview structure use cases share validation (unique aisle numbers, ranges: aisles 1-99, shelves 1-999, bins 1-26; max 10,000 bins) and persist normalized structure; bin creation respects each aisle’s configuration.
- HTTP schemas/responses expose `aisleConfigs`; codePattern defaults applied when omitted; DTOs/prisma persistence include the new field automatically.
- Comprehensive test coverage added:
  - **Unit tests** (61 total): create-zone, configure-zone-structure, preview-zone-structure, update-zone-layout, reset-zone-layout + all other zone use cases
  - **E2E test**: `/v1/zones/:id/structure` endpoint covering per-aisle creation and persistence

## How to call the API
- Sending `aisleConfigs` is optional; if provided it drives bin generation. Aggregate fields are still required but are normalized internally to match the configs (keep sending them for compatibility).
- Example payload:
  ```json
  {
    "structure": {
      "aisles": 2,
      "shelvesPerAisle": 10,
      "binsPerShelf": 5,
      "aisleConfigs": [
        { "aisleNumber": 1, "shelvesCount": 10, "binsPerShelf": 5 },
        { "aisleNumber": 2, "shelvesCount": 3, "binsPerShelf": 2 }
      ],
      "codePattern": {
        "separator": "-",
        "aisleDigits": 1,
        "shelfDigits": 2,
        "binLabeling": "LETTERS",
        "binDirection": "BOTTOM_UP"
      },
      "dimensions": {
        "aisleWidth": 120,
        "aisleSpacing": 30,
        "shelfWidth": 80,
        "shelfHeight": 200,
        "binHeight": 20
      }
    }
  }
  ```
- Responses now include `structure.aisleConfigs`; totals (`totalBins`, `totalShelves`) reflect per-aisle sums.
- Backward compatibility: if `aisleConfigs` is omitted, behavior remains uniform (aisles × shelvesPerAisle × binsPerShelf).

## Notes
- Aisle numbers must be unique; bins per shelf and shelves per aisle must be > 0 when configuring a structure.
- If `aisleConfigs` would create more than 10,000 bins, the request is rejected.
- Bins are generated with labels per aisle’s `binsPerShelf`, so labels match each aisle’s capacity.

## Tests Status
✅ **All tests passing**: 61 unit tests + 1 E2E test

**Run locally:**
```bash
# Unit tests
npm run test -- zones

# E2E test
npm run test:e2e -- zones
```

**Test coverage includes:**
- `create-zone.spec.ts` - zone creation with uniform & aisle configs, normalization
- `configure-zone-structure.spec.ts` - per-aisle bin generation, validation
- `preview-zone-structure.spec.ts` - structure preview with configs
- `update-zone-layout.spec.ts` - zone layout updates
- `reset-zone-layout.spec.ts` - zone layout reset
- `v1-configure-zone-structure.e2e.spec.ts` - HTTP endpoint for /v1/zones/:id/structure
