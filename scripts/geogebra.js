/**
 * Matheasy — graphique de la fonction et pont GeoGebra.
 *  - M.latexToGgb(latex) : LaTeX d'une ligne -> commande GeoGebra (cas simples)
 *  - tracé dans le panneau (plot.js), zéros et intersections affichés seulement si la case est cochée
 *  - « Insérer le graphique » : image PNG dans le document (hors ligne)
 *  - « Copier + ouvrir GeoGebra » : copie la commande, ouvre la calculatrice dans le navigateur (internet)
 *  - « calculatrice ici » (outils de test seulement) : charge deployggb.js depuis geogebra.org
 */
window.Matheasy = window.Matheasy || {};

(function (M) {
    'use strict';

    // Extrait l'argument entre accolades à partir de s[i] === '{' ; renvoie { text, end } (end = indice après '}')
    function group(s, i) {
        if (s[i] !== '{') { return { text: s[i] || '', end: i + 1 }; }
        var depth = 0, j = i;
        for (; j < s.length; j++) {
            if (s[j] === '\\') { j++; continue; }
            if (s[j] === '{') { depth++; }
            else if (s[j] === '}') { depth--; if (depth === 0) { break; } }
        }
        return { text: s.slice(i + 1, j), end: j + 1 };
    }

    function conv(s) {
        var out = '', i = 0;
        while (i < s.length) {
            var c = s[i];
            if (c === '\\') {
                var m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
                if (!m) { out += (s[i + 1] === ',' || s[i + 1] === ';' || s[i + 1] === ' ' || s[i + 1] === ':' || s[i + 1] === '!') ? ' ' : s[i + 1] || ''; i += 2; continue; }
                var name = m[1]; i += m[0].length;
                if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
                    var a = group(s, i); var b = group(s, a.end); i = b.end;
                    out += '(' + conv(a.text) + ')/(' + conv(b.text) + ')';
                } else if (name === 'sqrt') {
                    var n = null;
                    if (s[i] === '[') { var k = s.indexOf(']', i); n = s.slice(i + 1, k); i = k + 1; }
                    var r = group(s, i); i = r.end;
                    out += n ? 'nthroot(' + conv(r.text) + ',' + conv(n) + ')' : 'sqrt(' + conv(r.text) + ')';
                } else if (name === 'left' || name === 'right' || name === 'displaystyle' || name === 'mathrm' || name === 'operatorname') {
                    // \left( \right) : on garde le délimiteur ; \left| ... \right| géré plus bas
                    if (name === 'mathrm' || name === 'operatorname') { var g = group(s, i); i = g.end; out += conv(g.text); }
                } else if (name === 'cdot' || name === 'times') { out += '*'; }
                else if (name === 'pi') { out += 'pi'; }
                else if (name === 'infty') { out += 'infinity'; }
                else if (name === 'le' || name === 'leq') { out += '<='; }
                else if (name === 'ge' || name === 'geq') { out += '>='; }
                else if (name === 'ne' || name === 'neq') { out += '!='; }
                else if (/^(sin|cos|tan|arcsin|arccos|arctan|ln|log|exp|sinh|cosh|tanh)$/.test(name)) { out += (/[\w)]$/.test(out) ? ' ' : '') + name.replace('arc', 'a'); } // « x cos x », pas « xcos x »
                else if (name === 'quad' || name === 'qquad') { out += ' '; }
                else { out += name; } // lettre grecque ou fonction inconnue : on laisse le nom
                continue;
            }
            if (c === '^' || c === '_') {
                var g2 = group(s, i + 1); i = g2.end;
                if (c === '^') { out += '^(' + conv(g2.text) + ')'; }
                continue; // indices ignorés
            }
            if (c === '{') { var g3 = group(s, i); i = g3.end; out += '(' + conv(g3.text) + ')'; continue; }
            out += c; i++;
        }
        return out;
    }

    // |a| -> abs(a) (cas simple, sans imbrication)
    function absBars(s) {
        var n = 0;
        return s.replace(/\|/g, function () { n++; return n % 2 ? 'abs(' : ')'; });
    }

    M.latexToGgb = function (latex) {
        var raw = String(latex || '').replace(/\\left\s*\|/g, '|').replace(/\\right\s*\|/g, '|');
        var out = absBars(conv(raw)).replace(/\s+/g, ' ').replace(/\s*([=<>+\-*/^])\s*/g, '$1').trim();
        if (!out) { return ''; }
        if (/^(f|g|h)\(x\)=/.test(out)) { return out; }
        if (/^y=/.test(out)) { return 'f(x)=' + out.slice(2); }
        if (out.indexOf('=') === -1) { return 'f(x)=' + out; }
        return out; // équation quelconque (cercle, droite…) : GeoGebra sait la tracer
    };

    // ---- Interface (expérience) ----
    function $(id) { return document.getElementById(id); }
    function say(msg, bad) {
        var el = $('ggb-log'); if (!el) { return; }
        el.textContent = msg; el.style.color = bad ? '#b00020' : '';
    }
    // Fonctions des lignes du champ : [{ ggb: 'f(x)=…', expr: '…' }] (équations non tracées ignorées)
    function fieldFunctions() {
        var mf = $('mf');
        var raw = (mf && mf.getValue ? mf.getValue('latex') : '') || '';
        var lines = M.splitLines ? M.splitLines(raw) : [{ latex: raw }];
        var res = [], skipped = [];
        for (var i = 0; i < lines.length && res.length < 2; i++) {
            if (!lines[i].latex) { continue; }
            var g = M.latexToGgb(lines[i].latex);
            var m = /^[a-z]\(x\)=(.*)$/.exec(g);
            if (m && m[1].indexOf('=') === -1) { res.push({ ggb: g, expr: m[1], raw: lines[i].latex }); } else { skipped.push(lines[i].latex); }
        }
        return { funcs: res, skipped: skipped, raw: raw };
    }
    function currentCommand() {
        var r = fieldFunctions();
        var cmd = r.funcs.length ? r.funcs.map(function (f, i) { return (i ? 'g' : 'f') + f.ggb.slice(1); }).join(' ; ') : (r.skipped.length ? M.latexToGgb(r.skipped[0]) : '');
        $('ggb-cmd').value = cmd;
        return cmd;
    }
    function copy(text) {
        try { if (navigator.clipboard && navigator.clipboard.writeText) { return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); }); } } catch (e) { /* ignoré */ }
        return Promise.resolve(legacyCopy(text));
    }
    function legacyCopy(text) {
        try { var t = $('ggb-cmd'); t.focus(); t.select(); return document.execCommand('copy'); } catch (e) { return false; }
    }

    var applet = null, appletReady = false;
    function loadApplet(cb) {
        var cmd = $('ggb-cmd').value || currentCommand();
        if (!cmd) { say('Écris d\'abord une fonction dans le champ (ex. x^2-4).', true); return; }
        var start = function () {
            $('ggb-box').innerHTML = '';
            var params = { id: 'ggbApplet', appName: 'graphing', width: 420, height: 320, showToolBar: false, showAlgebraInput: false, showMenuBar: false, language: 'fr', useBrowserForJS: true,
                appletOnLoad: function (api) { applet = api; appletReady = true; say('Calculatrice chargée.', false); cb(api); } };
            try { new window.GGBApplet(params, true).inject('ggb-box'); } catch (e) { say('Échec de l\'injection : ' + e.message, true); }
        };
        if (window.GGBApplet) { start(); return; }
        say('Chargement de deployggb.js depuis geogebra.org…', false);
        var s = document.createElement('script');
        s.src = 'https://www.geogebra.org/apps/deployggb.js';
        s.onload = start;
        s.onerror = function () { say('Impossible de charger deployggb.js : pas d\'internet, ou le panneau bloque le script.', true); };
        document.head.appendChild(s);
    }

    var drawTimer = null;
    function draw() {
        var info = $('plot-info'), cv = $('plot-canvas');
        var r = fieldFunctions(); currentCommand();
        if (!r.funcs.length) {
            cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
            info.style.color = r.raw.trim() ? '#b00020' : '';
            info.textContent = r.raw.trim() ? 'Pas de fonction de x à tracer dans la 1re ligne (équation de cercle, etc. : utilise GeoGebra).' : 'Écris une fonction dans le champ (ex. 2x^3-√(7x)) : le graphique apparaît ici.';
            return false;
        }
        var funcs = [], colors = ['#0a64c8', '#e07000'], names = ['f', 'g'];
        try {
            r.funcs.forEach(function (f, i) { funcs.push({ fn: M.compileFunction(f.expr), color: colors[i], label: names[i] }); });
        } catch (e) { info.style.color = '#b00020'; info.textContent = 'Fonction non reconnue : ' + e.message + ' (' + r.funcs.map(function (f) { return f.expr; }).join(' ; ') + ')'; return false; }
        var xmin = parseFloat($('plot-xmin').value), xmax = parseFloat($('plot-xmax').value);
        if (!(xmin < xmax)) { info.style.color = '#b00020'; info.textContent = 'Intervalle de x incorrect.'; return false; }
        var showValues = !!($('plot-values') && $('plot-values').checked);
        var res = M.drawPlot(cv, funcs, { xmin: xmin, xmax: xmax, showValues: showValues });
        var f2 = function (a) { return a.length ? a.map(function (v) { return String(parseFloat(v.toFixed(3))); }).join(' ; ') : 'aucun sur cet intervalle'; };
        var t = 'f : ' + r.funcs[0].ggb.replace(/^[a-z]\(x\)=/, 'f(x) = ');
        if (funcs.length > 1) { t += '\ng(x) = ' + r.funcs[1].expr; }
        if (showValues) {
            t += '\nZéros de f : x ≈ ' + f2(res.zeros[0]);
            if (funcs.length > 1) { t += '\nZéros de g : x ≈ ' + f2(res.zeros[1]) + '\nf(x) = g(x) : x ≈ ' + f2(res.inter); }
        } else {
            t += '\nZéros et intersections masqués (case « Afficher les zéros… » ci-dessus).';
        }
        info.style.color = ''; info.textContent = t;
        return true;
    }

    function wire() {
        if (!$('ggb-open')) { return; }
        $('plot-draw').addEventListener('click', draw);
        var mf = $('mf');
        if (mf) { mf.addEventListener('input', function () { clearTimeout(drawTimer); drawTimer = setTimeout(draw, 500); }); }
        $('plot-xmin').addEventListener('change', draw);
        $('plot-xmax').addEventListener('change', draw);
        if ($('plot-values')) { $('plot-values').addEventListener('change', draw); }
        draw();
        $('plot-insert').addEventListener('click', function () {
            if (!draw()) { say('Rien à insérer : trace d\'abord une fonction.', true); return; }
            var url;
            try { url = $('plot-canvas').toDataURL('image/png'); } catch (e) { say('Export de l\'image impossible : ' + e.message, true); return; }
            window.Asc.scope.ggbPng = url;
            window.Asc.plugin.callCommand(function () {
                var doc = Api.GetDocument();
                try {
                    var img = Api.CreateImage(Asc.scope.ggbPng, 105 * 36000, 71.6 * 36000);
                    var p = doc.GetCurrentParagraph();
                    p.AddDrawing(img);
                    return 'ok';
                } catch (e) { return 'ERREUR : ' + e.message; }
            }, false, true, function (res) { say(res === 'ok' ? 'Graphique inséré dans le document.' : 'Insertion de l\'image : ' + res, res !== 'ok'); });
        });
        $('ggb-open').addEventListener('click', function () {
            var cmd = $('ggb-cmd').value || currentCommand();
            if (!cmd) { say('Rien à exporter : écris une fonction dans le champ.', true); return; }
            var first = cmd.split(' ; ')[0];
            $('ggb-cmd').value = first;
            copy(first).then(function (ok) {
                say((ok ? 'Commande copiée : ' : 'Copie automatique impossible, copie la commande à la main : ') + first + '\nDans GeoGebra : clique dans la barre de saisie, Ctrl+V, Entrée. Si rien ne s\'ouvre, utilise le lien manuel.', !ok);
            });
            try { window.open('https://www.geogebra.org/graphing', '_blank'); } catch (e) { /* le lien manuel sert de secours */ }
        });
        $('ggb-embed').addEventListener('click', function () {
            loadApplet(function (api) {
                var cmd = $('ggb-cmd').value;
                var okDef = api.evalCommand(cmd.split(' ; ')[0]);
                var okRoots = false;
                try { okRoots = api.evalCommand('Roots(f)'); } catch (e) { /* f peut ne pas exister */ }
                say('Calculatrice chargée. Définition : ' + okDef + ', zéros : ' + okRoots, !okDef);
            });
        });
    }
    M.initGeogebra = wire;
})(window.Matheasy);
