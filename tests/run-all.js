// Lance toutes les suites tests/*.test.js ; code de sortie 1 si l'une échoue (utilisé par tools/build-plugin.*)
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const suites = fs.readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of suites) {
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const last = out.trim().split('\n').pop();
  if (r.status === 0) {
    console.log('ok   ' + f + ' : ' + last);
  } else {
    failed++;
    console.log('KO   ' + f + '\n' + out.split('\n').filter((l) => !l.startsWith('ok')).join('\n'));
  }
}
console.log(failed ? failed + ' suite(s) en échec sur ' + suites.length : 'tous les tests passent (' + suites.length + ' suites)');
process.exit(failed ? 1 : 0);
