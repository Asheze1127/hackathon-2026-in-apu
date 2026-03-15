-- Remove only concrete_question (abstract_questions and nodes.abstract_question_id are kept)
ALTER TABLE "nodes" DROP CONSTRAINT IF EXISTS "nodes_concrete_question_id_fkey";
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "concrete_question_id";
DROP TABLE IF EXISTS "concrete_questions";
