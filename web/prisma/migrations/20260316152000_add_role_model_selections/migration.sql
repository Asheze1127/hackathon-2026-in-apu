CREATE TABLE "role_model_selections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_model_user_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_model_selections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "role_model_selections_user_role_model_check" CHECK ("user_id" <> "role_model_user_id")
);

CREATE UNIQUE INDEX "role_model_selections_user_id_role_model_user_id_key"
ON "role_model_selections"("user_id", "role_model_user_id");

CREATE INDEX "role_model_selections_user_id_is_primary_idx"
ON "role_model_selections"("user_id", "is_primary");

CREATE INDEX "role_model_selections_role_model_user_id_idx"
ON "role_model_selections"("role_model_user_id");

CREATE UNIQUE INDEX "role_model_selections_primary_per_user_idx"
ON "role_model_selections"("user_id")
WHERE "is_primary" = true;

ALTER TABLE "role_model_selections"
ADD CONSTRAINT "role_model_selections_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_model_selections"
ADD CONSTRAINT "role_model_selections_role_model_user_id_fkey"
FOREIGN KEY ("role_model_user_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
