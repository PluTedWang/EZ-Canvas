-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "program" TEXT,
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'en',
    "explanationLanguage" TEXT NOT NULL DEFAULT 'en',
    "writingLanguage" TEXT NOT NULL DEFAULT 'en'
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
