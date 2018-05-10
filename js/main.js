import consoleLog from './console-log.js';
import Plateau from './Plateau.js'
import PièceFactory from './PièceFactory.js';

class Main {
    constructor() {
        this.cases = [...document.querySelectorAll(".case")];
        this.plateau = new Plateau();
        this.factory = new PièceFactory();
        this.changerDeJoueur = () => {
            const ctr = document.querySelectorAll(".control");
            ctr.forEach(c => { c.classList.toggle("joueur-courant"); });
        }
    }

    initialiser() {
        const configPièces = this.factory.getPiècesConfigArray();
        for(const config of configPièces) {
            ["blanche", "noire"].forEach(couleur => {
                for(let i = 0; i < config.pièce.quantitéIntiale; i++) {
                    const pièceNode = this.factory.créer({
                        type: config.pièce.type, 
                        couleur: couleur
                    });

                    const position = config.pièce.positionInitiale[couleur][i];
                    const uneCase = this.plateau.getCaseNode(position);

                    this.plateau.placerNode(position, pièceNode);
                }
            });
        }

        this.cases.forEach(uneCase => {
            uneCase.addEventListener('click', event => {
                const c = event.currentTarget;
                const pièce = c.childNodes[0];

                if (this.plateau.getCaseSelectionneeNode()) { // si une case est déjà selctionnée
                    if(c.hasChildNodes()) {
                        const childTo = this.plateau.getCaseSelectionneeNode().childNodes[0]
                        if(pièce.dataset.couleur == childTo.dataset.couleur) {
                            
                            this.plateau.selectionnerCase(c.dataset.position);
                            const configPièces = this.factory.getConfigPièces();
                            this.plateau.affihcerChemin(c.dataset.position, configPièces[pièce.dataset.type].mouvements);
                        } else {
                            this.plateau.capturer(c.dataset.position, this.plateau.getCaseSelectionneeNode().dataset.position);
                            this.changerDeJoueur();
                        }
                    } else {
                        this.plateau.deplacer(this.plateau.getCaseSelectionneeNode().dataset.position, c.dataset.position);
                        this.changerDeJoueur();
                    }
                } else { // si une case n'est pas selctionnée
                    this.plateau.selectionnerCase(c.dataset.position);
                    const configPièces = this.factory.getConfigPièces();
                    this.plateau.affihcerChemin(c.dataset.position, configPièces[pièce.dataset.type].mouvements);
                }
            });
        });
    }

    start() {
        this.initialiser();
        consoleLog();
    }
}

const main = new Main();
main.start();