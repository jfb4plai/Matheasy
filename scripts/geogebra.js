/**
 * Matheasy — pont GeoGebra (EXPÉRIENCE v0.9.1).
 *  - M.latexToGgb(latex) : LaTeX d'une ligne -> commande GeoGebra (cas simples)
 *  - bouton « copier + ouvrir » : copie la commande, ouvre la calculatrice graphique dans le navigateur
 *  - bouton « calculatrice ici » : charge l'API GeoGebra (deployggb.js) dans le panneau et envoie la commande
 *  - bouton « insérer l'image » : exporte le graphique en PNG et tente de l'insérer dans le document
 * Tout cela demande internet et n'a pas encore été vérifié dans ONLYOFFICE.
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
                else if (/^(sin|cos|tan|arcsin|arccos|arctan|ln|log|exp|sinh|cosh|tanh)$/.test(name)) { out += name.replace('arc', 'a'); }
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
    function currentCommand() {
        var mf = $('mf');
        var raw = (mf && mf.getValue ? mf.getValue('latex') : '') || '';
        var lines = M.splitLines ? M.splitLines(raw) : [{ latex: raw }];
        var first = '';
        for (var i = 0; i < lines.length; i++) { if (lines[i].latex) { first = lines[i].latex; break; } }
        var cmd = M.latexToGgb(first);
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

    function wire() {
        if (!$('ggb-open')) { return; }
        $('ggb-convert').addEventListener('click', function () { var c = currentCommand(); say(c ? 'Commande : ' + c : 'Rien à convertir.', !c); });
        $('ggb-open').addEventListener('click', function () {
            var cmd = $('ggb-cmd').value || currentCommand();
            if (!cmd) { say('Rien à convertir : écris une fonction dans le champ.', true); return; }
            copy(cmd).then(function (ok) {
                say((ok ? 'Commande copiée : ' : 'Copie automatique impossible, copie la commande à la main : ') + cmd + '\nColle-la (Ctrl+V) dans la barre de saisie de GeoGebra. Si rien ne s\'ouvre, clique sur le lien ci-dessous.', !ok);
            });
            try { window.open('https://www.geogebra.org/graphing', '_blank'); } catch (e) { /* le lien manuel sert de secours */ }
        });
        $('ggb-embed').addEventListener('click', function () {
            loadApplet(function (api) {
                var cmd = $('ggb-cmd').value;
                var okDef = api.evalCommand(cmd);
                var okRoots = false;
                try { okRoots = api.evalCommand('Roots(f)'); } catch (e) { /* f peut ne pas exister */ }
                say('Calculatrice chargée. Définition : ' + okDef + ', zéros : ' + okRoots + '. Objets : ' + (api.getAllObjectNames ? api.getAllObjectNames().join(', ') : '?'), !okDef);
            });
        });
        $('ggb-image').addEventListener('click', function () {
            if (!applet || !appletReady) { say('Charge d\'abord « Calculatrice ici ».', true); return; }
            var b64;
            try { b64 = applet.getPNGBase64(1, true, 72); } catch (e) { say('Export PNG impossible : ' + e.message, true); return; }
            window.Asc.scope.ggbPng = 'data:image/png;base64,' + b64;
            window.Asc.plugin.callCommand(function () {
                var doc = Api.GetDocument();
                try {
                    var img = Api.CreateImage(Asc.scope.ggbPng, 105 * 36000, 80 * 36000);
                    var p = doc.GetCurrentParagraph();
                    p.AddDrawing(img);
                    return 'ok';
                } catch (e) { return 'ERREUR : ' + e.message; }
            }, false, true, function (res) { say('Insertion de l\'image : ' + res, res !== 'ok'); });
        });
    }
    M.initGeogebra = wire;
})(window.Matheasy);
