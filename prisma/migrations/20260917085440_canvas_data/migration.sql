-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "term" TEXT,
    "instructor" TEXT,
    "color" INTEGER NOT NULL,
    "syllabus" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" DATETIME,
    "points" REAL,
    "submissionType" TEXT NOT NULL,
    "htmlUrl" TEXT NOT NULL,
    "rubric" JSONB,
    "attachments" JSONB,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "score" REAL,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "canvasUpdatedAt" DATETIME NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "moduleName" TEXT,
    "modulePosition" INTEGER,
    "url" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "body" TEXT,
    "postedAt" DATETIME,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "source" TEXT NOT NULL,
    "canvasId" INTEGER,
    "title" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    CONSTRAINT "CalendarItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalendarItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "canvasId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "canvasUserId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_userId_canvasId_key" ON "Course"("userId", "canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_courseId_canvasId_key" ON "Assignment"("courseId", "canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_courseId_type_canvasId_key" ON "Material"("courseId", "type", "canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarItem_userId_source_canvasId_key" ON "CalendarItem"("userId", "source", "canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_userId_canvasId_key" ON "Group"("userId", "canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_canvasUserId_key" ON "GroupMember"("groupId", "canvasUserId");
