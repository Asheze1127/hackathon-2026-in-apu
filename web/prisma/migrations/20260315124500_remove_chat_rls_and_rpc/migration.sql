DROP POLICY IF EXISTS "chat_rooms_select_member" ON "chat_rooms";
DROP POLICY IF EXISTS "chat_rooms_insert_owner" ON "chat_rooms";
DROP POLICY IF EXISTS "chat_room_members_select_member" ON "chat_room_members";
DROP POLICY IF EXISTS "chat_room_members_insert_self" ON "chat_room_members";
DROP POLICY IF EXISTS "messages_select_member" ON "messages";
DROP POLICY IF EXISTS "messages_insert_sender_member" ON "messages";

ALTER TABLE "chat_rooms" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_room_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.ensure_dm_model_room(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.ensure_goal_community_room(TEXT);
