ALTER TABLE "profiles"
ADD COLUMN "avatar_url" TEXT,
ADD COLUMN "current_occupation" TEXT,
ADD COLUMN "age" SMALLINT,
ADD COLUMN "location" TEXT;

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_avatar_url_check"
CHECK ("avatar_url" IS NULL OR char_length(btrim("avatar_url")) > 0),
ADD CONSTRAINT "profiles_current_occupation_check"
CHECK ("current_occupation" IS NULL OR char_length(btrim("current_occupation")) > 0),
-- Maximum supported human age to reject obvious invalid input.
ADD CONSTRAINT "profiles_age_check"
CHECK ("age" IS NULL OR ("age" >= 0 AND "age" <= 150)),
ADD CONSTRAINT "profiles_location_check"
CHECK ("location" IS NULL OR char_length(btrim("location")) > 0);
