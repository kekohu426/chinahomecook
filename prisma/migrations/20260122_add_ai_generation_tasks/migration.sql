-- CreateEnum
CREATE TYPE "AIGenerationTaskType" AS ENUM ('text', 'image');

-- CreateEnum
CREATE TYPE "AIGenerationTaskStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "ai_generation_tasks" (
    "id" BIGSERIAL NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "task_type" "AIGenerationTaskType" NOT NULL,
    "status" "AIGenerationTaskStatus" NOT NULL,
    "model_name" TEXT NOT NULL,
    "input_prompt" TEXT,
    "input_parameters" JSONB,
    "output_result" JSONB,
    "cost" DECIMAL(10,4),
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_generation_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_generation_tasks" ADD CONSTRAINT "ai_generation_tasks_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ai_generation_tasks_recipe_id_idx" ON "ai_generation_tasks"("recipe_id");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_task_type_idx" ON "ai_generation_tasks"("task_type");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_status_idx" ON "ai_generation_tasks"("status");

-- CreateIndex
CREATE INDEX "ai_generation_tasks_created_at_idx" ON "ai_generation_tasks"("created_at");
