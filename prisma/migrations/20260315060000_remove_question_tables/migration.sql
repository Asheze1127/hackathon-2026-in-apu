-- Remove question table FK constraints from nodes
ALTER TABLE "nodes" DROP CONSTRAINT IF EXISTS "nodes_concrete_question_id_fkey";
ALTER TABLE "nodes" DROP CONSTRAINT IF EXISTS "nodes_abstract_question_id_fkey";

-- Remove question ID columns from nodes
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "concrete_question_id";
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "abstract_question_id";

-- Drop question master tables (no longer needed; questions are fixed in business logic)
DROP TABLE IF EXISTS "concrete_questions";
DROP TABLE IF EXISTS "abstract_questions";
