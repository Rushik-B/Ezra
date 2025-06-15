/*
  Warnings:

  - You are about to drop the column `safeReplyEndHour` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `safeReplyStartHour` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `unknownSenderHandling` on the `UserSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "safeReplyEndHour",
DROP COLUMN "safeReplyStartHour",
DROP COLUMN "unknownSenderHandling",
ALTER COLUMN "enablePushNotifications" SET DEFAULT true;

-- DropEnum
DROP TYPE "UnknownSenderHandling";
