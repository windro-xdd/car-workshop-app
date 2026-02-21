/*
  Warnings:

  - Added the required column `userId` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "grossAmount" REAL NOT NULL DEFAULT 0,
    "gstAmount" REAL NOT NULL DEFAULT 0,
    "netTotal" REAL NOT NULL DEFAULT 0,
    "gstPercentage" REAL NOT NULL DEFAULT 18.0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "isAmendment" BOOLEAN NOT NULL DEFAULT false,
    "originalInvoiceId" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("createdAt", "customerEmail", "customerName", "customerPhone", "grossAmount", "gstAmount", "gstPercentage", "id", "invoiceDate", "invoiceNumber", "isAmendment", "netTotal", "notes", "originalInvoiceId", "status", "updatedAt") SELECT "createdAt", "customerEmail", "customerName", "customerPhone", "grossAmount", "gstAmount", "gstPercentage", "id", "invoiceDate", "invoiceNumber", "isAmendment", "netTotal", "notes", "originalInvoiceId", "status", "updatedAt" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
