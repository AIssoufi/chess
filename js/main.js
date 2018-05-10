import consoleLog from './console-log.js';
import Plateau from './Plateau.js'
import PièceFactory from './PièceFactory.js';

/**
 * Alterne le statut de joueur courant entre les deux joueurs.
 */
const changerDeJoueur = () => {
    const ctr = document.querySelectorAll(".control");
    ctr.forEach(c => { c.classList.toggle("joueur-courant"); });
};

/**
 * Place les pièces à leur position initiale.
 * @param {Plateau} plateau Le plateau du jeu
 * @param {PièceFactory} factory La factory des pièce
 */
const placerLesPièces = (plateau, factory) => {
    const configPièces = factory.getPiècesConfigArray();
    for(const config of configPièces) {
        ["blanche", "noire"].forEach(couleur => {
            for(let i = 0; i < config.pièce.quantitéIntiale; i++) {
                const position  = config.pièce.positionInitiale[couleur][i];
                const pièceNode = factory.créer({
                    type: config.pièce.type, 
                    couleur: couleur
                });
                plateau.placerNode(position, pièceNode);
            }
        });
    }
};

/**
 * Grosso-modo, cette méthode attache une logique de gestion des sélections à chaque case. 
 * Je sais, ce n'est pas beau à voir ;D
 * @param {*} plateau 
 * @param {*} factory 
 */
const abonnerLesCases = (plateau, factory) => {
    [...document.querySelectorAll(".case")].forEach(uneCase => {
        uneCase.addEventListener('click', event => {
            const c            = event.currentTarget;
            const positionCase = c.dataset.position;
            const pièce        = plateau.getPièceNode(positionCase);
            const configPièces = factory.getConfigPièces();

            if (plateau.getCaseSelectionneeNode()) { // si une case est déjà selctionnée
                if(c.hasChildNodes()) {
                    const typePièce               = pièce.dataset.type;
                    const couleurPièceSelectionee = plateau.getCouleurCaseSelectionnee();
                    const couleurCase             = plateau.getCouleur(positionCase);

                    if (couleurCase == couleurPièceSelectionee) {
                        plateau.selectionnerCase(positionCase);
                        plateau.affihcerChemin(positionCase, configPièces[typePièce].mouvements);
                    } else {
                        plateau.capturer(positionCase, plateau.getPositionSelectionnee());
                        changerDeJoueur();
                    }
                } else {
                    plateau.deplacer(plateau.getPositionSelectionnee(), positionCase);
                    changerDeJoueur();
                }
            } else if(pièce) { // si une case n'est pas selctionnée
                const typePièce = pièce.dataset.type;
                plateau.selectionnerCase(positionCase);
                plateau.affihcerChemin(positionCase, configPièces[typePièce].mouvements);
            }
        });
    });
}
/**
 * Initialise le jeu
 * @param {Plateau} plateau Le plateau du jeu
 * @param {PièceFactory} factory La factory des pièce
 */
const initialiser = (plateau, factory) => {
    placerLesPièces(plateau, factory);
    abonnerLesCases(plateau, factory);
}

class Main {
    constructor() {
        this.plateau = new Plateau();
        this.factory = new PièceFactory();
    }

    start() {
        initialiser(this.plateau, this.factory);
        consoleLog();
    }
}

const main = new Main();
main.start();