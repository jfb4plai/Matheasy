/**
 * Matheasy — édition des blocs (matrices, systèmes, alignements) sur le LaTeX du champ.
 * MathLive insère une colonne à côté de la colonne courante ; ici « +col » ajoute à la fin (droite) et
 * « −col » retire la dernière, « +lig » ajoute en bas, « −lig » retire la dernière ligne.
 * Fonctionne quand le champ contient exactement un bloc \begin{...}...\end{...}.
 */
window.Matheasy = window.Matheasy || {};

(function (M) {
    'use strict';

    var ENV = /\\begin\{(pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix|smallmatrix|cases|aligned|array)\}(\{[^}]*\})?/g;

    // Découpe au niveau supérieur : séparateur = '\\\\' (lignes) ou '&' (cellules)
    function splitTop(s, mode) {
        var parts = [], cur = '', depth = 0, env = 0, i = 0;
        while (i < s.length) {
            var c = s[i];
            if (c === '\\') {
                var rest = s.slice(i);
                var b = /^\\begin\{[^}]*\}(\{[^}]*\})?/.exec(rest);
                if (b) { env++; cur += b[0]; i += b[0].length; continue; }
                var e = /^\\end\{[^}]*\}/.exec(rest);
                if (e) { env--; cur += e[0]; i += e[0].length; continue; }
                if (mode === 'rows' && s[i + 1] === '\\' && depth === 0 && env === 0) { parts.push(cur); cur = ''; i += 2; continue; }
                cur += c + (s[i + 1] !== undefined ? s[i + 1] : '');
                i += 2;
                continue;
            }
            if (c === '{') { depth++; }
            else if (c === '}') { depth--; }
            if (mode === 'cells' && c === '&' && depth === 0 && env === 0) { parts.push(cur); cur = ''; i++; continue; }
            cur += c;
            i++;
        }
        parts.push(cur);
        return parts;
    }

    /** op : addCol | removeCol | addRow | removeRow. Renvoie le nouveau LaTeX, ou null si non applicable. */
    M.arrayEdit = function (latex, op) {
        var matches = [], m;
        ENV.lastIndex = 0;
        while ((m = ENV.exec(latex)) !== null) { matches.push(m); }
        if (matches.length !== 1) { return null; }
        var name = matches[0][1];
        var open = matches[0][0];
        var start = matches[0].index + open.length;
        var endTag = '\\end{' + name + '}';
        var end = latex.indexOf(endTag, start);
        if (end === -1) { return null; }
        var body = latex.slice(start, end);
        var rows = splitTop(body, 'rows').map(function (r) { return splitTop(r, 'cells'); });
        // ignore une dernière ligne vide (\\ final)
        while (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].trim() === '') { rows.pop(); }
        var ph = '\\placeholder{}';
        var width = rows.reduce(function (w, r) { return Math.max(w, r.length); }, 0);
        if (op === 'addCol') { rows.forEach(function (r) { r.push(ph); }); }
        else if (op === 'removeCol') {
            if (width < 2) { return null; }
            rows.forEach(function (r) { if (r.length > 1) { r.pop(); } });
        }
        else if (op === 'addRow') {
            var fresh = []; for (var k = 0; k < Math.max(width, 1); k++) { fresh.push(ph); }
            rows.push(fresh);
        }
        else if (op === 'removeRow') { if (rows.length < 2) { return null; } rows.pop(); }
        else { return null; }
        var newBody = rows.map(function (r) { return r.map(function (c) { return c.trim(); }).join(' & '); }).join(' \\\\ ');
        return latex.slice(0, start) + newBody + latex.slice(end);
    };
})(window.Matheasy);
