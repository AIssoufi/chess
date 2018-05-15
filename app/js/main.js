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
 * 
 * @param {*} couleurGagnat 
 * @param {*} plateau 
 * @param {*} factory 
 */
const echecEtMat = (couleurGagnat, plateau, factory) => {
    document.querySelector('.couleur-joueur-gagnant').textContent = couleurGagnat;

    afficherAlerte('fin-de-partie', event => {
        supprimerAlerte();
        initialiser(plateau, factory);
    });
}

/**
 * Affciher une alerte
 * @param {*} nom Nom de l'alerte à affciher
 * @param {*} boutonClickHandle Le gestionnaire de l'event click du bouton
 */
function afficherAlerte(nom, boutonClickHandle) {
    const wrapper = document.querySelector('.alert__wrapper');
    const bg      = document.querySelector('.main__wrapper');
    const alert   = wrapper.querySelector(`.${nom}`);

    wrapper.style.display = "block";
    bg.classList.add("alert__background");
    alert.classList.add("afficher");

    if (boutonClickHandle) {
        const bouton = alert.querySelector('button');
        bouton.addEventListener('click', boutonClickHandle);
    }
}

/**
 * Supprimer
 */
function supprimerAlerte() {
    const wrapper = document.querySelector('.alert__wrapper');
    const bg      = document.querySelector('.main__wrapper');
    const alert   = wrapper.querySelector(".afficher");

    wrapper.style.display = "none";
    bg.classList.remove("alert__background");
    alert && alert.classList.remove("afficher");
}

/**
 * Place les pièces à leur position initiale.
 * @param {Plateau} plateau Le plateau du jeu
 * @param {PièceFactory} factory La factory des pièce
 */
const placerLesPièces = (plateau, factory) => {
    [...document.querySelectorAll('.piece')].forEach(pièce => {
        pièce.remove();
    });
    [...document.querySelectorAll("[id*='nb-prisonier']")].forEach(counter => {
        counter.textContent = 0;
    });

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
                        switch(typePièce) {
                            case 'roi':
                                echecEtMat(couleurPièceSelectionee, plateau, factory);
                                break;
                            default:
                                changerDeJoueur();
                        }
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

        afficherAlerte('debut-de-partie', event => {
            supprimerAlerte();
        });
    }
}

const main = new Main();
main.start();