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
        document.getElementById('run-corpus').addEventListener('click', function () { run('corpus/formules.json', false); });
        document.getElementById('run-exp').addEventListener('click', function () { run('corpus/experiences.json', true); });
        document.getElementById('run-probe').addEventListener('click', probeApi);
        document.getElementById('run-fmt').addEventListener('click', testFormatSelection);
        document.getElementById('run-json').addEventListener('click', readSelectionJson);
        document.getElementById('run-methods').addEventListener('click', listAllMethods);
        document.getElementById('run-md').addEventListener('click', convertToMarkdown);
        document.getElementById('run-roundtrip').addEventListener('click', roundTripJson);
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
