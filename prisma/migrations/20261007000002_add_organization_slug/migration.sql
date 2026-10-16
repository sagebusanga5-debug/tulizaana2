-- CreateTable (champ slug manquant sur Organization)
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;

-- Indice unique pour le slug public
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Index de recherche par slug
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");