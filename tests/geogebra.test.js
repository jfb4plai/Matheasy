global.window = { Matheasy: {} };
require('../scripts/geogebra.js');
const M = window.Matheasy;
const cases = [
  ['polynôme', 'x^2-4', 'f(x)=x^(2)-4'],
  ['fraction', '\\frac{x^2-4}{x+1}', 'f(x)=(x^(2)-4)/(x+1)'],
  ['f(x)=', 'f(x)=2x+1', 'f(x)=2x+1'],
  ['y=', 'y=\\sqrt{x}', 'f(x)=sqrt(x)'],
  ['racine n', '\\sqrt[3]{x}', 'f(x)=nthroot(x,3)'],
  ['valeur absolue', '\\left|x-2\\right|', 'f(x)=abs(x-2)'],
  ['trigo', '\\sin\\left(x\\right)', 'f(x)=sin(x)'],
  ['cercle', 'x^2+y^2=4', 'x^(2)+y^(2)=4'],
  ['vide', '', ''],
];
let ko = 0;
for (const [n, i, e] of cases) { const g = M.latexToGgb(i); if (g === e) console.log('ok  ', n); else { ko++; console.log('KO  ', n, '\n  obtenu :', g, '\n  attendu:', e); } }
console.log(ko ? ko + ' échec(s)' : 'tous les tests passent (' + cases.length + ')');
process.exit(ko ? 1 : 0);
