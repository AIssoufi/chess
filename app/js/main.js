import consoleLog from './console-log.js';
import Plateau from './Plateau.js'
import PièceFactory from './PièceFactory.js';

class Main {
    constructor() {
        this.cases = [...document.querySelectorAll(".case")];
        this.plateau = new Plateau();
        this.factory = new PièceFactory();
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

                if (this.plateau.getCaseSelectionnee()) { // si une case est déjà selctionnée
                    if(c.hasChildNodes()) {
                        const childTo = this.plateau.getCaseSelectionnee().childNodes[0]
                        if(pièce.dataset.couleur == childTo.dataset.couleur) {
                            
                            this.plateau.selectionnerCase(c.dataset.position);
                            const configPièces = this.factory.getConfigPièces();
                            this.plateau.affihcerChemin(c.dataset.position, configPièces[pièce.dataset.type].mouvements);
                        } else {
                            this.plateau.capturer(c.dataset.position, this.plateau.getCaseSelectionnee().dataset.position);
                        }
                    } else {
                        this.plateau.deplacer(this.plateau.getCaseSelectionnee().dataset.position, c.dataset.position);
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