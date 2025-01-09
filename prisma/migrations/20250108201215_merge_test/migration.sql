/*
  Warnings:

  - Made the column `first_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timezone` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL,
ALTER COLUMN "searchable" SET DEFAULT true,
ALTER COLUMN "timezone" SET NOT NULL,
ALTER COLUMN "username" SET NOT NULL;
