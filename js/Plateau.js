import cavalier from './pieces/cavalier.js';
import dame from './pieces/dame.js';
import tour from './pieces/tour.js';
import pion from './pieces/pion.js';
import roi from './pieces/roi.js';
import fou from './pieces/fou.js';

export default class Plateau {

  placerNode(position, pièceNode) {
    const caseNode = this.getCaseNode(position);
    caseNode.appendChild(pièceNode);
  }

  getCaseNode(position) {
    return document.querySelector(`.case[data-position="${position}"]`);
  }

  getPièce(position) {
    const caseNode = this.getCaseNode(position);

    if (caseNode) {
        return caseNode.childNodes[0];
    }
  }

  getCouleur(position) {
    const pièce = this.getPièce(position);
    if (pièce) {
        return pièce.dataset.couleur;
    }
  }

  getCouleurJoueurCourant() {
      const div = document.querySelector(".joueur-courant");
      if (div) {
          return div.dataset.couleur;
      }
  }

  selectionnerCase(position) {
    const caseNode = this.getCaseNode(position);
    if(caseNode && caseNode.hasChildNodes()) {
        const pièce = this.getPièce(position);
        const couleurJoueurCourant = document.querySelector('.joueur-courant').dataset.couleur;

        if(couleurJoueurCourant == pièce.dataset.couleur) {
            this.deselectionnerCase();
            caseNode.classList.add('selectionner');
        } else {
            console.log("Sélection non autorisée");
        }
    }
  }

  deselectionnerCase() {
    const caseNode = this.getCaseSelectionnee();
    if(caseNode) {
        caseNode.classList.remove('selectionner');
        this.decolorerCase();
    }
  }

  getCaseSelectionnee() {
      return document.querySelector('.selectionner');
  }

  deplacer(from, to) {
    const toNode = this.getCaseNode(to);
    const fromNode = this.getCaseNode(from);

    if (!toNode.classList.contains("chemin") || !fromNode.hasChildNodes()) {
        console.log("Déplacement pas possible !");
    } else {
        toNode.appendChild(fromNode.childNodes[0]);
        console.log(`Déplacement ${from} vers ${to}`);
    }

    this.deselectionnerCase();
  }

  capturer(victimePos, remplacentPos) {
    const v = this.getCaseNode(victimePos);
    const r = this.getCaseNode(remplacentPos);

    if (!v.classList.contains("chemin")) {
        this.deselectionnerCase();
        console.log("Opération non possible !");
        return;
    } 

    document.querySelector(`.joueur-courant [id*="prisoniers"]`).appendChild(v.childNodes[0]);
    v.appendChild(r.childNodes[0]);
    console.log(`${remplacentPos} a capturé ${victimePos}`);
    this.deselectionnerCase();

    const nbPrisonier = document.querySelector(".joueur-courant [id*='nb-prisonier']");
    ++nbPrisonier.textContent;
  }

  /**
   * Colorer tous les déplacements possibles d'une pièce
   * @param {*} positionDeDepart Position de la pièce cible | Exemple: e3
   * @param {*} cheminPossible Tableau des trajectoirs (vecteur) possible
   */
  affihcerChemin(positionDeDepart, cheminPossible) {
    const caseSelectionee = this.getCaseSelectionnee();
    const caseCible = this.getCaseNode(positionDeDepart);

    if (caseCible != caseSelectionee) { return; }
    
    this.decolorerCase();

    let inverser = false;
    const pièce = this.getPièce(positionDeDepart);
    if (pièce) { inverser = this.getCouleurJoueurCourant() == "blanche"; }

    for(let uneDirection of cheminPossible) {
        const postions = this.getDeplacementsPossible(positionDeDepart, uneDirection, inverser);
        console.log(postions, uneDirection);
        for(let postion of postions) {
            this.colorerCase(postion);
        }
    }
  }

  /**
   * Cette fonction fournit les déplacements possible à partir d'une position de départ.
   * 
   * @param {string} positionDeDepart La position de départ | exemple: a5
   * @param {object} cheminPossible Un vecteur représentant une trajectoire | exemple: {type: 'vecteur', x: -8, y: -8}
   * @returns Retourne un tableau des positions possible | exemple: ["a1", "b2", "c3"]
   */
  getDeplacementsPossible(positionDeDepart, cheminPossible, inverser = false) {
    const positions = [];
    const lettres = [];
    const chiffres = [];
    switch(cheminPossible.type) {
        case "vecteur":
            // On determine les lettres
            if(cheminPossible.x) {
                // On avance sur l'alphabet. Exemple on passe de A vers B
                if (cheminPossible.x > 0) {
                    const lettreLegnth = positionDeDepart[0].charCodeAt() + cheminPossible.x;
                    for(let i = positionDeDepart[0].charCodeAt()+1; i <= lettreLegnth; i++ ) {
                        const l = String.fromCharCode(i);
                        lettres.push(l);
                    }
                // On recule sur l'alphabet. Exemple on passe  de B vers A
                } else if (cheminPossible.x < 0) {
                    const lettreLegnth = positionDeDepart[0].charCodeAt() + cheminPossible.x;
                    for(let i = positionDeDepart[0].charCodeAt()-1; i >= lettreLegnth  ; i-- ) {
                        const l = String.fromCharCode(i);
                        lettres.push(l);
                    }
                }
            } else {
                const length = Math.abs(cheminPossible.y);
                for(let i = 0; i < length; i++ ) {
                    lettres.push(positionDeDepart[0]);
                }
            }
    
            // On determine les nombres
            if(cheminPossible.y) {
                const nvxChemin = inverser ? -1 * cheminPossible.y : cheminPossible.y;
               
                // On avance sur l'alphabet. Exemple on passe de A vers B
                if (nvxChemin > 0) {
                    const chiffreLegnth = positionDeDepart[1]*1 + nvxChemin;
                    for(let i = positionDeDepart[1]*1 + 1; i <= chiffreLegnth; i++ ) {
                        chiffres.push(i);
                    }
                // On recule sur l'alphabet. Exemple on passe  de B vers A
                } else if (nvxChemin < 0) {
                    const chiffreLegnth = positionDeDepart[1]*1 + nvxChemin;
       
                    for(let i = positionDeDepart[1]*1-1; i >= chiffreLegnth; i-- ) {
                        chiffres.push(i);
                    }
                }
            } else {
                const length = Math.abs(cheminPossible.x);
                for(let i = 0; i < length; i++ ) {
                    chiffres.push(positionDeDepart[1]);
                }
            }
            break;
        case "point":
            lettres.push(String.fromCharCode((positionDeDepart[0].charCodeAt() + cheminPossible.x)));
            chiffres.push(positionDeDepart[1]*1 + cheminPossible.y);
         break;
    }


    // On forme les positions et on élimine les postions invalide.
    for(let i=0; i < lettres.length; i++) {
        const chiffre = chiffres[i];
        const lettre = lettres[i];

        // On élimine cette position si elle sort de l'échiquier.
        if (chiffre < 1 || chiffre > 8 || lettre < 'a' || lettre > 'h') { break; }

        if (cheminPossible.regPion) {
            if (positionDeDepart[1] == 7 && lettre != positionDeDepart[0]) {
                break;
            } else if (positionDeDepart[1] == 2 && lettre != positionDeDepart[0]) {
                break;
            }
        }

        const pos = `${lettre}${chiffre}`;
        const couleur = this.getCouleur(pos);
        
        // Si cette position à une pièce (donc une couleur) 
        if (couleur) {
            const couleurCourant = this.getCouleurJoueurCourant();
            // Et que cette couleur est la même que la couleur du joueur courant 
            // Alors on élimine cette couleur.
            if (couleur == couleurCourant) { break; }
            
            else { 
                // Sinon...
                positions.push(pos);
                break;
            }
        } else if(cheminPossible.regPion && cheminPossible.attaque) {
            break;
        } 

        positions.push(pos);
    }

    return positions;
  }

  getDeplacementPossible(positionDeDepart, cheminPossible, inverser = false) {
    let colonneChemin, ligneChemin;

    if (cheminPossible.haut != undefined) {
        ligneChemin = cheminPossible.haut;
    } else if (cheminPossible.bas != undefined) {
        ligneChemin = -1*cheminPossible.bas;
    }

    if (cheminPossible.droite != undefined) {
        colonneChemin = cheminPossible.droite;
    } else if (cheminPossible.gauche != undefined) {
        colonneChemin = -1*cheminPossible.gauche;
    }

    if (inverser) { ligneChemin = -1 * ligneChemin; }

    const lettre = String.fromCharCode(positionDeDepart[0].charCodeAt() + colonneChemin);
    const chiffre = positionDeDepart[1]*1 + ligneChemin;

    if(chiffre < 1 || chiffre > 8 || lettre < 'a' || lettre > 'h') {
        return "z0";
    }
    return `${lettre}${chiffre}`;
  }

  colorerCase(postion) {
    if (postion[1] < 1 || postion[1] > 8 || postion[0] < 'a' || postion[0] > 'h') { return; }

    const caseNode = this.getCaseNode(postion);
    caseNode.classList.add('chemin');
  }

  decolorerCase() {
    const tab = [...document.querySelectorAll('.chemin')];
    for( let caseColore of tab ) {
        caseColore.classList.remove('chemin');
    }
  }

}