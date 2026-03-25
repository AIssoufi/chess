# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install    # Installer les dépendances (Vite + Vitest)
pnpm start      # Serveur de développement avec HMR (Vite sur app/)
pnpm test       # Tests unitaires Vitest (sans DOM)
pnpm build      # Build de production → dist/
pnpm deploy     # Build + déploiement GitHub Pages
```

## Architecture

Jeu d'échecs en JavaScript vanilla — aucun framework. Le plateau est géré par un **modèle interne** (pas le DOM).

### Flux global

```
index.html → main.js (contrôleur UI)
                ├── Echiquier.js  (modèle — état, règles, validation)
                └── PièceFactory.js (création des noeuds DOM)
```

### Modules clés

**`app/js/Echiquier.js`** — modèle pur, zero DOM. État du plateau en `Map<string, {type, couleur, aBouge}>` (clé = notation algébrique `"e4"`). Méthodes principales :

- `initialiser()` — remet le plateau à l'état initial
- `getDeplacementsPossibles(pos)` — coups légaux (filtrés si le roi reste en échec)
- `deplacer(from, to)` — exécute un coup, retourne `{from, to, piece, capturé, coupSpécial, promotion}`
- `promouvoir(pos, type)` — finalise une promotion en attente
- `estEnEchec(couleur)` / `estEchecEtMat(couleur)` / `estPat(couleur)`

**`app/js/main.js`** — contrôleur UI. Un seul listener sur `.container-piece` (délégation). Après chaque coup : re-rendu complet du DOM depuis le modèle (`rendreBoard()`). Gère la promotion (modal), l'indicateur d'échec (classe `.echec`), les alertes fin de partie/pat.

**`app/js/PièceFactory.js`** — crée les nœuds DOM à partir de `{type, couleur}`. Utilise les symboles Unicode des configs pièces.

**`app/js/pieces/*.js`** — configs légères (symbole Unicode + positions initiales). Le mouvement est géré dans `Echiquier.js`, pas dans ces fichiers.

### Génération des coups dans Echiquier.js

- `_coupsRaw(pos, piece, pourAttaque)` — coups bruts par type :
  - Pièces glissantes (tour/fou/dame/roi) : `_coupsSliding()` avec directions et max pas
  - Cavalier : 8 sauts fixes
  - Pion : avance (1 ou 2), capture diagonale, en passant
- `_laisseRoiEnEchec(from, to)` — simule un coup en modifiant/restaurant la Map, vérifie si le roi est en échec
- Roque ajouté dans `getDeplacementsPossibles` si conditions remplies (ni roi ni tour n'ont bougé, cases non attaquées, cases libres)

> **Attention** : `_aucunCoupPossible()` utilise un snapshot `[...this.plateau.entries()]` avant d'itérer. Sans ça, `_laisseRoiEnEchec` déplace les clés en fin de Map lors de la restauration, ce qui crée une boucle infinie.

### Règles spéciales implémentées

| Règle                  | Où                                                  |
| ---------------------- | --------------------------------------------------- |
| Roque (petit et grand) | `getDeplacementsPossibles` + `deplacer`             |
| En passant             | `_coupsRaw` (pion) + `deplacer`                     |
| Promotion              | `deplacer` (détection) + `promouvoir()` (exécution) |
| Échec / mat / pat      | `estEnEchec` / `estEchecEtMat` / `estPat`           |
| Clouage (pin)          | filtrage via `_laisseRoiEnEchec`                    |

### Conventions du code

- Nommage en **français** (plateau, pièce, couleur, cavalier, dame, roi, tour, fou, pion)
- `couleur` vaut `'blanche'` ou `'noire'`
- Positions en notation algébrique minuscule : `'a1'`–`'h8'`
- Direction des pions : `dir = couleur === 'blanche' ? 1 : -1` (rangées croissantes pour les blancs)
