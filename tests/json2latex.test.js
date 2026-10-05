// Tests du convertisseur : les structures reproduisent les résumés collés le 2026-10-05 (P2…P48).
global.window = { Matheasy: {} };
require('../scripts/json2latex.js');
const M = window.Matheasy;

const R = (s) => ({ type: 'mathRun', content: Array.from(s).map((c) => ({ type: 'mathTxt', value: c.codePointAt(0) })) });
const E = () => R('');
const para = (...c) => ({ type: 'paragraph', content: [{ type: 'run', content: [] }, { type: 'paraMath', oMathParaPr: {}, content: c }, { type: 'endRun', content: [] }] });
const frac = (n, d, noBar) => ({ type: 'fraction', fPr: { type: noBar ? 'noBar' : 'bar' }, num: { type: 'num', content: n }, den: { type: 'den', content: d } });
const paren = (...x) => ({ type: 'delimiter', dPr: { begChr: 40, endChr: 41, grow: true, shp: 'centered' }, e: [x] });
const sup = (e, s) => ({ type: 'superScript', e, sSupPr: {}, sup: { content: s } });

const cases = [
  ['P2 limite', para(E(), { type: 'mathFunc', fName: [E(), { type: 'limLow', e: [R('lim')], limit: [R('x'), R('→'), R('0')], limLowPr: {} }, E()],
    e: [E(), frac([E(), { type: 'mathFunc', fName: [R('sin')], e: [R('x')], funcPr: {} }, E()], [R('x')]), E()], funcPr: {} }, E(), R('='), R('1')),
   '\\lim_{x\\to0}\\frac{\\sin x}{x}=1'],
  ['P4 intégrale', para(E(), { type: 'nary', e: [R('f')], sup: [R('b')], sub: [R('a')], naryPr: { chr: 8747, limLoc: 'subSup', subHide: false, supHide: false } }, E(),
    paren(R('x')), E(), R(' '), R('dx'), R('='), R('F'), paren(R('b')), R('-'), R('F'), paren(R('a'))),
   '\\int_{a}^{b}f\\left(x\\right)\\ dx=F\\left(b\\right)-F\\left(a\\right)'],
  ['P8 somme', para(E(), { type: 'nary', e: [R('k')], sup: [R('n')], sub: [R('k'), R('='), R('1')], naryPr: { chr: 8721, limLoc: 'undOvr' } }, E(), R('='),
    frac([R('n'), paren(R('n'), R('+'), R('1')), E()], [R('2')])),
   '\\sum_{k=1}^{n}k=\\frac{n\\left(n+1\\right)}{2}'],
  ['P12 second degré', para(E(), R('x'), R('='), frac([R('-'), R('b'), R('±'), { type: 'radSquare', radPr: { degHide: true }, e: [E(), sup([R('b')], [R('2')]), R('-'), R('4'), R('ac')], deg: [R('⬚')] }, E()], [R('2'), R('a')])),
   'x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}'],
  ['P14 matrice', para(E(), paren(E(), { type: 'matrix', mPr: { mcs: [{ count: 2 }] }, mr: [[[R('a')], [R('b')]], [[R('c')], [R('d')]]] }, E()), E()),
   '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}'],
  ['P16 déterminant', para(E(), { type: 'delimiter', dPr: { begChr: 124, endChr: -1 }, e: [[E(), { type: 'matrix', mPr: { mcs: [{ count: 2 }] }, mr: [[[R('a')], [R('b')]], [[R('c')], [R('d')]]] }, E()]] }, E(), R('='), R('ad'), R('-'), R('bc')),
   '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}=ad-bc'],
  ['P18 système', para(E(), { type: 'delimiter', dPr: { begChr: 123, endChr: -1 }, e: [[E(), { type: 'matrix', mPr: { mcs: [{ count: 1 }] }, mr: [[[R('x'), R('+'), R('y'), R('='), R('3')]], [[R('x'), R('-'), R('y'), R('='), R('1')]]] }, E()]] }, E()),
   '\\begin{cases}x+y=3\\\\x-y=1\\end{cases}'],
  ['P20 racine n-ième', para(E(), { type: 'radDegree', radPr: { degHide: false }, e: [E(), sup([R('a')], [R('m')]), E()], deg: [R('n')] }, E(), R('='), sup([R('a')], [R('m/n')])),
   '\\sqrt[n]{a^{m}}=a^{m/n}'],
  ['P24 vecteur', para(E(), { type: 'limUpp', e: [R('𝐴'), R('𝐵')], limit: [R('→')], limUppPr: {} }, E()),
   '\\vec{AB}'],
  ['P26 sin²x', para(E(), { type: 'mathFunc', fName: [E(), sup([R('sin')], [R('2')]), E()], e: [R('x')], funcPr: {} }, E(), R('+'), { type: 'mathFunc', fName: [E(), sup([R('cos')], [R('2')]), E()], e: [R('x')], funcPr: {} }, R('='), R('1')),
   '\\sin^{2}x+\\cos^{2}x=1'],
  ['P28 binomial', para(E(), paren(E(), frac([R('n')], [R('k')], true), E()), E(), R('='), frac([R('n!')], [R('k!'), paren(R('n'), R('-'), R('k')), R('!')])),
   '\\binom{n}{k}=\\frac{n!}{k!\\left(n-k\\right)!}'],
  ['P30 P(A|B)', para(E(), R('P'), { type: 'delimiter', dPr: { begChr: 40, endChr: 41, grow: true }, e: [[R('A')], [R('B')]] }, R('='),
    frac([R('P'), paren(R('A'), R('∩'), R('B')), E()], [R('P'), paren(R('B')), E()])),
   'P\\left(A|B\\right)=\\frac{P\\left(A\\cap B\\right)}{P\\left(B\\right)}'],
  ['P32 quantificateurs', para(E(), R('∀'), R('x'), R('∈ℝ'), R(','), R(' '), R('∃'), R('y'), R('∈ℕ'), R(':'), R('y'), R('>'), R('x')),
   '\\forall x\\in\\mathbb{R},\\ \\exists y\\in\\mathbb{N}:y>x'],
  ['P34 accolade légende', para(E(), { type: 'limLow', e: [E(), { type: 'groupChr', groupChrPr: { chr: 9183, pos: 'bot' }, e: [R('a'), R('+'), R('b'), R('+'), R('c')] }, E()], limit: [R('somme')], limLowPr: {} }, E()),
   '\\underbrace{a+b+c}_{\\text{somme}}'],
  ['P38 encadré', para(E(), { type: 'borderBox', borderBoxPr: {}, e: [R('𝑥'), R('='), R('3')] }, E()),
   '\\boxed{x=3}'],
  ['P48 aligné', para(E(), { type: 'matrix', mPr: { mcs: [{ count: 2 }] }, mr: [[[R('2'), R('x'), R('+'), R('1')], [R('='), R('7')]], [[R('2'), R('x')], [R('='), R('6')]], [[R('x')], [R('='), R('3')]]] }, E()),
   '\\begin{aligned}2x+1&=7\\\\2x&=6\\\\x&=3\\end{aligned}'],
  ['racine vide (bug Range)', para(E(), { type: 'radSquare', radPr: { degHide: true }, e: null, deg: [R('⬚')] }, E()),
   '\\sqrt{\\placeholder{}}'],
  ['inconnu', para(E(), { type: 'xyz', e: [R('a')] }, E()), 'a'],
];

let ko = 0;
for (const [name, json, expected] of cases) {
  const r = M.jsonToLatex(JSON.parse(JSON.stringify(json)));
  const got = r.latex.replace(/\s+/g, '');
  const exp = expected.replace(/\s+/g, '');
  if (got === exp) { console.log('ok  ', name, '→', r.latex, r.warnings.length ? ' [' + r.warnings.join('; ') + ']' : ''); }
  else { ko++; console.log('KO  ', name, '\n   obtenu :', r.latex, '\n   attendu:', expected); }
}
console.log(ko ? ko + ' échec(s)' : 'tous les tests passent (' + cases.length + ')');
process.exit(ko ? 1 : 0);
