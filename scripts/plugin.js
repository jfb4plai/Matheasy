/**
 * Matheasy — phase 0 : insère le corpus de formules (corpus/formules.json)
 * via ApiDocument.AddMathEquation, un paragraphe par formule.
 * Non testé dans un ONLYOFFICE réel à ce stade.
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

    function insertCorpus() {
        fetch('corpus/formules.json')
            .then(function (r) { return r.json(); })
            .then(function (items) {
                window.Asc.scope.items = items;
                window.Asc.plugin.callCommand(function () {
                    var doc = Api.GetDocument();
                    var items = Asc.scope.items;
                    for (var i = 0; i < items.length; i++) {
                        var p = Api.CreateParagraph();
                        p.AddText(items[i].id + ' — ' + items[i].label + ' : ');
                        doc.Push(p);
                        doc.AddMathEquation(items[i].latex, 'latex');
                    }
                }, false, true, function () { log('Corpus inséré : ' + items.length + ' formules.'); });
            })
            .catch(function (e) { log('Erreur : ' + e.message); });
    }
})();
