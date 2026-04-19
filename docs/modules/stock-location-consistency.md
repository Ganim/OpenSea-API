# Location Consistency Implementation Details

## Backend Files Created/Modified

### New Use Cases
- `src/use-cases/stock/zones/preview-zone-reconfiguration.ts` - Preview diff without applying
- `src/use-cases/stock/zones/get-zone-item-stats.ts` - Zone bin/item statistics
- `src/use-cases/stock/items/batch-transfer-items.ts` - Batch transfer (max 100 items)
- `src/use-cases/stock/items/get-item-location-history.ts` - Location-related movements

### New Controllers
- `POST /v1/zones/:id/reconfiguration-preview` - Permission: STOCK.ZONES.READ
- `GET /v1/zones/:id/item-stats` - Permission: STOCK.ZONES.READ
- `POST /v1/items/batch-transfer` - Permission: STOCK.ITEMS.CREATE
- `GET /v1/items/:id/location-history` - Permission: STOCK.ITEMS.READ

### Modified Schemas
- `zone.schema.ts` - Added reconfigurationPreviewResponseSchema, zoneItemStatsResponseSchema
- `item.schema.ts` - Added batchTransferItemsSchema, locationHistoryEntrySchema

### Diff Algorithm
- `helpers/compute-zone-diff.ts` - Core diff logic using BinKey = `${aisle}:${shelf}:${position}`
- Used by both `ConfigureZoneStructureUseCase` and `PreviewZoneReconfigurationUseCase`

## Frontend Files Created/Modified

### Types
- `src/types/stock.ts` - Added ZONE_RECONFIGURE, lastKnownAddress, originRef, batch transfer types
- `locations/src/types/zone.types.ts` - Added ReconfigurationPreviewResponse, ZoneItemStatsResponse, ConfigureZoneStructureResponse

### API/Services
- `src/config/api.ts` - Added BATCH_TRANSFER, LOCATION_HISTORY endpoints
- `src/services/stock/items.service.ts` - Added batchTransfer(), getLocationHistory()
- `locations/src/api/keys.ts` - Added zoneItemStats, zoneReconfigPreview keys
- `locations/src/api/zones.queries.ts` - Added useReconfigurationPreview, useZoneItemStats hooks

### Components Updated
- `item-card.tsx` - Shows lastKnownAddress with amber color when bin removed
- `item-detail-modal.tsx` - ZONE_RECONFIGURE in movement config, originRef display
- `items/[id]/page.tsx` - lastKnownAddress display, ZONE_RECONFIGURE in movements
- `movement-feed.tsx` - ZONE_RECONFIGURE icon/color
- `stock-badge.tsx` - ZONE_RECONFIGURE badge
- `movements/constants/index.ts` - ZONE_RECONFIGURE config and filter option

### Structure Wizard (Reconfiguration Flow)
- `structure-wizard/index.tsx` - Wired up useReconfigurationPreview, occupiedBinsAction state, context-aware submit
- `structure-wizard/step-confirm.tsx` - Full rewrite: diff summary, affected items warning, block/force radio

### Zone Detail Page
- `[zoneId]/page.tsx` - Blocked bins alert banner, handleMoveItem wired to transfer API
- `zone-map/zone-map.tsx` - MoveItemModal integration via onMoveItem prop
