-- Chantier 7.10 final : suppression de la table legacy 	ulizaana_db.
--
-- Justification :
--   * table vide (0 ligne) ;
--   * non modélisée dans schema.prisma ;
--   * non référencée par l'application (src/, server/, scripts/, prisma/) ;
--   * aucune FK entrante ni sortante ;
--   * accompagnée uniquement de sa séquence 	ulizaana_db_id_seq, jamais utilisée.
--
-- Cette migration ne touche aucune table métier ni aucune donnée.
-- Elle est strictement tracée et versionnée.

DROP TABLE IF EXISTS "tulizaana_db";
