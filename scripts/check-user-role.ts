import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@tulizaana.org" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuspended: true,
      },
    });

    if (!user) {
      console.log("❌ Utilisateur introuvable");
      return;
    }

    console.log("✅ Utilisateur trouvé :");
    console.log(JSON.stringify(user, null, 2));

    if (user.isSuspended) {
      console.log("⚠️  Ce compte est SUSPENDU");
    }

    const adminRoles = ["superadmin", "admin", "moderator", "partner_admin"];
    if (!adminRoles.includes(user.role)) {
      console.log(`❌ Rôle "${user.role}" n'est pas autorisé pour le back-office`);
      console.log(`   Rôles autorisés : ${adminRoles.join(", ")}`);
    } else {
      console.log(`✅ Rôle "${user.role}" est autorisé pour le back-office`);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
