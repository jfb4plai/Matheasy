/**
 * Matheasy — découpe le LaTeX d'un champ multi-lignes en lignes de résolution.
 *  - accepte \displaylines{ a \\ b } ou a \\ b (séparateur \\ au niveau le plus haut)
 *  - ne coupe pas à l'intérieur d'un bloc \begin{...}...\end{...} (matrice, cases, aligned) ni d'accolades
 *  - détecte un commentaire en fin de ligne : ... \quad\text{commentaire}
 */
window.Matheasy = window.Matheasy || {};

(function (M) {
    'use strict';

    function unwrapDisplaylines(s) {
        s = s.trim();
        var m = /^\\displaylines\s*\{/.exec(s);
        if (!m) { return s; }
        var depth = 1, i = m[0].length;
        for (; i < s.length; i++) {
            var c = s[i];
            if (c === '\\') { i++; continue; }
            if (c === '{') { depth++; }
            else if (c === '}') { depth--; if (depth === 0) { break; } }
        }
        // l'accolade fermante doit être la dernière : sinon ce n'est pas un enveloppement complet
        if (depth === 0 && s.slice(i + 1).trim() === '') { return s.slice(m[0].length, i); }
        return s;
    }

    function splitTopLevel(s) {
        var parts = [], cur = '', depth = 0, env = 0, i = 0;
        while (i < s.length) {
            var c = s[i];
            if (c === '\\') {
                var rest = s.slice(i);
                var b = /^\\begin\{[^}]*\}/.exec(rest);
                if (b) { env++; cur += b[0]; i += b[0].length; continue; }
                var e = /^\\end\{[^}]*\}/.exec(rest);
                if (e) { env--; cur += e[0]; i += e[0].length; continue; }
                if (s[i + 1] === '\\' && depth === 0 && env === 0) { parts.push(cur); cur = ''; i += 2; continue; }
                cur += c + (s[i + 1] !== undefined ? s[i + 1] : '');
                i += 2;
                continue;
            }
            if (c === '{') { depth++; }
            else if (c === '}') { depth--; }
            cur += c;
            i++;
        }
        parts.push(cur);
        return parts;
    }

    // Commentaire final : ...\text{note}  (éventuellement précédé de \quad, \qquad, \; \, \: \ ~)
    function splitComment(line) {
        var s = line.trim();
        if (s.charAt(s.length - 1) !== '}') { return { latex: s, note: '' }; }
        var depth = 0, i = s.length - 1;
        for (; i >= 0; i--) {
            var c = s[i];
            var prev = s[i - 1];
            if (c === '}' && prev !== '\\') { depth++; }
            else if (c === '{' && prev !== '\\') { depth--; if (depth === 0) { break; } }
        }
        if (i < 0 || depth !== 0) { return { latex: s, note: '' }; }
        if (s.slice(Math.max(0, i - 5), i) !== '\\text') { return { latex: s, note: '' }; }
        var note = s.slice(i + 1, s.length - 1)
            .replace(/\\([&%#_$])/g, '$1')
            .replace(/\\ /g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        var before = s.slice(0, i - 5).replace(/(\\(quad|qquad|;|,|:|!)|\\ |~|\s)+$/g, '').trim();
        return { latex: before, note: note };
    }

    /** latex : contenu du champ. Renvoie [{ latex, note }] sans les lignes vides. */
    M.splitLines = function (latex) {
        var inner = unwrapDisplaylines(latex || '');
        return splitTopLevel(inner)
            .map(function (p) { return splitComment(p); })
            .filter(function (l) { return l.latex !== '' || l.note !== ''; })
            .filter(function (l) { return l.latex !== ''; });
    };
})(window.Matheasy);
