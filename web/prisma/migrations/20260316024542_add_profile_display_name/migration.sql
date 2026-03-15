ALTER TABLE "profiles"
ADD COLUMN "display_name" VARCHAR(50);

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_display_name_check"
CHECK ("display_name" IS NULL OR char_length(btrim("display_name")) > 0);
