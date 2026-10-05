/**
 * Matheasy — fenêtre d'édition (v0.1.0, prototype).
 *  - champ de saisie MathLive (<math-field>, licence MIT, chargé depuis jsDelivr)
 *  - palettes par thème (scripts/palettes.js)
 *  - insertion dans le document comme équation native (AddMathEquation, format latex)
 *  - annotation de la sélection du document : couleur / barré (validés en v0.0.5)
 * Non testé dans un ONLYOFFICE réel à ce stade.
 */
window.Matheasy = window.Matheasy || {};

(function (M) {
    'use strict';

    function $(id) { return document.getElementById(id); }

    function setStatus(msg, isError) {
        var el = $('status');
        el.textContent = msg;
        el.className = isError ? 'status error' : 'status';
    }

    // Lit un argument LaTeX à partir de la position i : {...} (équilibré), \commande, ou un caractère
    function readArg(s, i) {
        while (i < s.length && /\s/.test(s[i])) { i++; }
        if (i >= s.length) { return null; }
        var start = i;
        if (s[i] === '{') {
            var depth = 0;
            for (; i < s.length; i++) {
                if (s[i] === '{') { depth++; }
                else if (s[i] === '}') { depth--; if (depth === 0) { i++; break; } }
            }
            return { text: s.slice(start + 1, i - 1), end: i };
        }
        if (s[i] === '\\') {
            var m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
            return { text: m[0], end: i + m[0].length };
        }
        return { text: s[i], end: i + 1 };
    }

    // \frac23 -> \frac{2}{3} ; \sqrt2 -> \sqrt{2} ; \binom nk -> \binom{n}{k} (le moteur exige les accolades)
    M.bracesShorthand = function (latex) {
        var out = '', i = 0, re = /\\(frac|dfrac|tfrac|binom|sqrt)(?![a-zA-Z])/g, m;
        while ((m = re.exec(latex)) !== null) {
            out += latex.slice(i, m.index);
            var cmd = m[1] === 'dfrac' || m[1] === 'tfrac' ? 'frac' : m[1];
            var pos = m.index + m[0].length;
            var piece = '\\' + cmd;
            if (cmd === 'sqrt') {
                var q = pos; while (q < latex.length && /\s/.test(latex[q])) { q++; }
                if (latex[q] === '[') {
                    var close = latex.indexOf(']', q);
                    if (close !== -1) { piece += latex.slice(q, close + 1); pos = close + 1; }
                }
                var a = readArg(latex, pos);
                if (a) { piece += '{' + M.bracesShorthand(a.text) + '}'; pos = a.end; }
            } else {
                for (var k = 0; k < 2; k++) {
                    var arg = readArg(latex, pos);
                    if (!arg) { break; }
                    piece += '{' + M.bracesShorthand(arg.text) + '}';
                    pos = arg.end;
                }
            }
            out += piece;
            i = pos;
            re.lastIndex = pos;
        }
        return out + latex.slice(i);
    };

    // Adapte le LaTeX produit par MathLive à ce que le moteur d'ONLYOFFICE sait lire (voir corpus)
    M.sanitizeLatex = function (latex) {
        var out = latex;
        out = out.replace(/\\placeholder(\[[^\]]*\])?\{[^}]*\}/g, '□'); // zone vide -> □
        out = out.replace(/\\overrightarrow\{/g, '\\vec{');
        out = out.replace(/\\differentialD/g, 'd');
        out = out.replace(/\\mleft/g, '\\left').replace(/\\mright/g, '\\right');
        out = M.bracesShorthand(out);
        return out;
    };

    M.UNSUPPORTED = ['\\cancel', '\\boxed', '\\color', '\\textcolor'];

    function insertIntoDocument() {
        var mf = $('mf');
        var raw = (mf.getValue ? mf.getValue('latex') : mf.value) || '';
        if (!raw.trim()) { setStatus('Rien à insérer : le champ est vide.', true); return; }
        var latex = M.sanitizeLatex(raw);
        var bad = M.UNSUPPORTED.filter(function (c) { return latex.indexOf(c) !== -1; });
        if (bad.length) {
            setStatus('Commande non prise en charge par ONLYOFFICE : ' + bad.join(', ') + '. Retire-la (voir les boutons d\'annotation).', true);
            return;
        }
        window.Asc.scope.matheasyLatex = latex;
        var mode = $('mode').value;
        var finish = function (ok, note) {
            if (ok === false) { setStatus('ONLYOFFICE a refusé la formule.', true); return; }
            var msg = M.replaceMode ? 'Formule insérée à la place de la sélection. ' + (note || '') : 'Équation insérée dans le document.';
            setStatus(msg, false);
            if (M.replaceMode) { M.setReplaceMode(false); }
            if ($('autoclear').checked && mf.setValue) { mf.setValue(''); }
            if ($('closeafter').checked) { window.Asc.plugin.executeCommand('close', ''); }
        };
        if (M.replaceMode) {
            window.Asc.scope.matheasyDeleteFirst = ($('replmethod').value === 'delete');
            window.Asc.plugin.callCommand(function () {
                var doc = Api.GetDocument();
                var note = '';
                if (Asc.scope.matheasyDeleteFirst) {
                    try {
                        var r = doc.GetRangeBySelect();
                        if (r && typeof r.Delete === 'function') { r.Delete(); note = '(méthode B : ancienne formule supprimée avant l\'insertion)'; }
                        else { note = '(méthode B impossible : pas de Delete)'; }
                    } catch (e) { note = '(Delete ERREUR : ' + e.message + ')'; }
                } else {
                    note = '(méthode A : insertion sur la sélection)';
                }
                var ok = doc.AddMathEquation(Asc.scope.matheasyLatex, 'latex');
                return JSON.stringify({ ok: ok, note: note });
            }, false, true, function (res) {
                var o = {}; try { o = JSON.parse(res); } catch (e) { /* ignoré */ }
                finish(o.ok, o.note);
            });
            return;
        }
        var doInsert = function () {
            window.Asc.plugin.callCommand(function () {
                var doc = Api.GetDocument();
                return doc.AddMathEquation(Asc.scope.matheasyLatex, 'latex');
            }, false, true, function (ok) { finish(ok); });
        };
        if (mode === 'inline') {
            // Espace invisible d'abord : le paragraphe n'est plus vide, l'équation reste dans le texte
            window.Asc.plugin.executeMethod('InputText', ['​'], doInsert);
        } else {
            doInsert();
        }
    }

    // ---- Modification d'une formule existante ----
    M.replaceMode = false;
    M.setReplaceMode = function (on) {
        M.replaceMode = on;
        $('editmode').style.display = on ? 'flex' : 'none';
    };

    // auto = true : appelé à l'ouverture de la fenêtre ; reste discret s'il n'y a pas de formule sélectionnée
    function editSelection(auto) {
        var mf = $('mf');
        var quiet = auto === true;
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var r = doc.GetRangeBySelect();
            if (!r) { return JSON.stringify({ error: 'Aucune sélection dans le document.' }); }
            try {
                var j = r.ToJSON(false);
                return JSON.stringify({ json: (typeof j === 'string') ? j : JSON.stringify(j) });
            } catch (e) { return JSON.stringify({ error: 'Lecture impossible : ' + e.message }); }
        }, false, true, function (res) {
            var o = {};
            try { o = JSON.parse(res); } catch (e) { if (!quiet) { setStatus('Réponse illisible d\'ONLYOFFICE.', true); } return; }
            if (o.error) { if (!quiet) { setStatus(o.error, true); } return; }
            var info;
            try { info = M.jsonInfo(o.json); } catch (e0) { if (!quiet) { setStatus('Structure de formule non reconnue.', true); } return; }
            if (!info.hasMath) { if (!quiet) { setStatus('Aucune formule dans la sélection. Sélectionne toute la formule dans le document.', true); } return; }
            if (info.hasText) {
                setStatus('La sélection contient du texte en plus de la formule : sélectionne uniquement la formule pour la modifier.', true);
                return;
            }
            var out;
            try { out = M.jsonToLatex(o.json); } catch (e2) { setStatus('Structure de formule non reconnue : ' + e2.message, true); return; }
            if (!out.latex) { if (!quiet) { setStatus('Formule vide.', true); } return; }
            var load = function () {
                if (mf.setValue) { mf.setValue(out.latex); }
                M.setReplaceMode(true);
                var warn = out.warnings.length ? ' Attention : ' + out.warnings.join(' ; ') + '.' : '';
                setStatus('Formule chargée. Modifie-la puis clique sur « Insérer » pour remplacer l\'ancienne.' + warn, out.warnings.length > 0);
            };
            if (window.customElements && customElements.whenDefined) { customElements.whenDefined('math-field').then(load); } else { load(); }
        });
    }
    M.editSelection = editSelection;

    // Annote la sélection du document : color = [r,g,b] | 'auto' ; strike = true/false/undefined
    function annotate(color, strike) {
        window.Asc.scope.matheasyAnno = { color: color, strike: strike };
        window.Asc.plugin.callCommand(function () {
            var a = Asc.scope.matheasyAnno;
            var doc = Api.GetDocument();
            var r = doc.GetRangeBySelect();
            if (!r) { return 'Aucune sélection dans le document.'; }
            if (a.color === 'auto') { r.SetColor(0, 0, 0, true); }
            else if (a.color) { r.SetColor(a.color[0], a.color[1], a.color[2], false); }
            if (a.strike !== undefined) { r.SetStrikeout(a.strike); }
            return 'ok';
        }, false, true, function (res) {
            setStatus(res === 'ok' ? 'Sélection annotée.' : String(res), res !== 'ok');
        });
    }

    function buildPalettes(mf) {
        var tabs = $('tabs'), grid = $('palette');
        var palettes = M.PALETTES || [];
        function show(p) {
            grid.innerHTML = '';
            p.items.forEach(function (it) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'key';
                b.textContent = it.label;
                b.title = it.title || it.latex;
                b.addEventListener('click', function () {
                    if (mf.insert) { mf.insert(it.latex, { focus: true, format: 'latex' }); }
                    else { setStatus('Éditeur MathLive non chargé.', true); }
                });
                grid.appendChild(b);
            });
            Array.prototype.forEach.call(tabs.children, function (t) {
                t.classList.toggle('active', t.getAttribute('data-id') === p.id);
            });
        }
        palettes.forEach(function (p) {
            var t = document.createElement('button');
            t.type = 'button';
            t.className = 'tab';
            t.setAttribute('data-id', p.id);
            t.textContent = p.title;
            t.addEventListener('click', function () { show(p); });
            tabs.appendChild(t);
        });
        if (palettes.length) { show(palettes[0]); }
    }

    M.initEditor = function () {
        var mf = $('mf');
        buildPalettes(mf);
        $('btn-insert').addEventListener('click', insertIntoDocument);
        $('btn-edit').addEventListener('click', function () { editSelection(false); });
        $('btn-cancel-edit').addEventListener('click', function () { M.setReplaceMode(false); setStatus('Modification annulée.', false); });
        $('btn-clear').addEventListener('click', function () { if (mf.setValue) { mf.setValue(''); } mf.focus(); });
        $('btn-red').addEventListener('click', function () { annotate([220, 0, 0]); });
        $('btn-blue').addEventListener('click', function () { annotate([0, 70, 200]); });
        $('btn-green').addEventListener('click', function () { annotate([0, 140, 40]); });
        $('btn-nocolor').addEventListener('click', function () { annotate('auto'); });
        $('btn-strike').addEventListener('click', function () { annotate(undefined, true); });
        $('btn-nostrike').addEventListener('click', function () { annotate(undefined, false); });

        // À l'ouverture : si une formule est sélectionnée dans le document, on la charge pour modification
        editSelection(true);

        // Le clavier virtuel de MathLive est remplacé par nos palettes
        try { if (window.mathVirtualKeyboard) { window.mathVirtualKeyboard.visible = false; } } catch (e) { /* ignoré */ }
        try { mf.mathVirtualKeyboardPolicy = 'manual'; } catch (e2) { /* ignoré */ }

        // Détection d'un échec de chargement de MathLive (réseau, CDN)
        setTimeout(function () {
            if (!window.customElements || !customElements.get('math-field')) {
                setStatus('MathLive n\'a pas pu être chargé (connexion internet ? ). L\'éditeur est indisponible.', true);
            }
        }, 4000);
    };
})(window.Matheasy);
