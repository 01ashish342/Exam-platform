/*
  Warnings:

  - You are about to drop the column `correctOptionId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `selectedOptionId` on the `Response` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CORRECT', 'MULTI_CORRECT', 'TRUE_FALSE', 'FILL_BLANK');

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_correctOptionId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_selectedOptionId_fkey";

-- DropIndex
DROP INDEX "Question_correctOptionId_key";

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "isCorrect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "correctOptionId",
ADD COLUMN     "correctAnswerText" TEXT,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CORRECT';

-- AlterTable
ALTER TABLE "Response" DROP COLUMN "selectedOptionId",
ADD COLUMN     "answerText" TEXT;

-- CreateTable
CREATE TABLE "ResponseOption" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "ResponseOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResponseOption_responseId_optionId_key" ON "ResponseOption"("responseId", "optionId");

-- AddForeignKey
ALTER TABLE "ResponseOption" ADD CONSTRAINT "ResponseOption_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseOption" ADD CONSTRAINT "ResponseOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
