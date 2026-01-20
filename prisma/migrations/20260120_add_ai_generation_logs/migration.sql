-- CreateTable
CREATE TABLE "ai_generation_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model_name" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL,
    "prompt" TEXT,
    "prompt_url" TEXT,
    "parameters" JSONB,
    "result" JSONB,
    "result_url" TEXT,
    "result_text" TEXT,
    "result_images" TEXT[],
    "duration_ms" INTEGER,
    "token_usage" JSONB,
    "cost" DOUBLE PRECISION,
    "retry_index" INTEGER,
    "recipe_id" TEXT,
    "job_id" TEXT,
    "user_id" TEXT,
    "error_message" TEXT,
    "error_stack" TEXT,
    "warning" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_generation_logs_session_id_idx" ON "ai_generation_logs"("session_id");

-- CreateIndex
CREATE INDEX "ai_generation_logs_timestamp_idx" ON "ai_generation_logs"("timestamp");

-- CreateIndex
CREATE INDEX "ai_generation_logs_model_name_idx" ON "ai_generation_logs"("model_name");

-- CreateIndex
CREATE INDEX "ai_generation_logs_status_idx" ON "ai_generation_logs"("status");

-- CreateIndex
CREATE INDEX "ai_generation_logs_step_name_idx" ON "ai_generation_logs"("step_name");

-- CreateIndex
CREATE INDEX "ai_generation_logs_recipe_id_idx" ON "ai_generation_logs"("recipe_id");

-- CreateIndex
CREATE INDEX "ai_generation_logs_job_id_idx" ON "ai_generation_logs"("job_id");
