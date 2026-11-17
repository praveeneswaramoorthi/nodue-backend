-- AlterTable: Make classroomId nullable in Advisor table
ALTER TABLE "Advisor" ALTER COLUMN "classroomId" DROP NOT NULL;
