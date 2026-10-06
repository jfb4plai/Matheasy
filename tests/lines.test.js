global.window = { Matheasy: {} };
require('../scripts/lines.js');
const M = window.Matheasy;
const cases = [
  ['simple', 'x+1=2', [{ latex: 'x+1=2', note: '' }]],
  ['deux lignes', '2x+1=7\\\\2x=6', [{ latex: '2x+1=7', note: '' }, { latex: '2x=6', note: '' }]],
  ['displaylines', '\\displaylines{x+1=2\\\\ 2x=1}', [{ latex: 'x+1=2', note: '' }, { latex: '2x=1', note: '' }]],
  ['displaylines + ligne vide finale', '\\displaylines{x+1=2\\\\ }', [{ latex: 'x+1=2', note: '' }]],
  ['commentaire', '4x=21-7\\quad\\text{7 passe à droite}\\\\4x=28', [{ latex: '4x=21-7', note: '7 passe à droite' }, { latex: '4x=28', note: '' }]],
  ['commentaire sans quad', '2x=12\\text{ok}', [{ latex: '2x=12', note: 'ok' }]],
  ['qquad + espaces', 'a=b\\qquad \\ \\text{car a vaut b}', [{ latex: 'a=b', note: 'car a vaut b' }]],
  ['matrice non coupée', '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=M\\\\x=1', [{ latex: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=M', note: '' }, { latex: 'x=1', note: '' }]],
  ['aligned non coupé', '\\begin{aligned}a&=1\\\\b&=2\\end{aligned}', [{ latex: '\\begin{aligned}a&=1\\\\b&=2\\end{aligned}', note: '' }]],
  ['accolades imbriquées', '\\frac{\\text{a}}{b}=1\\\\y=2', [{ latex: '\\frac{\\text{a}}{b}=1', note: '' }, { latex: 'y=2', note: '' }]],
  ['texte au milieu conservé', 'x=\\text{si } y>0\\\\z=1', [{ latex: 'x=\\text{si } y>0', note: '' }, { latex: 'z=1', note: '' }]],
  ['échappements du commentaire', 'a=1\\quad\\text{100\\% sûr}', [{ latex: 'a=1', note: '100% sûr' }]],
  ['titre d\'exercice (texte seul)', '\\text{Exercice 1}\\\\x+1=2', [{ latex: '', note: 'Exercice 1' }, { latex: 'x+1=2', note: '' }]],
  ['vide', '', []],
];
let ko = 0;
for (const [name, input, expected] of cases) {
  const got = M.splitLines(input);
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) console.log('ok  ', name); else { ko++; console.log('KO  ', name, '\n  obtenu :', JSON.stringify(got), '\n  attendu:', JSON.stringify(expected)); }
}
console.log(ko ? ko + ' échec(s)' : 'tous les tests passent (' + cases.length + ')');
process.exit(ko ? 1 : 0);
