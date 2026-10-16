-- Recherche globale (Chantier 8.6).
-- Les index text_pattern_ops accelerent les recherches par prefixe et restent
-- compatibles avec les requetes Prisma existantes. Les filtres de visibilite
-- (statut, isPrivate, adhesion) restent appliques au niveau applicatif.
CREATE INDEX "Organization_name_search_idx" ON "Organization" ("name" text_pattern_ops);
CREATE INDEX "Community_name_search_idx" ON "Community" ("name" text_pattern_ops);
CREATE INDEX "Campaign_title_search_idx" ON "Campaign" ("title" text_pattern_ops);
CREATE INDEX "Post_content_search_idx" ON "Post" ("content" text_pattern_ops);
CREATE INDEX "User_name_search_idx" ON "User" ("name" text_pattern_ops);
