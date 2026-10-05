global.window = { Matheasy: {} };
require('../scripts/matrix.js');
const M = window.Matheasy;
const P = '\\begin{pmatrix}a & b\\\\ c & d\\end{pmatrix}';
const cases = [
  ['+col', P, 'addCol', '\\begin{pmatrix}a & b & \\placeholder{}\\\\ c & d & \\placeholder{}\\end{pmatrix}'],
  ['−col', P, 'removeCol', '\\begin{pmatrix}a\\\\ c\\end{pmatrix}'],
  ['+lig', P, 'addRow', '\\begin{pmatrix}a & b\\\\ c & d\\\\ \\placeholder{} & \\placeholder{}\\end{pmatrix}'],
  ['−lig', P, 'removeRow', '\\begin{pmatrix}a & b\\end{pmatrix}'],
  ['une colonne ne se supprime pas', '\\begin{pmatrix}a\\\\ b\\end{pmatrix}', 'removeCol', null],
  ['une ligne ne se supprime pas', '\\begin{pmatrix}a & b\\end{pmatrix}', 'removeRow', null],
  ['hors bloc', 'x+1=2', 'addCol', null],
  ['deux blocs : ambigu', P + '=' + P, 'addCol', null],
  ['bloc dans une formule', 'M=' + P + '+N', 'addCol', 'M=\\begin{pmatrix}a & b & \\placeholder{}\\\\ c & d & \\placeholder{}\\end{pmatrix}+N'],
  ['système', '\\begin{cases}x+y=3\\\\ x-y=1\\end{cases}', 'addRow', '\\begin{cases}x+y=3\\\\ x-y=1\\\\ \\placeholder{}\\end{cases}'],
  ['cellules avec accolades', '\\begin{pmatrix}\\frac{a}{b} & c\\\\ d & e\\end{pmatrix}', 'addCol', '\\begin{pmatrix}\\frac{a}{b} & c & \\placeholder{}\\\\ d & e & \\placeholder{}\\end{pmatrix}'],
  ['ligne finale vide ignorée', '\\begin{pmatrix}a & b\\\\ \\end{pmatrix}', 'addCol', '\\begin{pmatrix}a & b & \\placeholder{}\\end{pmatrix}'],
];
let ko = 0;
for (const [name, input, op, expected] of cases) {
  const got = M.arrayEdit(input, op);
  const norm = (x) => (x === null ? null : x.replace(/\s+/g, ''));
  if (norm(got) === norm(expected)) console.log('ok  ', name); else { ko++; console.log('KO  ', name, '\n  obtenu :', got, '\n  attendu:', expected); }
}
console.log(ko ? ko + ' échec(s)' : 'tous les tests passent (' + cases.length + ')');
process.exit(ko ? 1 : 0);
