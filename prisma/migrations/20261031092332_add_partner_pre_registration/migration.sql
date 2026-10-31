/*
  Warnings:

  - The `interventionDomains` column on the `PartnerPreRegistration` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "Campaign_title_search_idx";

-- DropIndex
DROP INDEX "Community_name_search_idx";

-- DropIndex
DROP INDEX "Organization_name_search_idx";

-- DropIndex
DROP INDEX "Post_content_search_idx";

-- DropIndex
DROP INDEX "User_name_search_idx";

-- AlterTable
ALTER TABLE "PartnerPreRegistration" DROP COLUMN "interventionDomains",
ADD COLUMN     "interventionDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "PartnerPreRegistration_pkey" PRIMARY KEY ("id");
