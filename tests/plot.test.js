global.window = { Matheasy: {} };
require('../scripts/plot.js');
const M = window.Matheasy;
let ko = 0;
function eq(name, got, exp) { const ok = Math.abs(got - exp) < 1e-9 || (Number.isNaN(got) && Number.isNaN(exp)); if (ok) console.log('ok  ', name); else { ko++; console.log('KO  ', name, got, exp); } }
const f = (s, x) => M.compileFunction(s)(x);
eq('polynôme', f('2x^(3)-sqrt(7x)', 4), 128 - Math.sqrt(28));
eq('implicite', f('2(x+1)(x-1)', 3), 16);
eq('fraction', f('(x^(2)-4)/(x+1)', 3), 5 / 4);
eq('priorité -x^2', f('-x^2', 3), -9);
eq('abs', f('abs(x-2)', -1), 3);
eq('nthroot négatif', f('nthroot(x,3)', -8), -2);
eq('sqrt négatif', f('sqrt(x)', -1), NaN);
eq('trigo', f('sin(pi/2)', 0), 1);
eq('puissance négative', f('2^-1', 0), 0.5);
const r = M.findRoots(M.compileFunction('x^2-4'), -5, 5);
eq('2 zéros', r.length, 2); eq('zéro -2', r[0], -2); eq('zéro 2', r[1], 2);
eq('asymptote sans zéro', M.findRoots(M.compileFunction('1/x'), -5, 5).length, 0);
try { M.compileFunction('foo(x)'); ko++; console.log('KO  inconnu'); } catch (e) { console.log('ok   erreur :', e.message); }
console.log(ko ? ko + ' échec(s)' : 'tous les tests passent');
process.exit(ko ? 1 : 0);
