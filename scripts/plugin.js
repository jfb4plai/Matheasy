/**
 * Matheasy — phase 0 : insère le corpus (corpus/formules.json) dans le document.
 * Un libellé + une équation par ligne. Les formules ayant une variante MathML
 * sont insérées deux fois (LaTeX puis MathML) pour comparer les rendus.
 * Chaque insertion renvoie un diagnostic (booléen de AddMathEquation ou erreur).
 */
(function () {
    'use strict';

    function log(msg) {
        document.getElementById('log').textContent += msg + '\n';
    }

    window.Asc.plugin.init = function () {
        document.getElementById('run-corpus').addEventListener('click', insertCorpus);
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

    function insertCorpus() {
        document.getElementById('log').textContent = '';
        fetch('corpus/formules.json')
            .then(function (r) { return r.json(); })
            .then(function (items) {
                var tests = buildTests(items);
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
