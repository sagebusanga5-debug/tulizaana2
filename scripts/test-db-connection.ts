import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

console.log("\n🔍 === TEST DE CONNEXION POSTGRESQL TULIZAANA ===\n");

if (!dbUrl) {
  console.error("❌ ERREUR : La variable DATABASE_URL n'est pas définie dans votre fichier .env.");
  console.error("Format attendu : DATABASE_URL=\"postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public\"\n");
  process.exit(1);
}

// Masquage du mot de passe pour l'affichage sécurisé
const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":*****@");
console.log(`📡 URL configurée : ${maskedUrl}`);

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("⏳ Tentative de connexion au serveur PostgreSQL...");
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Connexion réussie à PostgreSQL !");

    // Vérification des tables
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    const communityCount = await prisma.community.count();
    const postCount = await prisma.post.count();

    console.log("\n📊 État actuel des données dans votre base :");
    console.log(`   - Utilisateurs : ${userCount}`);
    console.log(`   - Organisations : ${orgCount}`);
    console.log(`   - Cercles de soutien : ${communityCount}`);
    console.log(`   - Publications : ${postCount}`);

    if (userCount === 0 && orgCount === 0) {
      console.log("\n💡 Votre base est encore vide. Vous pouvez exécuter le script de seed :");
      console.log("   npm run db:seed\n");
    } else {
      console.log("\n🎉 Votre base de données est opérationnelle et peuplée !\n");
    }
  } catch (error: unknown) {
    console.error("\n❌ ÉCHEC DE CONNEXION :");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    console.log("\n💡 Conseils de dépannage pour cPanel :");
    console.log("1. Vérifiez que l'utilisateur PostgreSQL a TOUS les privilèges sur la base de données dans cPanel.");
    console.log("2. Vérifiez le nom de la base et de l'utilisateur (cPanel ajoute souvent un préfixe, ex: moncompte_tulizaana).");
    console.log("3. Lancez 'npx prisma migrate deploy' pour créer les tables si la connexion réussit.\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
