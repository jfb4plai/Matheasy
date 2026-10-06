/**
 * Matheasy — tracé de fonctions dans le panneau (sans GeoGebra, sans internet).
 *  - M.compileFunction(expr) : expression au format GeoGebra (voir geogebra.js) -> fonction JS de x
 *  - M.drawPlot(canvas, funcs, opts) : courbes, axes, grille, zéros, intersections de f et g
 */
window.Matheasy = window.Matheasy || {};

(function (M) {
    'use strict';

    var FUNCS = {
        sqrt: function (a) { return a < 0 ? NaN : Math.sqrt(a); },
        abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
        asin: Math.asin, acos: Math.acos, atan: Math.atan,
        ln: Math.log, log: function (a) { return Math.log(a) / Math.LN10; }, exp: Math.exp,
        sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
        nthroot: function (a, n) {
            if (n % 2 !== 0 && Number.isInteger(n)) { return (a < 0 ? -1 : 1) * Math.pow(Math.abs(a), 1 / n); }
            return a < 0 ? NaN : Math.pow(a, 1 / n);
        }
    };
    var CONSTS = { pi: Math.PI, e: Math.E };

    function tokenize(src) {
        var s = String(src).replace(/\s+/g, ''), re = /\d+(?:\.\d+)?|\.\d+|[a-zA-Z]+|[-+*/^(),]/g, m, toks = [], last = 0;
        while ((m = re.exec(s))) {
            if (m.index !== last) { throw new Error('caractère inattendu : ' + s.charAt(last)); }
            last = re.lastIndex; toks.push(m[0]);
        }
        if (last !== s.length) { throw new Error('caractère inattendu : ' + s.charAt(last)); }
        // multiplication implicite : 2x, 7x, 2(x+1), (x+1)(x-1), x(x+1)
        var out = [];
        for (var i = 0; i < toks.length; i++) {
            var t = toks[i], p = out[out.length - 1];
            if (p !== undefined) {
                var pVal = /^(\d|\.)/.test(p) || p === ')' || p === 'x' || CONSTS.hasOwnProperty(p);
                var tVal = /^(\d|\.)/.test(t) || /^[a-zA-Z]/.test(t) || t === '(';
                if (pVal && tVal) { out.push('*'); }
            }
            out.push(t);
        }
        return out;
    }

    M.compileFunction = function (expr) {
        var toks = tokenize(expr), pos = 0;
        function peek() { return toks[pos]; }
        function next() { return toks[pos++]; }
        function expect(t) { if (next() !== t) { throw new Error('« ' + t + ' » attendu'); } }
        function parseExpr() {
            var l = parseTerm();
            while (peek() === '+' || peek() === '-') {
                var op = next(), r = parseTerm();
                l = (function (a, b, o) { return o === '+' ? function (x) { return a(x) + b(x); } : function (x) { return a(x) - b(x); }; })(l, r, op);
            }
            return l;
        }
        function parseTerm() {
            var l = parseUnary();
            while (peek() === '*' || peek() === '/') {
                var op = next(), r = parseUnary();
                l = (function (a, b, o) { return o === '*' ? function (x) { return a(x) * b(x); } : function (x) { return a(x) / b(x); }; })(l, r, op);
            }
            return l;
        }
        function parseUnary() {
            if (peek() === '-') { next(); var u = parseUnary(); return function (x) { return -u(x); }; }
            if (peek() === '+') { next(); return parseUnary(); }
            return parsePower();
        }
        function parsePower() {
            var b = parseAtom();
            if (peek() === '^') { next(); var e = parseUnary(); return function (x) { return Math.pow(b(x), e(x)); }; }
            return b;
        }
        function parseAtom() {
            var t = next();
            if (t === undefined) { throw new Error('expression incomplète'); }
            if (/^(\d|\.)/.test(t)) { var v = parseFloat(t); return function () { return v; }; }
            if (t === '(') { var inner = parseExpr(); expect(')'); return inner; }
            if (t === 'x') { return function (x) { return x; }; }
            if (CONSTS.hasOwnProperty(t)) { var c = CONSTS[t]; return function () { return c; }; }
            if (FUNCS.hasOwnProperty(t)) {
                expect('(');
                var args = [parseExpr()];
                while (peek() === ',') { next(); args.push(parseExpr()); }
                expect(')');
                var f = FUNCS[t];
                return function (x) { var vals = []; for (var i = 0; i < args.length; i++) { vals.push(args[i](x)); } return f.apply(null, vals); };
            }
            throw new Error('symbole non reconnu : ' + t);
        }
        var fn = parseExpr();
        if (pos < toks.length) { throw new Error('reste inattendu : ' + toks[pos]); }
        return fn;
    };

    function fmt(v) { return String(parseFloat(v.toFixed(3))); }

    function findRoots(fn, a, b) {
        var N = 1200, roots = [], prevX = a, prevY = fn(a);
        for (var i = 1; i <= N; i++) {
            var x = a + (b - a) * i / N, y = fn(x);
            if (isFinite(prevY) && isFinite(y)) {
                if (y === 0) { roots.push(x); }
                else if (prevY * y < 0) {
                    var lo = prevX, hi = x, flo = prevY;
                    for (var k = 0; k < 50; k++) {
                        var mid = (lo + hi) / 2, fm = fn(mid);
                        if (fm * flo <= 0) { hi = mid; } else { lo = mid; flo = fm; }
                    }
                    var r = (lo + hi) / 2;
                    if (Math.abs(fn(r)) < 1e-3) { roots.push(r); } // écarte les asymptotes (changement de signe sans zéro)
                }
            }
            prevX = x; prevY = y;
        }
        var res = [];
        roots.forEach(function (r) { if (!res.length || Math.abs(r - res[res.length - 1]) > 1e-6) { res.push(r); } });
        return res;
    }
    M.findRoots = findRoots;

    function niceStep(raw) {
        var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / p;
        return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
    }

    /** funcs : [{ fn, color, label }] ; opts : { xmin, xmax, ymin?, ymax? } ; renvoie { zeros: [[x…],…], inter: [x…] } */
    M.drawPlot = function (canvas, funcs, opts) {
        var ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
        var xmin = opts.xmin, xmax = opts.xmax, N = W * 2;
        var ymin = opts.ymin, ymax = opts.ymax;
        if (!(ymin < ymax)) {
            var vals = [];
            funcs.forEach(function (f) { for (var i = 0; i <= N; i++) { var y = f.fn(xmin + (xmax - xmin) * i / N); if (isFinite(y) && Math.abs(y) < 1e6) { vals.push(y); } } });
            vals.sort(function (a, b) { return a - b; });
            if (vals.length < 2) { ymin = -5; ymax = 5; }
            else {
                ymin = vals[Math.floor(vals.length * 0.02)]; ymax = vals[Math.floor(vals.length * 0.98)];
                if (ymax - ymin < 1e-9) { ymin -= 1; ymax += 1; }
                var mg = (ymax - ymin) * 0.12; ymin -= mg; ymax += mg;
                if (ymin > 0) { ymin = -(ymax - ymin) * 0.05; }
                if (ymax < 0) { ymax = (ymax - ymin) * 0.05; }
            }
        }
        function px(x) { return (x - xmin) / (xmax - xmin) * W; }
        function py(y) { return H - (y - ymin) / (ymax - ymin) * H; }
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        // grille + graduations
        ctx.font = '10px sans-serif'; ctx.textBaseline = 'top';
        var sx = niceStep((xmax - xmin) / 8), sy = niceStep((ymax - ymin) / 6), v;
        ctx.lineWidth = 1; ctx.strokeStyle = '#e3e3e3'; ctx.fillStyle = '#666';
        var x0 = Math.min(Math.max(0, xmin), xmax), y0 = Math.min(Math.max(0, ymin), ymax);
        for (v = Math.ceil(xmin / sx) * sx; v <= xmax + 1e-9; v += sx) {
            ctx.beginPath(); ctx.moveTo(px(v), 0); ctx.lineTo(px(v), H); ctx.stroke();
            if (Math.abs(v) > 1e-9) { ctx.textAlign = 'center'; ctx.fillText(fmt(v), px(v), Math.min(py(y0) + 3, H - 12)); }
        }
        for (v = Math.ceil(ymin / sy) * sy; v <= ymax + 1e-9; v += sy) {
            ctx.beginPath(); ctx.moveTo(0, py(v)); ctx.lineTo(W, py(v)); ctx.stroke();
            if (Math.abs(v) > 1e-9) { ctx.textAlign = 'left'; ctx.fillText(fmt(v), Math.min(px(x0) + 3, W - 28), py(v) + 2); }
        }
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, py(y0)); ctx.lineTo(W, py(y0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(x0), 0); ctx.lineTo(px(x0), H); ctx.stroke();
        // courbes
        funcs.forEach(function (f) {
            ctx.strokeStyle = f.color; ctx.lineWidth = 2; ctx.beginPath();
            var pen = false, prevPy = 0;
            for (var i = 0; i <= N; i++) {
                var x = xmin + (xmax - xmin) * i / N, y = f.fn(x), yy = py(y);
                if (!isFinite(y) || yy < -4 * H || yy > 5 * H) { pen = false; continue; }
                if (pen && Math.abs(yy - prevPy) > H * 0.9) { pen = false; } // saut : asymptote
                if (!pen) { ctx.moveTo(px(x), yy); pen = true; } else { ctx.lineTo(px(x), yy); }
                prevPy = yy;
            }
            ctx.stroke();
        });
        // points remarquables
        function dot(x, y, color, label) {
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px(x), py(y), 4, 0, 6.2832); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText(label, px(x) + 5, py(y) - 3);
        }
        var out = { zeros: [], inter: [] };
        funcs.forEach(function (f) {
            var z = findRoots(f.fn, xmin, xmax); out.zeros.push(z);
            z.forEach(function (r) { dot(r, 0, '#d00000', 'x≈' + fmt(r)); });
        });
        if (funcs.length > 1) {
            var d = function (x) { return funcs[0].fn(x) - funcs[1].fn(x); };
            out.inter = findRoots(d, xmin, xmax);
            out.inter.forEach(function (r) { dot(r, funcs[0].fn(r), '#7a1fa2', '(' + fmt(r) + ' ; ' + fmt(funcs[0].fn(r)) + ')'); });
        }
        ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
        return out;
    };
})(window.Matheasy);
