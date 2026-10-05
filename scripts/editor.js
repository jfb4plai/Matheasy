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

    // ---- Champ multi-lignes : une ligne du champ = un paragraphe du document, commentaire facultatif à droite ----
    M.activeField = null;

    function refreshNoteOpts() {
        var mf = $('mf');
        var v = (mf.getValue ? mf.getValue('latex') : '') || '';
        var show = v.indexOf('\\text{') !== -1 || v.indexOf('\\\\') !== -1 || v.indexOf('displaylines') !== -1;
        $('noteopts').style.display = show ? 'block' : 'none';
    }

    // Nouvelle ligne : on quitte d'abord un éventuel commentaire (mode texte), puis MathLive ajoute la ligne
    function newLine() {
        var mf = $('mf');
        try {
            mf.focus();
            mf.executeCommand(['switchMode', 'math']);
            mf.executeCommand('addRowAfter');
        } catch (e) { /* ignoré */ }
        refreshNoteOpts();
    }

    // Commentaire : espace puis mode texte (le texte tapé est conservé tel quel, avec ses espaces)
    function addComment() {
        var mf = $('mf');
        try {
            mf.focus();
            mf.insert('\\quad', { format: 'latex' });
            mf.executeCommand(['switchMode', 'text']);
        } catch (e) { /* ignoré */ }
        refreshNoteOpts();
    }

    function insertSteps(lines) {
        if (!lines.length) { setStatus('Rien à insérer : toutes les lignes sont vides.', true); return; }
        var prepared = [];
        for (var i = 0; i < lines.length; i++) {
            var latex = M.sanitizeLatex(lines[i].latex);
            var bad = M.UNSUPPORTED.filter(function (c) { return latex.indexOf(c) !== -1; });
            if (bad.length) { setStatus('Ligne ' + (i + 1) + ' : commande non prise en charge par ONLYOFFICE : ' + bad.join(', ') + '.', true); return; }
            prepared.push({ latex: latex, note: (lines[i].note || '').trim() });
        }
        window.Asc.scope.matheasyLines = prepared;
        window.Asc.scope.matheasyNoteGap = parseInt($('notegap').value, 10) || 16;
        window.Asc.scope.matheasyNoteItalic = $('noteitalic').checked;
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var L = Asc.scope.matheasyLines;
            var res = { ok: 0, fail: 0, noteSkipped: false, errors: [] };
            var canText = (typeof doc.EnterText === 'function');
            var canBreak = (typeof doc.InsertParagraphBreak === 'function');
            for (var i = 0; i < L.length; i++) {
                try {
                    if (canText) { doc.EnterText('​'); }
                    var ok = doc.AddMathEquation(L[i].latex, 'latex');
                    if (ok === false) { res.fail++; } else { res.ok++; }
                    if (L[i].note) {
                        if (canText) {
                            // Sortir de l'équation (curseur d'un cran à droite) pour écrire le commentaire en texte ordinaire
                            if (typeof doc.MoveCursorRight === 'function') {
                                try { doc.MoveCursorRight(1, false, false); res.moved = (res.moved || 0) + 1; } catch (eM) { res.errors.push('MoveCursorRight : ' + eM.message); }
                            } else { res.errors.push('MoveCursorRight absent : le commentaire peut rester dans la formule'); }
                            var gap = '';
                            for (var g = 0; g < Asc.scope.matheasyNoteGap; g++) { gap += '\u00A0'; }
                            doc.EnterText(gap + L[i].note);
                            if (Asc.scope.matheasyNoteItalic) {
                                try {
                                    var run = (typeof doc.GetCurrentRun === 'function') ? doc.GetCurrentRun() : null;
                                    if (run && typeof run.SetItalic === 'function') { run.SetItalic(true); res.italic = (res.italic || 0) + 1; }
                                } catch (eI) { res.errors.push('italique : ' + eI.message); }
                            }
                        } else { res.noteSkipped = true; }
                    }
                    if (i < L.length - 1) {
                        if (canBreak) { doc.InsertParagraphBreak(); } else { res.errors.push('InsertParagraphBreak absent'); }
                    }
                } catch (e) { res.fail++; res.errors.push('ligne ' + (i + 1) + ' : ' + e.message); }
            }
            return JSON.stringify(res);
        }, false, true, function (out) {
            var r = {}; try { r = JSON.parse(out); } catch (e) { /* ignoré */ }
            var msg = (r.ok || 0) + ' ligne(s) insérée(s)' + (r.fail ? ', ' + r.fail + ' échec(s)' : '') + '.';
            if (r.noteSkipped) { msg += ' Commentaires non insérés (EnterText absent).'; }
            if (r.moved !== undefined || r.italic !== undefined) { msg += ' [sortie de formule : ' + (r.moved || 0) + ', italique : ' + (r.italic || 0) + ']'; }
            if (r.errors && r.errors.length) { msg += ' ' + r.errors.join(' ; '); }
            setStatus(msg, !!(r.fail || (r.errors && r.errors.length)));
            if (!r.fail) {
                if ($('autoclear').checked) {
                    var m = $('mf'); if (m.setValue) { m.setValue(''); }
                    refreshNoteOpts();
                }
                if ($('closeafter').checked) { window.Asc.plugin.executeCommand('close', ''); }
            }
        });
    }

    function insertIntoDocument() {
        var mf = $('mf');
        var raw = (mf.getValue ? mf.getValue('latex') : mf.value) || '';
        if (!raw.trim()) { setStatus('Rien à insérer : le champ est vide.', true); return; }
        var lines = M.splitLines(raw);
        if (!lines.length) { setStatus('Rien à insérer : le champ est vide.', true); return; }
        if (lines.length > 1 || lines[0].note) {
            if (M.replaceMode) {
                setStatus('En mode modification, une seule ligne sans commentaire peut remplacer la formule. Clique sur « Annuler » pour insérer plusieurs lignes.', true);
                return;
            }
            insertSteps(lines);
            return;
        }
        var latex = M.sanitizeLatex(lines[0].latex);
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
        if (M.replaceMode && M.replaceTarget && M.replaceTarget.kind === 'paragraph') {
            window.Asc.scope.matheasyTarget = M.replaceTarget;
            window.Asc.plugin.callCommand(function () {
                var doc = Api.GetDocument();
                var t = Asc.scope.matheasyTarget;
                function sig(str) { return (String(str).match(/"value":\d+/g) || []).join(','); }
                var p = null;
                try { p = doc.GetElement(t.idx); } catch (e) { /* ignoré */ }
                if (!p) { return JSON.stringify({ ok: false, error: 'Paragraphe introuvable : le document a changé.' }); }
                var cur = p.ToJSON(false, false);
                if (typeof cur !== 'string') { cur = JSON.stringify(cur); }
                if (sig(cur) !== sig(t.json)) { return JSON.stringify({ ok: false, error: 'Le document a changé depuis le chargement de la formule : recharge-la.' }); }
                p.RemoveAllElements();
                p.Select();
                if (t.inline && typeof doc.EnterText === 'function') { doc.EnterText('\u200B'); }
                var ok = doc.AddMathEquation(Asc.scope.matheasyLatex, 'latex');
                return JSON.stringify({ ok: ok, note: t.inline ? '(remplacement en ligne, dans le paragraphe d\'origine)' : '(remplacement dans le paragraphe d\'origine)' });
            }, false, true, function (res) {
                var o = {}; try { o = JSON.parse(res); } catch (e) { /* ignoré */ }
                if (o.error) { setStatus(o.error, true); return; }
                finish(o.ok, o.note);
            });
            return;
        }
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
    M.replaceTarget = null;
    M.setReplaceMode = function (on) {
        M.replaceMode = on;
        if (!on) { M.replaceTarget = null; }
        $('editmode').style.display = on ? 'flex' : 'none';
    };

    // Lecture de la formule à modifier.
    //  auto = true  : appelé à l'ouverture de la fenêtre -> seulement si une sélection existe
    //  auto = false : bouton / menu -> la sélection, sinon le paragraphe sous le curseur
    // arg : true = ouverture (sélection seule, silencieux) ; false = bouton/menu (sélection ou curseur) ; 'dbl' = double-clic (curseur, silencieux)
    function editSelection(arg) {
        var mf = $('mf');
        var quiet = (arg === true || arg === 'dbl');
        window.Asc.scope.matheasyAuto = (arg === true);
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var out = {};
            var r = null;
            try { r = doc.GetRangeBySelect(); } catch (e0) { /* ignoré */ }
            var para = null;
            try { if (r && typeof r.GetParagraph === 'function') { para = r.GetParagraph(0); } } catch (e1) { /* ignoré */ }
            if (!para && !Asc.scope.matheasyAuto) { try { para = doc.GetCurrentParagraph(); } catch (e2) { /* ignoré */ } }
            if (r) {
                try { var j = r.ToJSON(false); out.rangeJson = (typeof j === 'string') ? j : JSON.stringify(j); } catch (e3) { out.rangeError = e3.message; }
            }
            if (para) {
                try { var pj = para.ToJSON(false, false); out.paraJson = (typeof pj === 'string') ? pj : JSON.stringify(pj); } catch (e4) { out.paraError = e4.message; }
                try { out.idx = para.GetPosInParent(); } catch (e5) { /* ignoré */ }
            }
            out.hasSelection = !!r;
            return JSON.stringify(out);
        }, false, true, function (res) {
            var o = {};
            try { o = JSON.parse(res); } catch (e) { if (!quiet) { setStatus('Réponse illisible d\'ONLYOFFICE.', true); } return; }
            if (!o.rangeJson && !o.paraJson) { if (!quiet) { setStatus('Aucune formule : sélectionne-la dans le document, ou place le curseur dans son paragraphe.', true); } return; }

            // 1) Paragraphe entier = une formule seule : lecture fiable (racines complètes) + remplacement exact
            var chosen = null, target = null, info;
            if (o.paraJson) {
                try { info = M.jsonInfo(o.paraJson); } catch (e0) { info = null; }
                if (info && info.hasMath && !info.hasText) {
                    chosen = o.paraJson;
                    if (o.idx !== undefined && o.idx !== null) { target = { kind: 'paragraph', idx: o.idx, json: o.paraJson, inline: o.paraJson.indexOf('"paraMath"') === -1 }; }
                }
            }
            // 2) Sinon : la sélection seule (formule dans du texte), remplacement par insertion sur la sélection
            if (!chosen && o.rangeJson) {
                try { info = M.jsonInfo(o.rangeJson); } catch (e1) { info = null; }
                if (info && info.hasMath && !info.hasText) { chosen = o.rangeJson; target = { kind: 'selection' }; }
                else if (info && info.hasMath && info.hasText) {
                    setStatus('La sélection contient du texte en plus de la formule : sélectionne uniquement la formule pour la modifier.', true);
                    return;
                }
            }
            if (!chosen) {
                if (!quiet) {
                    var mixed = false;
                    try { var pi = o.paraJson ? M.jsonInfo(o.paraJson) : null; mixed = !!(pi && pi.hasMath && pi.hasText); } catch (eMix) { /* ignoré */ }
                    setStatus(mixed
                        ? 'Cette ligne contient du texte en plus de la formule (un commentaire, par exemple) : sélectionne uniquement la formule avec la souris, puis clique sur « Modifier ».'
                        : 'Aucune formule dans la sélection ou sous le curseur.', true);
                }
                return;
            }

            var out;
            try { out = M.jsonToLatex(chosen); } catch (e2) { setStatus('Structure de formule non reconnue : ' + e2.message, true); return; }
            if (!out.latex) { if (!quiet) { setStatus('Formule vide.', true); } return; }
            var load = function () {
                if ($('detect')) { $('detect').style.display = 'none'; }
                if (mf.setValue) { mf.setValue(out.latex); }
                M.replaceTarget = target;
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
                    var field = (M.activeField && document.body.contains(M.activeField)) ? M.activeField : mf;
                    if (field.insert) { field.insert(it.latex, { focus: true, format: 'latex' }); }
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

    // ---- Mode panneau latéral : le document reste utilisable, le panneau suit le curseur ----
    M.mode = (/[?&]mode=panel/.test(location.search)) ? 'panel' : 'window';
    var cursorTimer = null;
    M.checkCursor = function () {
        if (M.mode !== 'panel' || M.replaceMode) { return; }
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var p = null;
            try { p = doc.GetCurrentParagraph(); } catch (e) { /* ignoré */ }
            if (!p) { return JSON.stringify({}); }
            try { var j = p.ToJSON(false, false); return JSON.stringify({ json: (typeof j === 'string') ? j : JSON.stringify(j) }); }
            catch (e2) { return JSON.stringify({}); }
        }, false, true, function (res) {
            var show = false;
            try {
                var o = JSON.parse(res);
                if (o.json) { var info = M.jsonInfo(o.json); show = info.hasMath && !info.hasText; }
            } catch (e) { /* ignoré */ }
            if ($('detect')) { $('detect').style.display = (show && !M.replaceMode) ? 'flex' : 'none'; }
        });
    };
    M.onCursorMoved = function () {
        if (M.mode !== 'panel') { return; }
        clearTimeout(cursorTimer);
        cursorTimer = setTimeout(M.checkCursor, 350);
    };
    M.onDoubleClick = function () {
        setTimeout(function () { editSelection('dbl'); }, 250);
    };

    M.initEditor = function () {
        var mf = $('mf');
        if (M.mode === 'panel') {
            document.body.classList.add('panel');
            if ($('closeafter')) { $('closeafter').checked = false; $('closeafter').parentNode.style.display = 'none'; }
        }
        if ($('btn-detect-edit')) { $('btn-detect-edit').addEventListener('click', function () { editSelection(false); }); }
        buildPalettes(mf);
        $('btn-insert').addEventListener('click', insertIntoDocument);
        $('btn-newline').addEventListener('click', newLine);
        $('btn-comment').addEventListener('click', addComment);
        mf.addEventListener('input', refreshNoteOpts);
        // Entrée = nouvelle ligne (dans une matrice : nouvelle ligne de la matrice) ; Maj+Suppr supprime la ligne (MathLive)
        mf.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !ev.shiftKey) {
                ev.preventDefault();
                ev.stopPropagation();
                newLine();
            }
        }, true);
        refreshNoteOpts();
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
