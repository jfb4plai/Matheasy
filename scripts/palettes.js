/**
 * Matheasy — palettes par thème (secondaire supérieur).
 * Chaque bouton : label (affiché), latex (inséré dans le champ MathLive), title (infobulle).
 * Syntaxe MathLive : #@ = sélection courante, #? = zone à remplir.
 * Les commandes LaTeX utilisées sont celles validées dans le corpus de test (voir README),
 * sauf mention contraire.
 */
window.Matheasy = window.Matheasy || {};

window.Matheasy.PALETTES = [
    {
        id: 'structures', title: 'Structures', items: [
            { label: 'a/b', latex: '\\frac{#@}{#?}', title: 'Fraction' },
            { label: 'xⁿ', latex: '#@^{#?}', title: 'Exposant' },
            { label: 'xₙ', latex: '#@_{#?}', title: 'Indice' },
            { label: '√', latex: '\\sqrt{#@}', title: 'Racine carrée' },
            { label: 'ⁿ√', latex: '\\sqrt[#?]{#@}', title: 'Racine n-ième' },
            { label: '( )', latex: '\\left(#@\\right)', title: 'Parenthèses' },
            { label: '[ ]', latex: '\\left[#@\\right]', title: 'Crochets' },
            { label: '{ }', latex: '\\left\\{#@\\right\\}', title: 'Accolades' },
            { label: '| |', latex: '\\left|#@\\right|', title: 'Valeur absolue' },
            { label: '‖ ‖', latex: '\\left\\|#@\\right\\|', title: 'Norme' },
            { label: '(n k)', latex: '\\binom{#?}{#?}', title: 'Coefficient binomial' },
            { label: 'v⃗', latex: '\\vec{#@}', title: 'Vecteur' },
            { label: 'x̄', latex: '\\overline{#@}', title: 'Barre (complémentaire, conjugué)' },
            { label: '⏟', latex: '\\underbrace{#@}_{#?}', title: 'Accolade avec légende dessous' },
            { label: 'sys', latex: '\\begin{cases}#? \\\\ #?\\end{cases}', title: 'Système d\'équations' },
            { label: 'mat', latex: '\\begin{pmatrix}#? & #? \\\\ #? & #?\\end{pmatrix}', title: 'Matrice 2×2' },
            { label: 'det', latex: '\\begin{vmatrix}#? & #? \\\\ #? & #?\\end{vmatrix}', title: 'Déterminant 2×2' },
            { label: 'ali', latex: '\\begin{aligned}#? &= #? \\\\ #? &= #?\\end{aligned}', title: 'Résolution alignée sur le =' }
        ]
    },
    {
        id: 'symboles', title: 'Symboles', items: [
            { label: '±', latex: '\\pm' }, { label: '×', latex: '\\times' }, { label: '÷', latex: '\\div' },
            { label: '·', latex: '\\cdot' }, { label: '≠', latex: '\\neq' }, { label: '≈', latex: '\\approx' },
            { label: '≤', latex: '\\leq' }, { label: '≥', latex: '\\geq' }, { label: '∞', latex: '\\infty' },
            { label: '°', latex: '^\\circ', title: 'Degré' }, { label: '→', latex: '\\to' }, { label: '⇒', latex: '\\Rightarrow' },
            { label: '⇔', latex: '\\Leftrightarrow' }, { label: '∥', latex: '\\parallel' }, { label: '⊥', latex: '\\perp' },
            { label: '∠', latex: '\\angle' }, { label: '△', latex: '\\triangle' }, { label: '∼', latex: '\\sim' }
        ]
    },
    {
        id: 'grec', title: 'Grec', items: [
            { label: 'α', latex: '\\alpha' }, { label: 'β', latex: '\\beta' }, { label: 'γ', latex: '\\gamma' },
            { label: 'δ', latex: '\\delta' }, { label: 'ε', latex: '\\varepsilon' }, { label: 'θ', latex: '\\theta' },
            { label: 'λ', latex: '\\lambda' }, { label: 'μ', latex: '\\mu' }, { label: 'π', latex: '\\pi' },
            { label: 'ρ', latex: '\\rho' }, { label: 'σ', latex: '\\sigma' }, { label: 'φ', latex: '\\varphi' },
            { label: 'ω', latex: '\\omega' }, { label: 'Δ', latex: '\\Delta' }, { label: 'Σ', latex: '\\Sigma' },
            { label: 'Φ', latex: '\\Phi' }, { label: 'Ω', latex: '\\Omega' }, { label: 'Π', latex: '\\Pi' }
        ]
    },
    {
        id: 'analyse', title: 'Analyse', items: [
            { label: 'lim', latex: '\\lim_{#? \\to #?} #@', title: 'Limite' },
            { label: '∫ᵃᵇ', latex: '\\int_{#?}^{#?} #@ \\ dx', title: 'Intégrale définie' },
            { label: '∫', latex: '\\int #@ \\ dx', title: 'Intégrale indéfinie' },
            { label: 'Σ', latex: '\\sum_{#?}^{#?} #@', title: 'Somme' },
            { label: 'd/dx', latex: '\\frac{d}{dx}', title: 'Dérivée' },
            { label: '∂/∂x', latex: '\\frac{\\partial #?}{\\partial #?}', title: 'Dérivée partielle' },
            { label: 'f′', latex: 'f\'(x)', title: 'f prime de x' },
            { label: 'sin', latex: '\\sin' }, { label: 'cos', latex: '\\cos' }, { label: 'tan', latex: '\\tan' },
            { label: 'ln', latex: '\\ln' }, { label: 'log', latex: '\\log' }, { label: 'eˣ', latex: 'e^{#?}' }
        ]
    },
    {
        id: 'ensembles', title: 'Ensembles & logique', items: [
            { label: '∈', latex: '\\in' }, { label: '∉', latex: '\\notin' }, { label: '⊂', latex: '\\subset' },
            { label: '⊆', latex: '\\subseteq' }, { label: '∪', latex: '\\cup' }, { label: '∩', latex: '\\cap' },
            { label: '∅', latex: '\\emptyset' }, { label: 'ℝ', latex: '\\mathbb{R}' }, { label: 'ℕ', latex: '\\mathbb{N}' },
            { label: 'ℤ', latex: '\\mathbb{Z}' }, { label: 'ℚ', latex: '\\mathbb{Q}' }, { label: 'ℂ', latex: '\\mathbb{C}' },
            { label: '∀', latex: '\\forall' }, { label: '∃', latex: '\\exists' }, { label: '¬', latex: '\\neg' },
            { label: '∧', latex: '\\land' }, { label: '∨', latex: '\\lor' }
        ]
    },
    {
        id: 'proba', title: 'Probabilités', items: [
            { label: 'P( )', latex: 'P\\left(#@\\right)', title: 'Probabilité' },
            { label: 'P(A|B)', latex: 'P\\left(#? \\mid #?\\right)', title: 'Probabilité conditionnelle' },
            { label: 'n!', latex: '#@!', title: 'Factorielle' },
            { label: '(n k)', latex: '\\binom{#?}{#?}', title: 'Combinaison' },
            { label: 'x̄', latex: '\\overline{x}', title: 'Moyenne' },
            { label: 'σ', latex: '\\sigma', title: 'Écart-type' }
        ]
    }
];
