-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "goal" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abstract_questions" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abstract_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concrete_questions" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concrete_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "concrete_question_id" UUID NOT NULL,
    "abstract_question_id" UUID,
    "concrete_answer" TEXT NOT NULL,
    "abstract_answer" TEXT,
    "real_tags" JSONB NOT NULL DEFAULT '[]',
    "emotional_tags" JSONB NOT NULL DEFAULT '[]',
    "visual_state" VARCHAR(50),
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_type_idx" ON "tags"("type");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "nodes_user_id_idx" ON "nodes"("user_id");

-- CreateIndex
CREATE INDEX "nodes_parent_id_idx" ON "nodes"("parent_id");

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_concrete_question_id_fkey" FOREIGN KEY ("concrete_question_id") REFERENCES "concrete_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_abstract_question_id_fkey" FOREIGN KEY ("abstract_question_id") REFERENCES "abstract_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
