/*
  Warnings:

  - The values [EMAIL_LABELED,LABEL_CREATED,LABEL_UPDATED,LABEL_DELETED] on the enum `ActionHistoryType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActionHistoryLabels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EmailLabels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ThreadLabels` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionHistoryType_new" AS ENUM ('EMAIL_SENT', 'EMAIL_REJECTED', 'EMAIL_EDITED', 'EMAIL_SNOOZED', 'EMAIL_ARCHIVED', 'MASTER_PROMPT_UPDATED', 'AUTONOMY_RULE_ADDED', 'SETTINGS_CHANGED');
ALTER TABLE "ActionHistory" ALTER COLUMN "actionType" TYPE "ActionHistoryType_new" USING ("actionType"::text::"ActionHistoryType_new");
ALTER TYPE "ActionHistoryType" RENAME TO "ActionHistoryType_old";
ALTER TYPE "ActionHistoryType_new" RENAME TO "ActionHistoryType";
DROP TYPE "ActionHistoryType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Label" DROP CONSTRAINT "Label_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ActionHistoryLabels" DROP CONSTRAINT "_ActionHistoryLabels_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActionHistoryLabels" DROP CONSTRAINT "_ActionHistoryLabels_B_fkey";

-- DropForeignKey
ALTER TABLE "_EmailLabels" DROP CONSTRAINT "_EmailLabels_A_fkey";

-- DropForeignKey
ALTER TABLE "_EmailLabels" DROP CONSTRAINT "_EmailLabels_B_fkey";

-- DropForeignKey
ALTER TABLE "_ThreadLabels" DROP CONSTRAINT "_ThreadLabels_A_fkey";

-- DropForeignKey
ALTER TABLE "_ThreadLabels" DROP CONSTRAINT "_ThreadLabels_B_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "interactionNetworkGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "masterPromptGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "strategicRulebookGenerated" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Label";

-- DropTable
DROP TABLE "_ActionHistoryLabels";

-- DropTable
DROP TABLE "_EmailLabels";

-- DropTable
DROP TABLE "_ThreadLabels";
