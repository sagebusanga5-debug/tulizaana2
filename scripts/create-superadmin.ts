import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || "admin@tulizaana.org";
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || "Administrateur";

  if (!password) {
    console.error("❌ SUPERADMIN_PASSWORD est requis");
    console.error("Définissez-le avec : export SUPERADMIN_PASSWORD=votre_mot_de_passe");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Le mot de passe doit faire au moins 6 caractères");
    process.exit(1);
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      console.log(`✅ L'utilisateur ${email} existe déjà`);
      console.log(`   Rôle actuel: ${existing.role}`);
      console.log(`   Suspendu: ${existing.isSuspended}`);

      // Mettre à jour le rôle si ce n'est pas superadmin
      if (existing.role !== "superadmin") {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "superadmin" },
        });
        console.log(`🔄 Rôle mis à jour à superadmin`);
      } else {
        console.log(`✅ Rôle est déjà superadmin`);
      }

      // Mettre à jour le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      });
      console.log(`🔄 Mot de passe mis à jour`);

      // Désuspendre si nécessaire
      if (existing.isSuspended) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { isSuspended: false },
        });
        console.log(`🔄 Compte réactivé (suspendu → actif)`);
      }
    } else {
      // Créer le compte superadmin
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          passwordHash,
          role: "superadmin",
          memberStatus: "active_participant",
          points: 0,
        },
      });

      console.log(`✅ Compte superadmin créé :`);
      console.log(`   Email: ${email}`);
      console.log(`   Nom: ${name}`);
      console.log(`   Rôle: superadmin`);
      console.log(`   ID: ${user.id}`);
    }

    console.log(`\n🎉 Vous pouvez maintenant vous connecter avec :`);
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${password}`);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
