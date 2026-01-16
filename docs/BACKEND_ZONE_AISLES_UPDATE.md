# Backend Update: Independent Aisle Configurations

## Summary

The frontend now supports **independent aisle configurations** where each aisle (corredor) can have different numbers of shelves and bins. However, the backend is not persisting this configuration.

## Current Issue

**Observed Behavior:**
- Frontend sends `aisleConfigs` array in the structure configuration request
- Backend ignores `aisleConfigs` and only saves aggregate fields
- Bins are created uniformly instead of per-aisle configuration
- Database shows: `{"aisles":3,"dimensions":{...},"codePattern":{...},"binsPerShelf":4,"shelvesPerAisle":3}`
- Missing: `aisleConfigs` field

## Required Changes

### 1. Update Zone Structure Schema

Add `aisleConfigs` field to the zone's structure JSON schema:

```typescript
interface AisleConfig {
  aisleNumber: number;   // Aisle number (1, 2, 3...)
  shelvesCount: number;  // Number of shelves in this aisle
  binsPerShelf: number;  // Bins per shelf in this aisle
}

interface ZoneStructure {
  // Aggregate fields (keep for backward compatibility)
  aisles: number;
  shelvesPerAisle: number;  // Max shelves across all aisles
  binsPerShelf: number;     // Max bins across all aisles

  // NEW: Independent aisle configurations
  aisleConfigs?: AisleConfig[];

  // Existing fields
  codePattern: CodePattern;
  dimensions: PhysicalDimensions;
}
```

### 2. Update POST `/v1/zones/{zoneId}/structure` Endpoint

**Current behavior:**
- Receives structure configuration
- Creates bins uniformly: `aisles × shelvesPerAisle × binsPerShelf`

**Required behavior:**
- Check if `aisleConfigs` is present in the request
- If present: Create bins per aisle configuration
- If absent: Fall back to uniform creation (backward compatible)

```typescript
// Pseudocode for bin generation
function generateBins(structure: ZoneStructure): Bin[] {
  const bins: Bin[] = [];

  if (structure.aisleConfigs && structure.aisleConfigs.length > 0) {
    // Independent aisle configurations
    for (const aisleConfig of structure.aisleConfigs) {
      const { aisleNumber, shelvesCount, binsPerShelf } = aisleConfig;

      for (let shelf = 1; shelf <= shelvesCount; shelf++) {
        for (let bin = 0; bin < binsPerShelf; bin++) {
          const binLabel = getBinLabel(bin, structure.codePattern);
          bins.push({
            aisle: aisleNumber,
            shelf,
            position: binLabel,
            code: generateCode(aisleNumber, shelf, binLabel, structure.codePattern),
          });
        }
      }
    }
  } else {
    // Uniform configuration (backward compatible)
    for (let aisle = 1; aisle <= structure.aisles; aisle++) {
      for (let shelf = 1; shelf <= structure.shelvesPerAisle; shelf++) {
        for (let bin = 0; bin < structure.binsPerShelf; bin++) {
          const binLabel = getBinLabel(bin, structure.codePattern);
          bins.push({
            aisle,
            shelf,
            position: binLabel,
            code: generateCode(aisle, shelf, binLabel, structure.codePattern),
          });
        }
      }
    }
  }

  return bins;
}
```

### 3. Persist `aisleConfigs` in Database

When saving the zone structure to the database, ensure `aisleConfigs` is included:

```sql
-- Example: Updating zone structure
UPDATE zones
SET structure = '{"aisles":2,"shelvesPerAisle":10,"binsPerShelf":5,"aisleConfigs":[{"aisleNumber":1,"shelvesCount":10,"binsPerShelf":5},{"aisleNumber":2,"shelvesCount":3,"binsPerShelf":2}],"codePattern":{...},"dimensions":{...}}'
WHERE id = 'zone-uuid';
```

### 4. Return `aisleConfigs` in GET Responses

When returning zone data, include the `aisleConfigs` field if it exists:

```json
{
  "zone": {
    "id": "831ad226-1040-4f26-94f9-ecc3d2a93e2c",
    "warehouseId": "05ba8637-0938-4e3f-8ca4-f35b4172f35b",
    "code": "Z01",
    "name": "Zona Principal",
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
    },
    "isActive": true
  }
}
```

## Example Request/Response

### Request

```http
POST /v1/zones/831ad226-1040-4f26-94f9-ecc3d2a93e2c/structure
Content-Type: application/json

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

### Expected Bins Created

| Aisle | Shelves | Bins/Shelf | Total Bins | Example Codes |
|-------|---------|------------|------------|---------------|
| 1     | 10      | 5          | 50         | 1-01-A, 1-01-B, ..., 1-10-E |
| 2     | 3       | 2          | 6          | 2-01-A, 2-01-B, 2-02-A, 2-02-B, 2-03-A, 2-03-B |

**Total bins:** 56 (not 100 as uniform would create)

## Backward Compatibility

The implementation maintains backward compatibility:

1. **Old clients** that don't send `aisleConfigs`:
   - Backend uses uniform `aisles × shelvesPerAisle × binsPerShelf`
   - Works exactly as before

2. **New clients** that send `aisleConfigs`:
   - Backend uses per-aisle configuration
   - Aggregate fields are still present for display/filtering purposes

3. **Old data** without `aisleConfigs`:
   - Frontend infers configuration from existing bins
   - Falls back to uniform display if inference fails

## Frontend Status

The frontend is fully implemented:

- ✅ Wizard UI for adding/removing independent aisles
- ✅ Sends `aisleConfigs` to backend
- ✅ Preview shows per-aisle configuration
- ✅ Zone map infers config from bins (fallback)
- ✅ Individual zoom controls per aisle
- ✅ Shelf numbering per aisle

**Files modified:**
- `src/app/(dashboard)/stock/locations/src/types/zone.types.ts`
- `src/app/(dashboard)/stock/locations/src/components/structure-wizard/index.tsx`
- `src/app/(dashboard)/stock/locations/src/components/structure-wizard/step-aisles.tsx` (new)
- `src/app/(dashboard)/stock/locations/src/components/structure-wizard/step-preview.tsx`
- `src/app/(dashboard)/stock/locations/src/components/zone-map/zone-map.tsx`
- `src/app/(dashboard)/stock/locations/src/components/zone-map/aisle-row.tsx`
- `src/app/(dashboard)/stock/locations/src/utils/address-generator.ts`

## Testing

After backend update, test the following scenarios:

1. **Create zone with 2 different aisles:**
   - Aisle 1: 10 shelves, 5 bins each
   - Aisle 2: 3 shelves, 2 bins each
   - Verify database has `aisleConfigs`
   - Verify correct number of bins created (56)

2. **View zone in 2D map:**
   - Verify aisle 1 shows 10 shelves × 5 bins
   - Verify aisle 2 shows 3 shelves × 2 bins

3. **Backward compatibility:**
   - Old zones without `aisleConfigs` should still display correctly
   - New zones with `aisleConfigs` should display per-aisle config
