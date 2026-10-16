import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Decimal } from "@prisma/client/runtime/library.js";

dotenv.config();

const prisma = new PrismaClient();

/**
 * Mots de passe des comptes de démonstration.
 *
 * Aucun mot de passe n'est écrit dans ce fichier. Un compte de démonstration
 * n'existe que si sa variable d'environnement est renseignée dans
 * l'environnement du serveur qui exécute le seed.
 *
 * Les noms reprennent exactement le rôle stocké en base (colonne `User.role`),
 * et non un libellé commercial, afin qu'une variable corresponde sans ambiguïté
 * à un seul compte.
 */
const DEMO_ACCOUNT_PASSWORDS = [
  {
    key: "partnerAdmin",
    envVar: "DEMO_PARTNER_ADMIN_PASSWORD",
    account: "coordination@panzi-tulizaana.org",
    role: "partner_admin",
  },
  {
    key: "peerHelper",
    envVar: "DEMO_PEER_HELPER_PASSWORD",
    account: "amina.drepa@tulizaana.cd",
    role: "peer_helper",
  },
  {
    key: "activeMember",
    envVar: "DEMO_MEMBER_PASSWORD",
    account: "jean.marc@tulizaana.cd",
    role: "member",
  },
] as const;

/** Longueur minimale exigée pour un mot de passe de démonstration. */
const MIN_DEMO_PASSWORD_LENGTH = 12;

/**
 * Détermine les comptes de démonstration réellement secrets.
 *
 * Trois cas, tous explicites :
 *  - les variables sont renseignées : les comptes sont créés et hashés ;
 *  - aucune variable n'est renseignée : la section de démonstration est
 *    ignorée, avec un avertissement nommant les variables attendues ;
 *  - configuration partielle : échec immédiat, car un jeu de données à moitié
 *    peuplé produirait des liens cassés entre comptes, cercles et publications.
 *
 * Il n'existe aucun mot de passe de substitution : aucun compte n'est inséré
 * sans secret, et aucun secret n'est devinable à partir du dépôt.
 */
function resolveDemoAccountPasswords(): Map<string, string> {
  const provided = new Map<string, string>();
  const missing: string[] = [];

  for (const demo of DEMO_ACCOUNT_PASSWORDS) {
    const secret = process.env[demo.envVar]?.trim();

    if (!secret) {
      missing.push(demo.envVar);
      continue;
    }

    if (secret.length < MIN_DEMO_PASSWORD_LENGTH) {
      throw new Error(
        `${demo.envVar} est trop court : ${secret.length} caractère(s), ` +
          `${MIN_DEMO_PASSWORD_LENGTH} minimum requis pour le compte de démonstration ` +
          `${demo.account} (rôle ${demo.role}).`
      );
    }

    provided.set(demo.key, secret);
  }

  if (missing.length === DEMO_ACCOUNT_PASSWORDS.length) {
    console.warn(
      "⚠️  Aucun mot de passe de démonstration fourni : " +
        `${DEMO_ACCOUNT_PASSWORDS.map((demo) => demo.envVar).join(", ")} ` +
        "sont absentes de l'environnement. Les comptes de démonstration, leurs " +
        "adhésions, leurs publications et les codes d'invitation associés ne seront " +
        "pas créés. Les organisations et les cercles ne sont pas affectés."
    );
    return new Map();
  }

  if (missing.length > 0) {
    throw new Error(
      "Configuration des comptes de démonstration incomplète. Variable(s) manquante(s) : " +
        `${missing.join(", ")}. Renseignez les ${DEMO_ACCOUNT_PASSWORDS.length} variables ` +
        "pour créer les comptes de démonstration, ou retirez-les toutes pour ne pas les créer. " +
        "Aucun mot de passe par défaut n'existe : le seed est interrompu pour ne jamais " +
        "produire de compte avec un secret connu du dépôt."
    );
  }

  return provided;
}

async function main() {
  console.log("🌱 Début de l'injection des données de démarrage Tulizaana...");

  // 0. PLANS
  const basicPlan = await prisma.plan.upsert({
    where: { code: "basic" },
    update: {},
    create: {
      code: "basic",
      name: "Initiative & Communauté",
      description: "Plan d'entrée pour la découverte.",
      priceMonthly: new Decimal("0"),
      currency: "USD",
      billingPeriod: "monthly",
      communitiesMax: 1,
      membersMax: 250,
      campaignsPerMonth: 1,
      reportLevel: "basic",
      active: true,
    },
  });

  const starterPlan = await prisma.plan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter ONG",
      description: "Formule de démarrage pour les ONG.",
      priceMonthly: new Decimal("149"),
      currency: "USD",
      billingPeriod: "monthly",
      communitiesMax: 1,
      membersMax: 500,
      campaignsPerMonth: 2,
      reportLevel: "basic",
      active: true,
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { code: "growth" },
    update: {},
    create: {
      code: "growth",
      name: "Growth Association",
      description: "Formule intermédiaire pour les associations.",
      priceMonthly: new Decimal("399"),
      currency: "USD",
      billingPeriod: "monthly",
      communitiesMax: 5,
      membersMax: 5000,
      campaignsPerMonth: 10,
      reportLevel: "intermediate",
      active: true,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { code: "enterprise" },
    update: {},
    create: {
      code: "enterprise",
      name: "Institution & Fondation",
      description: "Formule avancée pour les institutions.",
      priceMonthly: new Decimal("899"),
      currency: "USD",
      billingPeriod: "monthly",
      communitiesMax: 25,
      membersMax: 50000,
      campaignsPerMonth: 50,
      reportLevel: "advanced",
      active: true,
    },
  });

  console.log("✅ Plans créés : basic, starter, growth, enterprise");

  // Résolu avant toute écriture : une configuration incohérente ne doit jamais
  // laisser une base à moitié peuplée.
  const demoPasswords = resolveDemoAccountPasswords();
  const demoAccountsEnabled = demoPasswords.size > 0;

  const demoHashes = new Map<string, string>();
  for (const demo of DEMO_ACCOUNT_PASSWORDS) {
    const secret = demoPasswords.get(demo.key);
    if (secret) {
      demoHashes.set(demo.key, await bcrypt.hash(secret, 10));
    }
  }

  const requireDemoHash = (key: string): string => {
    const hash = demoHashes.get(key);
    if (!hash) {
      throw new Error(`Empreinte de démonstration absente pour le compte ${key}.`);
    }
    return hash;
  };

  // 1. ORGANISATIONS PARTENAIRES
  const panziOrg = await prisma.organization.upsert({
    where: { id: "org-panzi" },
    // Chantier 8.5 : le slug public doit être présent sur l'organisation
    // seedée, même si l'enregistrement existait déjà sans slug (créé avant
    // la migration). La mise à jour est volontaire pour garantir la
    // disponibilité du slug public.
    update: { slug: "panzi" },
    create: {
      id: "org-panzi",
      slug: "panzi",
      name: "Fondation Panzi & Partenaires",
      acronym: "PANZI",
      domain: "Survivantes de Violences & Traumatisme Holistique",
      mission: "Fournir une prise en charge holistique (médicale, psychologique, juridique et socio-économique) aux personnes résilientes.",
      description: "Accompagnement médical, psychologique et réinsertion sociale pour les survivantes de violences et traumatismes en Afrique Centrale.",
      type: "fondation",
      country: "République Démocratique du Congo",
      city: "Bukavu",
      address: "Quartier Panzi, Bukavu, Sud-Kivu",
      responsibleName: "Dr. Denise Mwambayi",
      responsibleTitle: "Médecin Référente & Coordinatrice Psychosociale",
      contactEmail: "coordination@panzi-tulizaana.org",
      contactPhone: "+243 99 876 5432",
      status: "approved",
      subscriptionPlan: "enterprise",
      planId: enterprisePlan.id,
      quotaCommunitiesMax: 20,
      quotaMembersMax: 10000,
      quotaCampaignsMax: 50,
      validatedAt: new Date(),
      subscriptionStartedAt: new Date(),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      paymentStatus: "validated",
    },
  });

  const aldDrepaOrg = await prisma.organization.upsert({
    where: { id: "org-ald-drepa" },
    // Chantier 8.5 : idem à panzi — le slug public doit être présent même si
    // l'organisation existait déjà sans slug.
    update: { slug: "ald-rdc" },
    create: {
      id: "org-ald-drepa",
      slug: "ald-rdc",
      name: "Association de Lutte contre la Drépanocytose en RDC",
      acronym: "ALD-RDC",
      domain: "Drépanocytose & Maladies Hématologiques Chroniques",
      mission: "Sensibiliser, accompagner les familles et briser l'isolement des drépanocytaires par l'entraide de pairs.",
      description: "Organisation pionnière en RDC dédiée au soutien continu des enfants, jeunes et adultes drépanocytaires.",
      type: "ong",
      country: "République Démocratique du Congo",
      city: "Kinshasa",
      address: "Commune de Limete, Kinshasa",
      responsibleName: "Prof. Dieudonné Mukendi",
      responsibleTitle: "Président Fondateur & Hématologue",
      contactEmail: "contact@ald-drepa.cd",
      contactPhone: "+243 81 234 5678",
      status: "approved",
      subscriptionPlan: "growth",
      planId: growthPlan.id,
      quotaCommunitiesMax: 5,
      quotaMembersMax: 3000,
      quotaCampaignsMax: 10,
      validatedAt: new Date(),
      // Chantier 4 : activation explicite, voir le commentaire de l'organisation
      // Panzi ci-dessus. Sans ces trois champs, cette organisation resterait en
      // `SUBSCRIPTION_REQUIRED` malgre `status: "approved"`.
      subscriptionStartedAt: new Date(),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      paymentStatus: "validated",
    },
  });

  console.log("✅ Organisations créées : Panzi et ALD-RDC");

  // 2. UTILISATEURS SOCLES
  // Aucun mot de passe par défaut n'est ecrit dans ce fichier. Le compte
  // administrateur n'est cree que si ADMIN_SEED_PASSWORD est fourni par
  // l'environnement (secret de deploiement, jamais versionne).
  const superAdminSeedPassword = process.env.ADMIN_SEED_PASSWORD?.trim();

  const superAdmin = superAdminSeedPassword
    ? await prisma.user.upsert({
        where: { email: "admin@tulizaana.org" },
        update: {},
        create: {
          name: "Sage Busanga",
          pseudonym: "SuperAdmin_Tulizaana",
          email: "admin@tulizaana.org",
          passwordHash: await bcrypt.hash(superAdminSeedPassword, 10),
          role: "superadmin",
          memberStatus: "ambassador",
          country: "RDC",
          city: "Kinshasa",
          phoneNumber: "+243 82 000 0001",
          bio: "Administrateur de la plateforme Tulizaana pour la santé mentale et le bien-être solidaire.",
          points: 500,
        },
      })
    : null;

  if (superAdmin) {
    console.log("✅ Compte administrateur initial créé (mot de passe issu de ADMIN_SEED_PASSWORD)");
  } else {
    console.warn(
      "⚠️  ADMIN_SEED_PASSWORD absent : le compte administrateur initial n'a pas été créé. " +
        "Définissez cette variable d'environnement avant d'exécuter le seed si vous souhaitez l'établir."
    );
  }

// Ces trois comptes sont indissociables : chacun est référencé par une
  // adhésion, une publication ou un code d'invitation. Ils ne sont donc créés
  // qu'ensemble, et uniquement si leurs trois secrets sont fournis.
  let partnerAdmin: { id: string } | null = null;
  let peerHelper: { id: string } | null = null;
  let activeMember: { id: string } | null = null;

  if (demoAccountsEnabled) {
    partnerAdmin = await prisma.user.upsert({
      where: { email: "coordination@panzi-tulizaana.org" },
      update: {},
      create: {
        name: "Dr. Denise Mwambayi",
        pseudonym: "DrDenise_Panzi",
        email: "coordination@panzi-tulizaana.org",
        passwordHash: requireDemoHash("partnerAdmin"),
        role: "partner_admin",
        memberStatus: "mentor",
        country: "RDC",
        city: "Bukavu",
        phoneNumber: "+243 99 876 5432",
        bio: "Médecin et accompagnatrice psychosociale à la Fondation Panzi.",
        points: 350,
      },
    });

    peerHelper = await prisma.user.upsert({
      where: { email: "amina.drepa@tulizaana.cd" },
      update: {},
      create: {
        name: "Amina K.",
        pseudonym: "Amina_Courage",
        email: "amina.drepa@tulizaana.cd",
        passwordHash: requireDemoHash("peerHelper"),
        role: "peer_helper",
        memberStatus: "contributor",
        country: "RDC",
        city: "Kinshasa",
        phoneNumber: "+243 84 111 2233",
        bio: "Patientе drépanocytaire SS de 27 ans, pair-éducatrice et grande sœur d'écoute.",
        points: 240,
      },
    });

    activeMember = await prisma.user.upsert({
      where: { email: "jean.marc@tulizaana.cd" },
      update: {},
      create: {
        name: "Jean-Marc L.",
        pseudonym: "GuerrierSilencieux",
        email: "jean.marc@tulizaana.cd",
        passwordHash: requireDemoHash("activeMember"),
        role: "member",
        memberStatus: "active_participant",
        country: "RDC",
        city: "Goma",
        isAnonymous: true,
        bio: "En quête de sérénité et d'échanges bienveillants.",
        points: 90,
      },
    });

    console.log(
      "✅ Comptes de démonstration créés : partenaire, pair-aidant et membre " +
        "(mots de passe issus de l'environnement, hashés en bcrypt)"
    );
  }

  // 3. ASSIGNATION DES ADMINS D'ORGANISATION
  if (partnerAdmin) {
    await prisma.organizationAdmin.upsert({
      where: {
        organizationId_userId: {
          organizationId: panziOrg.id,
          userId: partnerAdmin.id,
        },
      },
      update: {},
      create: {
        organizationId: panziOrg.id,
        userId: partnerAdmin.id,
        role: "owner",
      },
    });
  }

  // 4. CERCLES DE SOUTIEN FERMÉS
  const commDrepa = await prisma.community.upsert({
    where: { slug: "drepanocytose-kinshasa" },
    update: {},
    create: {
      id: "comm-ald-drepa",
      name: "Cercle Drépanocytose & Espoir Kinshasa",
      slug: "drepanocytose-kinshasa",
      description: "Cercle fermé d'entraide pour les personnes vivant avec la drépanocytose (SS/SC) et les parents d'enfants drépanocytaires.",
      mission: "Rompre la solitude face aux crises douloureuses et partager des conseils éprouvés sur l'hydratation, l'école et le bien-être.",
      category: "maladies_chroniques",
      icon: "heart-pulse",
      coverImage: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&auto=format&fit=crop&q=80",
      isPrivate: true,
      status: "active",
      organizationId: aldDrepaOrg.id,
      rules: [
        "Confidentialité absolue : ce qui est partagé dans le cercle reste dans le cercle.",
        "Bienveillance et respect mutuel lors des témoignages de crises douloureuses.",
        "Aucune recommandation ou prescription médicale sauvage non validée par un médecin.",
        "Soutien solidaire et esprit de famille.",
      ],
    },
  });

  const commPanzi = await prisma.community.upsert({
    where: { slug: "renaissance-panzi" },
    update: {},
    create: {
      id: "comm-panzi-survivantes",
      name: "Renaissance & Résilience Bukavu",
      slug: "renaissance-panzi",
      description: "Espace protégé et confidentiel de libération de la parole et de guérison holistique.",
      mission: "Offrir un havre de paix, d'écoute attentive et de reconstruction de la dignité féminine.",
      category: "traumatisme_sante_mentale",
      icon: "shield-check",
      coverImage: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&auto=format&fit=crop&q=80",
      isPrivate: true,
      status: "active",
      organizationId: panziOrg.id,
      rules: [
        "Sécurité psychologique maximale : interdiction absolue de juger.",
        "Anonymat garanti si vous préférez témoigner avec un pseudo.",
        "Pas de redéclenchement de traumatismes : privilégier l'espoir et le chemin parcouru.",
        "Présence continue de modératrices formées à l'écoute empathique.",
      ],
    },
  });

  console.log("✅ Cercles de soutien créés : Drépanocytose Kinshasa et Renaissance Bukavu");

  // 5. ADHÉSIONS AUX CERCLES
  // Une adhesion n'existe que si le compte correspondant a ete cree : on ne
  // laisse jamais de lien vers un utilisateur absent.
  if (peerHelper) {
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: commDrepa.id,
          userId: peerHelper.id,
        },
      },
      update: {},
      create: {
        communityId: commDrepa.id,
        userId: peerHelper.id,
        role: "peer_helper",
        status: "active",
      },
    });
  }

  if (activeMember) {
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: commDrepa.id,
          userId: activeMember.id,
        },
      },
      update: {},
      create: {
        communityId: commDrepa.id,
        userId: activeMember.id,
        role: "member",
        status: "active",
      },
    });
  }

  if (partnerAdmin) {
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: commPanzi.id,
          userId: partnerAdmin.id,
        },
      },
      update: {},
      create: {
        communityId: commPanzi.id,
        userId: partnerAdmin.id,
        role: "professional",
        status: "active",
      },
    });
  }

  // 6. CODES D'INVITATION VALIDES POUR TESTER LE RECRUTEMENT
  // La colonne `createdBy` est obligatoire : les codes ne sont emis que si un
  // compte emetteur existe, faute de quoi ils seraient orphelins.
  const invitationIssuerId = superAdmin?.id ?? partnerAdmin?.id ?? null;

  if (!invitationIssuerId) {
    console.warn(
      "⚠️  Aucun compte emetteur disponible : les codes d'invitation de démonstration " +
        "n'ont pas été créés. Définissez ADMIN_SEED_PASSWORD ou les variables " +
        "DEMO_*_PASSWORD pour les obtenir."
    );
  } else {
    const inOneYear = new Date();
    inOneYear.setFullYear(inOneYear.getFullYear() + 1);

    await prisma.invitation.upsert({
      where: { code: "DREPA-2026-KIN" },
      update: { expiresAt: inOneYear, status: "active" },
      create: {
        code: "DREPA-2026-KIN",
        communityId: commDrepa.id,
        organizationId: aldDrepaOrg.id,
        maxUses: 100,
        currentUses: 2,
        status: "active",
        expiresAt: inOneYear,
        createdBy: invitationIssuerId,
      },
    });

    await prisma.invitation.upsert({
      where: { code: "PANZI-RESILIENCE" },
      update: { expiresAt: inOneYear, status: "active" },
      create: {
        code: "PANZI-RESILIENCE",
        communityId: commPanzi.id,
        organizationId: panziOrg.id,
        maxUses: 50,
        currentUses: 1,
        status: "active",
        expiresAt: inOneYear,
        createdBy: invitationIssuerId,
      },
    });

    console.log("✅ Codes d'invitation générés : DREPA-2026-KIN et PANZI-RESILIENCE");
  }

  // 7. PUBLICATIONS D'ACCUEIL DANS LE FIL
  // Ces publications sont signees par les comptes de demonstration : sans eux,
  // le fil demarre vide plutot que de contenir des messages sans auteur.
const postWelcome = peerHelper
    ? await prisma.post.create({
      data: {
        communityId: commDrepa.id,
        authorId: peerHelper.id,
        authorName: "Amina_Courage",
        title: "Bienvenue dans votre havre de paix et de solidarité 🌸",
        content:
          "Chers frères et sœurs de combat, ce cercle est né pour que nul ne traverse plus une crise vaso-occlusive dans l'isolement ou la peur. Vous pouvez ici déposer vos doutes, célébrer vos victoires, et poser toutes vos questions en toute franchise. Je suis là pour vous lire et vous épauler !",
        type: "announcement",
        isPinned: true,
        isAnonymous: false,
        tags: ["Bienvenue", "Entraide", "Drépanocytose", "Espoir"],
        reactionsSupport: 18,
        reactionsCourage: 24,
        reactionsUnderstand: 15,
        reactionsBravo: 12,
      },
    })
    : null;

  // Médias attachés au post
  if (postWelcome) {
    await prisma.postMedia.create({
      data: {
        postId: postWelcome.id,
        type: "image",
        url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&auto=format=fit=crop&q=80",
        position: 0,
      },
    });
  }

  // Premier commentaire bienveillant
  if (postWelcome && activeMember) {
    await prisma.comment.create({
      data: {
        postId: postWelcome.id,
        authorId: activeMember.id,
        authorName: "GuerrierSilencieux",
        isAnonymous: true,
        content:
          "Merci infiniment Amina pour cet accueil chaleureux. Savoir qu'on n'est pas seul change tout pour le moral. Courage à chacun d'entre nous !",
      },
    });

  console.log("✅ Publication d'accueil et premier commentaire créés");
  }

  // 8. LOG D'AUDIT
  await prisma.auditLog.create({
    data: {
      userName: "Système Tulizaana",
      userRole: "system",
      action: "DATABASE_INITIAL_SEED_COMPLETED",
      resource: "Ecosystem",
      details:
        `Peuplement initial réussi : 2 organisations, ` +
        `${superAdmin ? 1 : 0} compte(s) administrateur(s), ` +
        `${demoAccountsEnabled ? 3 : 0} compte(s) de démonstration, ` +
        "2 cercles fermés et les publications d'ancrage associées.",
      status: "success",
    },
  });

  console.log("🎉 Initialisation de la base PostgreSQL terminée avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
