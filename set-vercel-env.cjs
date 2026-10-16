const fs = require('fs');
const dotenv = require('dotenv');
const { spawnSync } = require('child_process');

const vars = dotenv.parse(fs.readFileSync('.env'));
const value = vars.DATABASE_URL;

if (!value || !value.trim()) {
  console.error('ERREUR : DATABASE_URL est absente ou vide dans .env');
  process.exit(1);
}

console.log('Enregistrement de DATABASE_URL dans Production...');

const result = spawnSync(
  'vercel',
  ['env', 'add', 'DATABASE_URL', 'production', '--force', '--sensitive', '--yes'],
  {
    input: value + '\n',
    encoding: 'utf8',
    windowsHide: true
  }
);

if (result.stdout) console.log(result.stdout);
if (result.stderr) console.error(result.stderr);

if (result.error || result.status !== 0) {
  console.error('ÉCHEC : vérifie le message précédent.');
  process.exit(1);
}

console.log('Commande terminée.');
