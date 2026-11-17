-- Migration: Make rollNumber unique per classroom instead of globally
DROP INDEX IF EXISTS "Student_rollNumber_key";

-- Create unique index scoped to classroomId (allows same roll numbers 1, 2, 3 across different classrooms)
CREATE UNIQUE INDEX "Student_classroomId_rollNumber_key" ON "Student"("classroomId", "rollNumber");
