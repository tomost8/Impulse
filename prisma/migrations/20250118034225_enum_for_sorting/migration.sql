-- CreateEnum
CREATE TYPE "UserSortType" AS ENUM ('POINTS_WEEKLY', 'POINTS_MONTHLY', 'POINTS_ALL');

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
