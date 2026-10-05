/**
 * Matheasy — convertisseur JSON ONLYOFFICE (ToJSON d'un paragraphe contenant une équation) -> LaTeX.
 * Structures observées dans ONLYOFFICE Desktop (résumé du 2026-10-05) :
 *   paraMath, mathRun(mathTxt), fraction(num/den, fPr noBar), nary(e/sub/sup, naryPr.chr),
 *   delimiter(dPr, e = tableau de tableaux), matrix(mr = lignes > cellules > noeuds),
 *   mathFunc(fName/e), limLow/limUpp(e/limit), groupChr, radSquare/radDegree(e/deg),
 *   superScript(e/sup), borderBox(e).
 * Les types inconnus sont signalés dans `warnings` ; leur contenu est converti au mieux.
 */
window.Matheasy = window.Matheasy || {};

(function (M) {
    'use strict';

    var SYMBOLS = {
        177: '\\pm', 215: '\\times', 247: '\\div', 183: '\\cdot', 8901: '\\cdot', 8226: '\\bullet',
        8242: '\\prime', 8734: '\\infty', 8800: '\\neq', 8776: '\\approx', 8804: '\\leq', 8805: '\\geq',
        8592: '\\leftarrow', 8594: '\\to', 8596: '\\leftrightarrow', 8656: '\\Leftarrow', 8658: '\\Rightarrow', 8660: '\\Leftrightarrow',
        8712: '\\in', 8713: '\\notin', 8834: '\\subset', 8838: '\\subseteq', 8835: '\\supset', 8839: '\\supseteq',
        8746: '\\cup', 8745: '\\cap', 8709: '\\emptyset', 8704: '\\forall', 8707: '\\exists',
        172: '\\neg', 8743: '\\land', 8744: '\\lor', 8706: '\\partial', 8711: '\\nabla',
        8741: '\\parallel', 8869: '\\perp', 8736: '\\angle', 9651: '\\triangle', 8764: '\\sim',
        176: '^\\circ', 8728: '\\circ', 8722: '-', 8943: '\\cdots', 8230: '\\ldots', 8943: '\\cdots',
        8477: '\\mathbb{R}', 8469: '\\mathbb{N}', 8484: '\\mathbb{Z}', 8474: '\\mathbb{Q}', 8450: '\\mathbb{C}',
        9633: '\\placeholder{}', 11034: '\\placeholder{}',
        945: '\\alpha', 946: '\\beta', 947: '\\gamma', 948: '\\delta', 949: '\\varepsilon', 1013: '\\epsilon',
        950: '\\zeta', 951: '\\eta', 952: '\\theta', 977: '\\vartheta', 953: '\\iota', 954: '\\kappa',
        955: '\\lambda', 956: '\\mu', 957: '\\nu', 958: '\\xi', 960: '\\pi', 961: '\\rho', 963: '\\sigma',
        964: '\\tau', 965: '\\upsilon', 966: '\\varphi', 981: '\\phi', 967: '\\chi', 968: '\\psi', 969: '\\omega',
        915: '\\Gamma', 916: '\\Delta', 920: '\\Theta', 923: '\\Lambda', 926: '\\Xi', 928: '\\Pi',
        931: '\\Sigma', 934: '\\Phi', 936: '\\Psi', 937: '\\Omega',
        123: '\\{', 125: '\\}', 37: '\\%', 38: '\\&', 35: '\\#', 36: '\\$', 95: '\\_', 32: '\\ '
    };

    var NARY = { 8747: '\\int', 8748: '\\iint', 8749: '\\iiint', 8750: '\\oint', 8721: '\\sum', 8719: '\\prod',
                 8899: '\\bigcup', 8898: '\\bigcap', 8896: '\\bigwedge', 8897: '\\bigvee' };

    var FUNCS = /^(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|lg|exp|lim|min|max|sup|inf|det|gcd|deg|dim|arg|ker)$/;

    var DELIM = { 40: '(', 41: ')', 91: '[', 93: ']', 123: '\\{', 125: '\\}', 124: '|', 8214: '\\|',
                  8968: '\\lceil', 8969: '\\rceil', 8970: '\\lfloor', 8971: '\\rfloor', 9001: '\\langle', 9002: '\\rangle', 10216: '\\langle', 10217: '\\rangle' };

    // Lettres mathématiques (𝑥, 𝐴…) -> lettres ordinaires
    function plainChar(cp) {
        if (cp >= 0x1D434 && cp <= 0x1D44D) { return String.fromCharCode(65 + cp - 0x1D434); }   // italique A-Z
        if (cp >= 0x1D44E && cp <= 0x1D467) { return String.fromCharCode(97 + cp - 0x1D44E); }   // italique a-z
        if (cp >= 0x1D400 && cp <= 0x1D419) { return String.fromCharCode(65 + cp - 0x1D400); }   // gras A-Z
        if (cp >= 0x1D41A && cp <= 0x1D433) { return String.fromCharCode(97 + cp - 0x1D41A); }   // gras a-z
        if (cp === 0x210E) { return 'h'; }
        return null;
    }

    // Concatène en ajoutant une espace quand une commande (\alpha) précède une lettre
    function append(a, b) {
        if (!b) { return a; }
        if (/\\[a-zA-Z]+$/.test(a) && /^[a-zA-Z]/.test(b)) { return a + ' ' + b; }
        return a + b;
    }

    function atom(s) {
        s = s.trim();
        if (/^([a-zA-Z0-9]|\\[a-zA-Z]+)$/.test(s)) { return s; }
        return '{' + s + '}';
    }

    function textOfRun(n) {
        var cps = (n.content || []).filter(function (c) { return c.type === 'mathTxt'; }).map(function (c) { return c.value; });
        var raw = cps.map(function (cp) { return plainChar(cp) || String.fromCodePoint(cp); }).join('');
        if (FUNCS.test(raw)) { return '\\' + raw; }
        var out = '';
        cps.forEach(function (cp) {
            var piece;
            if (SYMBOLS[cp] !== undefined) { piece = SYMBOLS[cp]; }
            else { piece = plainChar(cp) || String.fromCodePoint(cp); }
            out = append(out, piece);
        });
        return out;
    }

    function nonEmpty(list) {
        return (Array.isArray(list) ? list : []).filter(function (n) {
            return n && !((n.type === 'mathRun' || n.type === 'run') && (!n.content || n.content.length === 0));
        });
    }

    function convert(list, ctx) {
        if (list === null || list === undefined) { return ''; }
        if (!Array.isArray(list)) {
            if (list.content !== undefined && list.type !== 'mathRun' && !isKnownNode(list)) { return convert(list.content, ctx); }
            return node(list, ctx);
        }
        var out = '';
        list.forEach(function (n) { out = append(out, node(n, ctx)); });
        return out;
    }

    var KNOWN = { mathRun: 1, run: 1, endRun: 1, fraction: 1, radSquare: 1, radDegree: 1, superScript: 1, subScript: 1,
                  subSupScript: 1, nary: 1, mathFunc: 1, limLow: 1, limUpp: 1, groupChr: 1, delimiter: 1, matrix: 1,
                  borderBox: 1, accent: 1, bar: 1, paraMath: 1, paragraph: 1, document: 1 };
    function isKnownNode(n) { return !!(n && KNOWN[n.type]); }

    function delimiterNode(n, ctx) {
        var pr = n.dPr || {};
        var beg = pr.begChr === undefined ? 40 : pr.begChr;
        var end = pr.endChr === undefined ? 41 : pr.endChr;
        var sep = pr.sepChr === undefined ? 124 : pr.sepChr;
        var elems = n.e || [];
        if (elems.length && !Array.isArray(elems[0])) { elems = [elems]; }

        if (elems.length === 1) {
            var inner = nonEmpty(elems[0]);
            if (inner.length === 1 && inner[0].type === 'matrix') {
                var body = matrixBody(inner[0], ctx);
                var env = null;
                if (beg === 40 && (end === 41 || end === -1)) { env = 'pmatrix'; }
                else if (beg === 91) { env = 'bmatrix'; }
                else if (beg === 123 && (end === -1 || end === 0)) { env = 'cases'; }
                else if (beg === 123 && end === 125) { env = 'Bmatrix'; }
                else if (beg === 124) { env = 'vmatrix'; }
                else if (beg === 8214) { env = 'Vmatrix'; }
                if (env) { return '\\begin{' + env + '}' + body + '\\end{' + env + '}'; }
            }
            if (inner.length === 1 && inner[0].type === 'fraction' && inner[0].fPr && inner[0].fPr.type === 'noBar' && beg === 40 && end === 41) {
                return '\\binom{' + convert(inner[0].num, ctx) + '}{' + convert(inner[0].den, ctx) + '}';
            }
        }
        var parts = elems.map(function (e) { return convert(e, ctx); });
        var sepTex = DELIM[sep] !== undefined ? DELIM[sep] : String.fromCodePoint(sep);
        var content = parts.join(' ' + sepTex + ' ');
        var l = DELIM[beg] !== undefined ? DELIM[beg] : (beg > 0 ? String.fromCodePoint(beg) : '.');
        var r = DELIM[end] !== undefined ? DELIM[end] : (end > 0 ? String.fromCodePoint(end) : '.');
        if (pr.grow === false) { return (l === '.' ? '' : l) + content + (r === '.' ? '' : r); }
        return '\\left' + l + content + '\\right' + r;
    }

    function matrixBody(n, ctx) {
        var rows = (n.mr || []).map(function (row) {
            return row.map(function (cell) { return convert(cell, ctx); }).join(' & ');
        });
        return rows.join(' \\\\ ');
    }

    function node(n, ctx) {
        if (n === null || n === undefined) { return ''; }
        if (Array.isArray(n)) { return convert(n, ctx); }
        switch (n.type) {
            case 'mathRun': return textOfRun(n);
            case 'run': case 'endRun': return '';
            case 'document': case 'paragraph': case 'paraMath': return convert(n.content, ctx);
            case 'fraction':
                if (n.fPr && n.fPr.type === 'noBar') { return '{' + convert(n.num, ctx) + ' \\atop ' + convert(n.den, ctx) + '}'; }
                return '\\frac{' + convert(n.num, ctx) + '}{' + convert(n.den, ctx) + '}';
            case 'radSquare': case 'radDegree': {
                if (n.e === null || n.e === undefined) {
                    ctx.warnings.push('racine dont le contenu n\'a pas été exporté par ONLYOFFICE');
                    return '\\sqrt{\\placeholder{}}';
                }
                var hide = n.radPr && n.radPr.degHide;
                if (n.type === 'radDegree' && !hide && n.deg) { return '\\sqrt[' + convert(n.deg, ctx) + ']{' + convert(n.e, ctx) + '}'; }
                return '\\sqrt{' + convert(n.e, ctx) + '}';
            }
            case 'superScript': return atom(convert(n.e, ctx)) + '^{' + convert(n.sup, ctx) + '}';
            case 'subScript': return atom(convert(n.e, ctx)) + '_{' + convert(n.sub, ctx) + '}';
            case 'subSupScript': return atom(convert(n.e, ctx)) + '_{' + convert(n.sub, ctx) + '}^{' + convert(n.sup, ctx) + '}';
            case 'nary': {
                var pr = n.naryPr || {};
                var op = NARY[pr.chr] !== undefined ? NARY[pr.chr] : (pr.chr ? String.fromCodePoint(pr.chr) : '\\int');
                var s = op;
                if (!pr.subHide && nonEmpty(n.sub).length) { s += '_{' + convert(n.sub, ctx) + '}'; }
                if (!pr.supHide && nonEmpty(n.sup).length) { s += '^{' + convert(n.sup, ctx) + '}'; }
                return append(s, ' ' + convert(n.e, ctx));
            }
            case 'mathFunc': return append(convert(n.fName, ctx), ' ' + convert(n.e, ctx));
            case 'limLow': {
                var baseNodes = nonEmpty(n.e);
                if (baseNodes.length === 1 && baseNodes[0].type === 'groupChr') {
                    return convert(baseNodes[0], ctx) + '_{\\text{' + convert(n.limit, ctx) + '}}';
                }
                var base = convert(n.e, ctx);
                if (/^\\(lim|max|min|sup|inf)$/.test(base)) { return base + '_{' + convert(n.limit, ctx) + '}'; }
                return '\\underset{' + convert(n.limit, ctx) + '}{' + base + '}';
            }
            case 'limUpp': {
                var lim = convert(n.limit, ctx);
                var b2 = convert(n.e, ctx);
                if (lim === '\\to' || lim === '\\rightarrow') { return '\\vec{' + b2 + '}'; }
                return '\\overset{' + lim + '}{' + b2 + '}';
            }
            case 'groupChr': {
                var chr = n.groupChrPr && n.groupChrPr.chr;
                if (chr === 9182) { return '\\overbrace{' + convert(n.e, ctx) + '}'; }
                return '\\underbrace{' + convert(n.e, ctx) + '}';
            }
            case 'delimiter': return delimiterNode(n, ctx);
            case 'matrix': {
                var body = matrixBody(n, ctx);
                var cols = ((n.mPr && n.mPr.mcs && n.mPr.mcs[0] && n.mPr.mcs[0].count) || 1);
                var firstCells = ((n.mr || [[]])[0] || []);
                var secondStartsWithEq = cols >= 2 && firstCells.length >= 2 && /^[=<>]|^\\(leq|geq|neq|approx)/.test(convert(firstCells[1], ctx).trim());
                return secondStartsWithEq ? '\\begin{aligned}' + body.replace(/ & = /g, ' &= ') + '\\end{aligned}'
                                          : '\\begin{matrix}' + body + '\\end{matrix}';
            }
            case 'borderBox': return '\\boxed{' + convert(n.e, ctx) + '}';
            case 'accent': {
                var ac = n.accPr && n.accPr.chr;
                var map = { 770: '\\hat', 771: '\\tilde', 8407: '\\vec', 775: '\\dot', 776: '\\ddot', 773: '\\overline', 175: '\\overline', 8594: '\\vec' };
                return (map[ac] || '\\hat') + '{' + convert(n.e, ctx) + '}';
            }
            case 'bar': return (n.barPr && n.barPr.pos === 'bot' ? '\\underline{' : '\\overline{') + convert(n.e, ctx) + '}';
            default:
                if (n.type) { ctx.warnings.push('type non géré : ' + n.type); }
                if (n.e !== undefined) { return convert(n.e, ctx); }
                if (n.content !== undefined) { return convert(n.content, ctx); }
                return '';
        }
    }

    /** json : chaîne ou objet issu de ToJSON. Renvoie { latex, warnings } */
    M.jsonToLatex = function (json) {
        var data = (typeof json === 'string') ? JSON.parse(json) : json;
        var ctx = { warnings: [] };
        var latex = convert(data, ctx).replace(/\s+/g, ' ').trim();
        var seen = {};
        ctx.warnings = ctx.warnings.filter(function (w) { if (seen[w]) { return false; } seen[w] = 1; return true; });
        return { latex: latex, warnings: ctx.warnings };
    };

    // Un run « vide » ne contient que des espaces (dont l'espace invisible U+200B ajouté à l'insertion en ligne)
    function isBlankRun(n) {
        var blank = /[\u200B\u00A0\s]/g;
        return (n.content || []).every(function (it) {
            if (typeof it === 'string') { return !it.replace(blank, ''); }
            if (!it || typeof it !== 'object') { return false; }
            if (it.type === 'space') { return true; }
            if (typeof it.value === 'string') { return !it.value.replace(blank, ''); }
            if (typeof it.value === 'number') { return it.value === 0x200B || it.value === 0xA0 || it.value === 32; }
            return false;
        });
    }

    /** Indique si le JSON contient une formule et/ou du texte ordinaire (pour éviter d'écraser du texte) */
    M.jsonInfo = function (json) {
        var data = (typeof json === 'string') ? JSON.parse(json) : json;
        var info = { hasMath: false, hasText: false };
        (function walk(n) {
            if (!n || typeof n !== 'object') { return; }
            if (Array.isArray(n)) { n.forEach(walk); return; }
            if (n.type === 'mathRun') { info.hasMath = true; return; }
            if (n.type === 'run' && n.content && n.content.length && !isBlankRun(n)) { info.hasText = true; }
            for (var k in n) { if (n[k] && typeof n[k] === 'object') { walk(n[k]); } }
        })(data);
        return info;
    };

    /** Texte ordinaire (hors formules) d'un paragraphe : commentaires, mots… Les espaces invisibles sont ignorés. */
    M.jsonText = function (json) {
        var data = (typeof json === 'string') ? JSON.parse(json) : json;
        var out = '';
        (function walk(n) {
            if (!n || typeof n !== 'object') { return; }
            if (Array.isArray(n)) { n.forEach(walk); return; }
            if (n.type === 'mathRun') { return; }
            if (n.type === 'run') {
                (n.content || []).forEach(function (it) {
                    if (typeof it === 'string') { out += it; }
                    else if (it && typeof it === 'object') {
                        if (it.type === 'space') { out += ' '; }
                        else if (typeof it.value === 'string') { out += it.value; }
                        else if (typeof it.text === 'string') { out += it.text; }
                        else if (typeof it.value === 'number' && it.type !== 'mathTxt') { out += String.fromCodePoint(it.value); }
                    }
                });
                return;
            }
            for (var k in n) { if (n[k] && typeof n[k] === 'object') { walk(n[k]); } }
        })(data);
        return out.replace(/​/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    };
})(window.Matheasy);
