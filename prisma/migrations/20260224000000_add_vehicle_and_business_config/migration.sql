-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "vehicleModel" TEXT;
ALTER TABLE "invoices" ADD COLUMN "vehicleNumber" TEXT;

-- CreateTable
CREATE TABLE "business_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gstin" TEXT NOT NULL DEFAULT '',
    "logoPath" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
