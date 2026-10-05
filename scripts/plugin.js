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
