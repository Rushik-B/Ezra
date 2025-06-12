-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "inReplyTo" TEXT,
ADD COLUMN     "references" TEXT;
