-- CreateTable
CREATE TABLE "user_login_streaks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_login_date" TIMESTAMP(3) NOT NULL,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "max_streak_count" INTEGER NOT NULL DEFAULT 0,
    "weekly_logins" JSONB NOT NULL DEFAULT '[false,false,false,false,false,false,false]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_login_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_login_streaks_user_id_key" ON "user_login_streaks"("user_id");

-- CreateIndex
CREATE INDEX "posts_created_at_expires_at_idx" ON "posts"("created_at", "expires_at");

-- AddForeignKey
ALTER TABLE "user_login_streaks" ADD CONSTRAINT "user_login_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
