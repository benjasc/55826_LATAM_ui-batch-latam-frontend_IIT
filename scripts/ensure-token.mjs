// Crea token.json (vacío) en la raíz del proyecto si no existe.
// El environment de desarrollo lo importa, así que debe existir para compilar.
// token.json está en .gitignore: NUNCA se versiona.
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const tokenPath = fileURLToPath(new URL('../token.json', import.meta.url));

if (!existsSync(tokenPath)) {
  writeFileSync(tokenPath, '""\n');
  console.log('[token] Se creó token.json vacío. Pega tu token entre las comillas para probar en local.');
}
