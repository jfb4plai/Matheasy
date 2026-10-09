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
// Fonctions sans parenthèses (écriture produite par MathLive : \sin x -> « sin x »)
eq('sin x', f('sin x', 2), Math.sin(2));
eq('ln x', f('ln x', 5), Math.log(5));
eq('pi x', f('pi x', 2), 2 * Math.PI);
eq('sin 2x', f('sin 2x', 1), Math.sin(2));
eq('sin x cos x', f('sin x cos x', 1), Math.sin(1) * Math.cos(1));
eq('x sin x', f('x sin x', 2), 2 * Math.sin(2));
eq('sin^(2)x', f('sin^(2)x', 1), Math.pow(Math.sin(1), 2));
eq('sin^(2)(x)', f('sin^(2)(x)', 1), Math.pow(Math.sin(1), 2));
eq('sin -x', f('sin -x', 1), -Math.sin(1));
eq('exp reste exp', f('exp(x)', 1), Math.E);
eq('e x', f('ex', 2), 2 * Math.E);
eq('sinh avant sin', f('sinh x', 1), Math.sinh(1));
eq('sin x^2', f('sin x^2', 2), Math.sin(4));
eq('2x-3 / priorités', f('2x-3', 4), 5);
// Bout en bout : LaTeX MathLive -> commande -> fonction
global.window.Matheasy = M; require('../scripts/geogebra.js');
const viaLatex = (l, x) => M.compileFunction(/^[a-z]\(x\)=(.*)$/.exec(M.latexToGgb(l))[1])(x);
eq('LaTeX \\sin x', viaLatex('\\sin x', 1), Math.sin(1));
eq('LaTeX \\ln x+1', viaLatex('\\ln x+1', Math.E), 2);
eq('LaTeX \\pi x', viaLatex('\\pi x', 1), Math.PI);
eq('LaTeX \\sin^2x', viaLatex('\\sin^2x', 1), Math.pow(Math.sin(1), 2));
eq('LaTeX x\\cos x', viaLatex('x\\cos x', 1), Math.cos(1));
// Zéros doubles (la courbe touche l'axe sans le traverser)
const r2 = M.findRoots(M.compileFunction('(x-1.3)^2'), -5, 5);
eq('zéro double : 1 zéro', r2.length, 1); eq('zéro double : 1,3', Math.round(r2[0] * 1e6) / 1e6, 1.3);
const r3 = M.findRoots(M.compileFunction('(x+2)^2(x-1)'), -5, 5);
eq('double + simple : 2 zéros', r3.length, 2);
eq('x^2+0.01 : aucun zéro', M.findRoots(M.compileFunction('x^2+0.01'), -5, 5).length, 0);
eq('(x-1)^4 : 1 zéro', M.findRoots(M.compileFunction('(x-1)^4'), -5, 5).length, 1);
eq('cos x : 4 zéros sur [-5;5]', M.findRoots(M.compileFunction('cos x'), -5, 5).length, 4);
eq('tangence f=g', M.findRoots(function (x) { return x * x - (2 * x - 1); }, -5, 5).length, 1);
try { M.compileFunction('foo(x)'); ko++; console.log('KO  inconnu'); } catch (e) { console.log('ok   erreur :', e.message); }
console.log(ko ? ko + ' échec(s)' : 'tous les tests passent');
process.exit(ko ? 1 : 0);
