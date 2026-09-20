-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalendarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "assignmentId" TEXT,
    "source" TEXT NOT NULL,
    "canvasId" INTEGER,
    "title" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CalendarItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalendarItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CalendarItem_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CalendarItem" ("allDay", "canvasId", "courseId", "endAt", "id", "location", "source", "startAt", "title", "userId") SELECT "allDay", "canvasId", "courseId", "endAt", "id", "location", "source", "startAt", "title", "userId" FROM "CalendarItem";
DROP TABLE "CalendarItem";
ALTER TABLE "new_CalendarItem" RENAME TO "CalendarItem";
CREATE UNIQUE INDEX "CalendarItem_userId_source_canvasId_key" ON "CalendarItem"("userId", "source", "canvasId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
