/**
 * Matheasy — phase 0 : insère le corpus (corpus/formules.json) dans le document.
 * Un libellé + une équation par ligne. Les formules ayant une variante MathML
 * sont insérées deux fois (LaTeX puis MathML) pour comparer les rendus.
 * Chaque insertion renvoie un diagnostic (booléen de AddMathEquation ou erreur).
 */
(function () {
    'use strict';

    function log(msg) {
        document.getElementById('log').value += msg + '\n';
    }

    window.Asc.plugin.init = function () {
        if (window.Matheasy && window.Matheasy.initEditor) { window.Matheasy.initEditor(); }
        document.getElementById('run-corpus').addEventListener('click', function () { run('corpus/formules.json', false); });
        document.getElementById('run-exp').addEventListener('click', function () { run('corpus/experiences.json', true); });
        document.getElementById('run-probe').addEventListener('click', probeApi);
        document.getElementById('run-fmt').addEventListener('click', testFormatSelection);
        document.getElementById('run-json').addEventListener('click', readSelectionJson);
        document.getElementById('run-methods').addEventListener('click', listAllMethods);
        document.getElementById('run-md').addEventListener('click', convertToMarkdown);
        document.getElementById('run-roundtrip').addEventListener('click', roundTripJson);
        document.getElementById('run-summary').addEventListener('click', summarizeEquations);
        document.getElementById('run-dstyle').addEventListener('click', displayStyleTest);
        document.getElementById('run-leftjson').addEventListener('click', leftAlignTest);
        document.getElementById('clear-events').addEventListener('click', function () { document.getElementById('events').value = ''; });
    };

    window.Asc.plugin.button = function () {
        this.executeCommand('close', '');
    };

    // Aplatit le corpus : une entrée par (formule, format)
    function buildTests(items) {
        var tests = [];
        items.forEach(function (it) {
            if (it.latex) tests.push({ label: it.id + ' — ' + it.label + ' [LaTeX]', text: it.latex, format: 'latex' });
            if (it.mathml) tests.push({ label: it.id + ' — ' + it.label + ' [MathML]', text: it.mathml, format: 'mathml' });
        });
        return tests;
    }

    // experiences.json : une entrée = un test {id, label, format, text}
    function buildExperiments(items) {
        return items.map(function (it) {
            return { label: it.id + ' — ' + it.label + ' [' + it.format + ']', text: it.text, format: it.format };
        });
    }

    // Sonde l'API : liste les méthodes dont le nom évoque équations, couleurs, barré, conversions, sélection
    function probeApi() {
        document.getElementById('log').value = '';
        try { log('Asc.plugin.info : ' + JSON.stringify(window.Asc.plugin.info)); } catch (e) { log('info KO : ' + e.message); }
        window.Asc.plugin.callCommand(function () {
            var re = /math|equation|color|colour|strike|border|box|latex|mathml|ooxml|json|convert|select|range|textpr|version/i;
            function names(obj) {
                var out = [];
                try { for (var k in obj) { if (re.test(k)) out.push(k); } } catch (e) { out.push('ERR ' + e.message); }
                return out.sort().join(', ');
            }
            var res = [];
            var doc = Api.GetDocument();
            res.push('== Api ==\n' + names(Api));
            res.push('== ApiDocument ==\n' + names(doc));
            try { res.push('== Paragraphe (CreateParagraph) ==\n' + names(Api.CreateParagraph())); } catch (e) { res.push('Paragraph KO ' + e.message); }
            try { res.push('== Run (CreateRun) ==\n' + names(Api.CreateRun())); } catch (e) { res.push('Run KO ' + e.message); }
            try { var r = doc.GetRangeBySelect(); res.push('== Range (sélection) ==\n' + names(r)); } catch (e) { res.push('GetRangeBySelect KO ' + e.message); }
            try { res.push('== Math* créables ==\n' + (function () { var o = []; for (var k in Api) { if (/^Create.*Math|^Create(Box|Border|Group|Nary|Func|Delimiter|Matrix|Accent|Bar|Limit|Radical|Fraction|Script)/i.test(k)) o.push(k); } return o.sort().join(', '); })()); } catch (e) { res.push('Create* KO ' + e.message); }
            try { var t = doc.GetSelectedText ? doc.GetSelectedText() : '(pas de GetSelectedText)'; res.push('== Texte sélectionné ==\n' + JSON.stringify(t)); } catch (e) { res.push('GetSelectedText KO ' + e.message); }
            return res;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n\n')); });
    }

    // Test : appliquer rouge + barré à la sélection (ex. "2x" sélectionné DANS une équation)
    function testFormatSelection() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var out = [];
            var r = null;
            try { r = doc.GetRangeBySelect(); } catch (e) { out.push('GetRangeBySelect ERREUR : ' + e.message); }
            if (!r) { out.push('GetRangeBySelect a renvoyé : ' + r); return out; }
            try { out.push('SetColor(255,0,0) -> ' + r.SetColor(255, 0, 0, false)); } catch (e) { out.push('SetColor ERREUR : ' + e.message); }
            try { out.push('SetStrikeout(true) -> ' + r.SetStrikeout(true)); } catch (e) { out.push('SetStrikeout ERREUR : ' + e.message); }
            out.push('Regarde le document : la sélection est-elle devenue rouge et/ou barrée ?');
            return out;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n')); });
    }

    // Test : lire la sélection en JSON (équation incluse ?)
    function readSelectionJson() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var out = [];
            var r = null;
            try { r = doc.GetRangeBySelect(); } catch (e) { out.push('GetRangeBySelect ERREUR : ' + e.message); }
            if (!r) { out.push('GetRangeBySelect a renvoyé : ' + r); }
            else {
                try {
                    var j = r.ToJSON(false);
                    var str = (typeof j === 'string') ? j : JSON.stringify(j);
                    out.push('Range.ToJSON : ' + str.length + ' caractères\n' + str.substring(0, 6000));
                } catch (e) { out.push('Range.ToJSON ERREUR : ' + e.message); }
            }
            try {
                var el = doc.GetElement(0);
                if (el && el.ToJSON) {
                    var pj = el.ToJSON(false, false);
                    var ps = (typeof pj === 'string') ? pj : JSON.stringify(pj);
                    out.push('Paragraphe 0 .ToJSON : ' + ps.length + ' caractères\n' + ps.substring(0, 6000));
                }
            } catch (e) { out.push('Paragraph.ToJSON ERREUR : ' + e.message); }
            return out;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n\n')); });
    }

    // Liste complète (sans filtre) des méthodes de quelques objets
    function listAllMethods() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            function all(obj) {
                var out = [];
                try { for (var k in obj) { out.push(k); } } catch (e) { out.push('ERR ' + e.message); }
                return out.sort().join(', ');
            }
            var doc = Api.GetDocument();
            var res = [];
            res.push('== Api ==\n' + all(Api));
            res.push('== ApiDocument ==\n' + all(doc));
            try { var r = doc.GetRangeBySelect(); res.push('== Range (sélection) ==\n' + all(r)); } catch (e) { res.push('Range KO ' + e.message); }
            try { res.push('== Paragraphe ==\n' + all(Api.CreateParagraph())); } catch (e) { res.push('Paragraph KO ' + e.message); }
            return res;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n\n')); });
    }

    // Convertit tout le document en Markdown : les équations ressortent-elles en LaTeX ?
    function convertToMarkdown() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            var out = [];
            try {
                var md = Api.ConvertDocument('markdown');
                var str = (typeof md === 'string') ? md : JSON.stringify(md);
                out.push('ConvertDocument(markdown) : ' + str.length + ' caractères\n' + str.substring(0, 6000));
            } catch (e) { out.push('ConvertDocument ERREUR : ' + e.message); }
            return out;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n\n')); });
    }

    // Aller-retour : sélection -> JSON -> FromJSON -> éléments poussés en fin de document
    function roundTripJson() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var out = [];
            var r = null;
            try { r = doc.GetRangeBySelect(); } catch (e) { out.push('GetRangeBySelect ERREUR : ' + e.message); }
            if (!r) { out.push('Aucune sélection (renvoi : ' + r + ')'); return out; }
            var j;
            try { j = r.ToJSON(false); if (typeof j !== 'string') { j = JSON.stringify(j); } out.push('ToJSON ok (' + j.length + ' caractères)'); } catch (e) { out.push('ToJSON ERREUR : ' + e.message); return out; }
            var el = null;
            try { el = Api.FromJSON(j); } catch (e) { out.push('FromJSON ERREUR : ' + e.message); return out; }
            var cls = '?';
            try { cls = el.GetClassType ? el.GetClassType() : '(pas de GetClassType)'; } catch (e) { cls = 'GetClassType ERREUR ' + e.message; }
            var keys = [];
            try { for (var k in el) { keys.push(k); } } catch (e) { keys.push('ERR ' + e.message); }
            out.push('FromJSON ok. Classe : ' + cls + '\nMéthodes de l\'objet : ' + keys.sort().join(', '));

            var label = Api.CreateParagraph();
            label.AddText('[Aller-retour JSON v3] éléments reconstruits ci-dessous :');
            doc.Push(label);

            var pushed = 0;
            var items = Array.isArray(el) ? el : [el];
            out.push('Tableau : ' + Array.isArray(el) + ', longueur : ' + items.length);
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                var info = 'élément ' + i + ' : typeof ' + typeof it;
                try {
                    var ks = [];
                    for (var kk in it) { ks.push(kk); }
                    info += ', ' + ks.length + ' méthodes/clés' + (ks.length ? ' (' + ks.slice(0, 12).join(', ') + ')' : '');
                    if (it && it.GetClassType) { info += ', classe ' + it.GetClassType(); }
                } catch (eI) { info += ', inspection ERREUR ' + eI.message; }
                out.push(info);
                try { doc.Push(it); pushed++; out.push('  Push(' + i + ') ok'); } catch (eP) { out.push('  Push(' + i + ') ERREUR : ' + eP.message); }
            }
            out.push('Éléments poussés : ' + pushed + '. Regarde la fin du document.');
            // Seconde voie : InsertContent à la fin (avec une nouvelle reconstruction)
            try {
                var el2 = Api.FromJSON(j);
                var arr2 = Array.isArray(el2) ? el2 : [el2];
                var lab2 = Api.CreateParagraph();
                lab2.AddText('[Seconde voie : InsertContent] ci-dessous :');
                doc.Push(lab2);
                var res2 = doc.InsertContent(arr2, false);
                out.push('InsertContent(' + arr2.length + ' élément(s)) -> ' + res2);
            } catch (e3) { out.push('InsertContent ERREUR : ' + e3.message); }
            out.push('doc.InsertContent existe : ' + (typeof doc.InsertContent));
            return out;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n')); });
    }

    // ---- Écoute d'événements du document (pour savoir ce qu'ONLYOFFICE nous signale) ----
    var eventCount = {};
    function logEvent(name, data) {
        eventCount[name] = (eventCount[name] || 0) + 1;
        var line = new Date().toLocaleTimeString() + '  ' + name + ' #' + eventCount[name];
        try { if (data !== undefined) { line += '  ' + JSON.stringify(data).substring(0, 200); } } catch (e) { /* ignoré */ }
        var box = document.getElementById('events');
        if (box) { box.value += line + '\n'; box.scrollTop = box.scrollHeight; }
    }
    // Menu contextuel (clic droit) : « Modifier avec Matheasy » (format de la documentation ONLYOFFICE)
    window.Asc.plugin.event_onContextMenuShow = function (options) {
        logEvent('onContextMenuShow', options);
        try {
            window.Asc.plugin.executeMethod('AddContextMenuItem', [{
                guid: window.Asc.plugin.guid,
                items: [{ id: 'matheasy-edit', text: { en: 'Edit with Matheasy', fr: 'Modifier avec Matheasy' } }]
            }]);
        } catch (e) { logEvent('AddContextMenuItem ERREUR', e.message); }
    };
    try {
        if (typeof window.Asc.plugin.attachContextMenuClickEvent === 'function') {
            window.Asc.plugin.attachContextMenuClickEvent('matheasy-edit', function () {
                logEvent('clic sur Modifier avec Matheasy');
                if (window.Matheasy && window.Matheasy.editSelection) { window.Matheasy.editSelection(false); }
            });
        } else { logEvent('attachContextMenuClickEvent absent'); }
    } catch (e2) { logEvent('attachContextMenuClickEvent ERREUR', e2.message); }

    ['onClick', 'onDblClick', 'onTargetPositionChanged', 'onDocumentContentReady', 'onEnableMouseEvent'].forEach(function (name) {
        window.Asc.plugin['event_' + name] = function (data) { logEvent(name, data); };
    });

    // Crochets : le panneau suit le curseur ; un double-clic (s'il est signalé) ouvre la formule en modification
    var baseTarget = window.Asc.plugin.event_onTargetPositionChanged;
    window.Asc.plugin.event_onTargetPositionChanged = function (d) {
        baseTarget(d);
        if (window.Matheasy && window.Matheasy.onCursorMoved) { window.Matheasy.onCursorMoved(); }
    };
    var baseDbl = window.Asc.plugin.event_onDblClick;
    window.Asc.plugin.event_onDblClick = function (d) {
        baseDbl(d);
        if (window.Matheasy && window.Matheasy.onDoubleClick) { window.Matheasy.onDoubleClick(); }
    };

    // ---- Résumé structurel compact de toutes les équations du document ----
    var SKIP = { bFromDocument: 1, rPr: 1, ctrlPr: 1, footnotes: 1, endnotes: 1, reviewType: 1, pPr: 1, changes: 1, mathPr: 1, argPr: 1 };
    function compact(n) {
        if (n === null) { return 'null'; }
        if (Array.isArray(n)) { return '[' + n.map(compact).join(' ') + ']'; }
        if (typeof n !== 'object') { return String(n); }
        if (n.type === 'mathRun') {
            return 'run"' + (n.content || []).map(function (c) {
                return c.type === 'mathTxt' ? String.fromCodePoint(c.value) : '<' + c.type + '>';
            }).join('') + '"';
        }
        var parts = [];
        for (var k in n) {
            if (k === 'type' || SKIP[k]) { continue; }
            parts.push(k + ':' + compact(n[k]));
        }
        return (n.type || 'obj') + '{' + parts.join(' ') + '}';
    }

    // Expérience : fraction en pleine taille dans une ligne (style d'affichage) ?
    function displayStyleTest() {
        document.getElementById('log').value = '';
        var ns = 'xmlns="http://www.w3.org/1998/Math/MathML"';
        window.Asc.scope.dstyle = [
            { label: '1) référence : \\frac{3}{4} (LaTeX)', text: '\\frac{3}{4}', format: 'latex' },
            { label: '2) \\displaystyle\\frac{3}{4} (LaTeX)', text: '\\displaystyle\\frac{3}{4}', format: 'latex' },
            { label: '3) mstyle displaystyle (MathML)', text: '<math ' + ns + '><mstyle displaystyle="true"><mfrac><mn>3</mn><mn>4</mn></mfrac></mstyle></math>', format: 'mathml' }
        ];
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var out = [];
            var T = Asc.scope.dstyle;
            for (var i = 0; i < T.length; i++) {
                try {
                    doc.EnterText(T[i].label + '  ');
                    var ok = doc.AddMathEquation(T[i].text, T[i].format);
                    out.push(T[i].label + ' -> ' + ok);
                    if (i < T.length - 1) { doc.InsertParagraphBreak(); }
                } catch (e) { out.push(T[i].label + ' ERREUR : ' + e.message); }
            }
            return out;
        }, false, true, function (res) { log((res || ['(pas de retour)']).join('\n') + '\nRegarde le document : une fraction est-elle plus grande que la référence ?'); });
    }

    // Expérience : aligner à gauche une équation centrée (affichage) en modifiant son JSON (oMathParaPr.jc)
    function leftAlignTest() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var p = doc.GetCurrentParagraph();
            if (!p) { return JSON.stringify({ err: 'Aucun paragraphe courant.' }); }
            var j = p.ToJSON(false, false);
            var obj = JSON.parse(typeof j === 'string' ? j : JSON.stringify(j));
            var n = 0;
            (function walk(x) {
                if (!x || typeof x !== 'object') { return; }
                if (Array.isArray(x)) { x.forEach(walk); return; }
                if (x.type === 'paraMath') { x.oMathParaPr = x.oMathParaPr || {}; x.oMathParaPr.jc = 'left'; n++; }
                for (var k in x) { walk(x[k]); }
            })(obj);
            if (!n) { return JSON.stringify({ err: 'Pas d\'équation centrée (paraMath) dans ce paragraphe.' }); }
            var el = Api.FromJSON(JSON.stringify(obj));
            var first = Array.isArray(el) ? el[0] : el;
            p.ReplaceByElement(first);
            return JSON.stringify({ ok: true, paraMath: n });
        }, false, true, function (res) {
            log('Résultat : ' + res + '\nRegarde le document : l\'équation est-elle maintenant alignée à gauche ?');
        });
    }

    function summarizeEquations() {
        document.getElementById('log').value = '';
        window.Asc.plugin.callCommand(function () {
            var doc = Api.GetDocument();
            var res = [];
            for (var i = 0; i < 120; i++) {
                var el = null;
                try { el = doc.GetElement(i); } catch (e) { break; }
                if (!el) { break; }
                try {
                    var j = el.ToJSON(false, false);
                    res.push((typeof j === 'string') ? j : JSON.stringify(j));
                } catch (e2) { res.push('{"erreur":"' + e2.message + '"}'); }
            }
            return res;
        }, false, true, function (res) {
            var lines = [];
            (res || []).forEach(function (str, i) {
                if (str.indexOf('"mathRun"') === -1) { return; }
                try { lines.push('P' + i + ' : ' + compact(JSON.parse(str))); } catch (e) { lines.push('P' + i + ' : JSON illisible (' + e.message + ')'); }
            });
            log(lines.length + ' paragraphe(s) contenant une équation sur ' + (res || []).length + '\n');
            log(lines.join('\n\n'));
        });
    }

    function run(file, isExperiment) {
        document.getElementById('log').value = '';
        fetch(file)
            .then(function (r) { return r.json(); })
            .then(function (items) {
                var tests = isExperiment ? buildExperiments(items) : buildTests(items);
                window.Asc.scope.tests = tests;
                window.Asc.plugin.callCommand(function () {
                    var doc = Api.GetDocument();
                    var tests = Asc.scope.tests;
                    var report = [];
                    for (var i = 0; i < tests.length; i++) {
                        var t = tests[i];
                        try {
                            var label = Api.CreateParagraph();
                            label.AddText(t.label);
                            doc.Push(label);
                            // Paragraphe vide qui recevra l'équation : on y place le curseur
                            var target = Api.CreateParagraph();
                            doc.Push(target);
                            var placed = 'curseur?';
                            try { target.GetRange().Select(); placed = 'curseur ok'; } catch (e1) { placed = 'Select KO: ' + e1.message; }
                            var ok = doc.AddMathEquation(t.text, t.format);
                            report.push(t.label + ' → ' + ok + ' (' + placed + ')');
                        } catch (e) {
                            report.push(t.label + ' → ERREUR : ' + e.message);
                        }
                    }
                    return report;
                }, false, true, function (report) {
                    log((report || ['(pas de retour)']).join('\n'));
                });
            })
            .catch(function (e) { log('Erreur : ' + e.message); });
    }
})();
