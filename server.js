/**
 * Point d'entrée de production pour les environnements d'hébergement Node.js (cPanel, Phusion Passenger, etc.)
 * Ce fichier charge et exécute le bundle compilé `dist/server.cjs`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServerPath = path.resolve(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(distServerPath)) {
  console.error(
    '\n❌ ERREUR : Le fichier compilé dist/server.cjs est introuvable.\n' +
    'Veuillez exécuter la commande de build avant de démarrer le serveur :\n' +
    '  npm run build\n'
  );
  process.exit(1);
}

// Chargement du serveur de production compilé
require(distServerPath);
