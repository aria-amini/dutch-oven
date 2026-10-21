-- The pantry shelf and spice rack merge into one pantry location.
UPDATE "pantry_items" SET "location" = 'pantry' WHERE "location" IN ('pantry-shelf', 'spice-rack');
