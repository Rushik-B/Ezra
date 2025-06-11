-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionHistoryType" ADD VALUE 'EMAIL_LABELED';
ALTER TYPE "ActionHistoryType" ADD VALUE 'LABEL_CREATED';
ALTER TYPE "ActionHistoryType" ADD VALUE 'LABEL_UPDATED';
ALTER TYPE "ActionHistoryType" ADD VALUE 'LABEL_DELETED';

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "gmailLabelId" TEXT,
    "isSystemLabel" BOOLEAN NOT NULL DEFAULT false,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "messageListVisibility" TEXT,
    "labelListVisibility" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EmailLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EmailLabels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ActionHistoryLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActionHistoryLabels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ThreadLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ThreadLabels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Label_userId_isCustom_idx" ON "Label"("userId", "isCustom");

-- CreateIndex
CREATE UNIQUE INDEX "Label_userId_name_key" ON "Label"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Label_userId_gmailLabelId_key" ON "Label"("userId", "gmailLabelId");

-- CreateIndex
CREATE INDEX "_EmailLabels_B_index" ON "_EmailLabels"("B");

-- CreateIndex
CREATE INDEX "_ActionHistoryLabels_B_index" ON "_ActionHistoryLabels"("B");

-- CreateIndex
CREATE INDEX "_ThreadLabels_B_index" ON "_ThreadLabels"("B");

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailLabels" ADD CONSTRAINT "_EmailLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailLabels" ADD CONSTRAINT "_EmailLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActionHistoryLabels" ADD CONSTRAINT "_ActionHistoryLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "ActionHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActionHistoryLabels" ADD CONSTRAINT "_ActionHistoryLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThreadLabels" ADD CONSTRAINT "_ThreadLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThreadLabels" ADD CONSTRAINT "_ThreadLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
