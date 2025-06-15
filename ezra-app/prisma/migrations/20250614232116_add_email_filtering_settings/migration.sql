-- CreateEnum
CREATE TYPE "ReplyScope" AS ENUM ('ALL_SENDERS', 'CONTACTS_ONLY');

-- CreateEnum
CREATE TYPE "UnknownSenderHandling" AS ENUM ('ASK_FIRST', 'ALWAYS_REPLY', 'NEVER_REPLY');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "allowedSenders" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blockedSenders" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enablePushNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyScope" "ReplyScope" NOT NULL DEFAULT 'CONTACTS_ONLY',
ADD COLUMN     "safeReplyEndHour" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "safeReplyStartHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "unknownSenderHandling" "UnknownSenderHandling" NOT NULL DEFAULT 'ASK_FIRST';
