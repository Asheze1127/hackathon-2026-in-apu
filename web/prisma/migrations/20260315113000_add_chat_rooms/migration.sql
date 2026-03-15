CREATE TABLE "chat_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "room_type" VARCHAR(20) NOT NULL,
    "created_by" UUID NOT NULL,
    "goal" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_rooms_room_type_check" CHECK ("room_type" IN ('dm_model', 'community')),
    CONSTRAINT "chat_rooms_name_check" CHECK (char_length(btrim("name")) > 0)
);

CREATE TABLE "chat_room_members" (
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_room_members_pkey" PRIMARY KEY ("room_id", "user_id")
);

CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "messages_content_check" CHECK (char_length(btrim("content")) > 0)
);

CREATE INDEX "chat_rooms_room_type_idx" ON "chat_rooms"("room_type");
CREATE INDEX "chat_rooms_goal_idx" ON "chat_rooms"("goal");
CREATE INDEX "chat_rooms_created_by_idx" ON "chat_rooms"("created_by");
CREATE INDEX "chat_room_members_user_id_idx" ON "chat_room_members"("user_id");
CREATE INDEX "messages_room_id_created_at_idx" ON "messages"("room_id", "created_at");
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

ALTER TABLE "chat_rooms"
ADD CONSTRAINT "chat_rooms_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_room_members"
ADD CONSTRAINT "chat_room_members_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_room_members"
ADD CONSTRAINT "chat_room_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_room_id_fkey"
FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_sender_id_fkey"
FOREIGN KEY ("sender_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END
$$;
