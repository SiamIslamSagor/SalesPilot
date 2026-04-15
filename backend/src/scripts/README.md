# Migration Scripts

Use `npm run migrate` to execute all pending files in `src/migrations/`.

## recalculateOrderTotals.ts

Standalone maintenance script for recalculating stored order totals.

## Automatic Migrations

- `001_backfill_offer_access_codes.ts`: fills missing public offer access codes.
- `002_backfill_record_owners.ts`: backfills offer and order owner metadata where it can be derived from linked records or existing users.
