/**
 * Le plateau permet de réaliser tous les mouvements
 * possibles (déplacement, capture, etc)
 */
export default class Plateau {
  /**
   * Colorer tous les déplacements possibles d'une pièce
   * @param {String} positionOrigine Position de la pièce | Exemple: e3
   * @param {Array} tabCheminPossible Tableau des trajectoirs (vecteur) possible
   */
  affihcerChemin(positionOrigine, tabCheminPossible) {
    const caseSelectioneeNode = this.getCaseSelectionneeNode();
    const caseCibleNode       = this.getCaseNode(positionOrigine);

    if (caseCibleNode != caseSelectioneeNode) { return; }
    
    this.decolorerCase();

    let inverser = false;
    const pièce  = this.getPièceNode(positionOrigine);
    if (pièce) { inverser = this.getCouleurJoueurCourant() == "blanche"; }

    for(let uneDirection of tabCheminPossible) {
        const postions = this.getDeplacementsPossible(positionOrigine, uneDirection, inverser);
        for(let postion of postions) {
            this.colorerCase(postion);
        }
    }
  }
  /**
   * Capturer une pièce
   * @param {String} positionVictime La position de la victime | Exemple: a1
   * @param {String} positionOppresseur La position de l'oppresseur | Exemple: a1
   */
  capturer(positionVictime, positionOppresseur) {
    const victimeNode    = this.getCaseNode(positionVictime);
    const oppresseurNode = this.getCaseNode(positionOppresseur);

    if (!victimeNode.classList.contains("chemin")) {
        this.deselectionnerCase();
        console.log("Opération non possible !");
        return;
    } 

    document.querySelector(`.joueur-courant [id*="prisoniers"]`).appendChild(victimeNode.childNodes[0]);
    victimeNode.appendChild(oppresseurNode.childNodes[0]);
    console.log(`${positionOppresseur} a capturé ${positionVictime}`);
    this.deselectionnerCase();

    const nbPrisonier = document.querySelector(".joueur-courant [id*='nb-prisonier']");
    ++nbPrisonier.textContent;
  }

  /**
   * Colorer une seul case
   * @param {object} postion  La position de la case | Exemple: a1
   */
  colorerCase(postion) {
    if (postion[1] < 1 || postion[1] > 8 || postion[0] < 'a' || postion[0] > 'h') { return; }

    const caseNode = this.getCaseNode(postion);
    if (caseNode) { caseNode.classList.add('chemin'); }
  }

  /**
   *  Décolore toutes les cases qui sont colorées.
   */
  decolorerCase() {
    const casesColorees = [...document.querySelectorAll('.chemin')];
    for( let caseColoree of casesColorees ) { caseColoree.classList.remove('chemin'); }
  }

  /**
   *  Déplacer une pièce vers une autre case
   * @param {String} positionOrigine Position d'originne
   * @param {String} postionDestination Position de destination
   */
  deplacer(positionOrigine, postionDestination) {
    const destinationNode = this.getCaseNode(postionDestination);
    const origineNode = this.getCaseNode(positionOrigine);

    if (!destinationNode.classList.contains("chemin") || !origineNode.hasChildNodes()) {
        console.log("Déplacement pas possible !");
    } else {
        destinationNode.appendChild(origineNode.childNodes[0]);
        console.log(`Déplacement ${positionOrigine} vers ${postionDestination}`);
    }
    this.deselectionnerCase();
  }
  /**
   * Désélectionner la case sélectionnée
   */
  deselectionnerCase() {
    const caseNode = this.getCaseSelectionneeNode();
    if(caseNode) {
        caseNode.classList.remove('selectionner');
        this.decolorerCase();
    }
  }
  /**
   * Obtenir le Node de la case ciblé
   * @param {String} position La position de la case ciblé | Exemple: a1
   * @returns {Node} Retourne le Node de la case ciblé
   */
  getCaseNode(position) { return document.querySelector(`.case[data-position="${position}"]`); }

  /**
   * Obtenir la case (Node) actuellement sélectionnée
   * @returns {Node} Retourne le Node de la case actuellement sélectionnée
   */
  getCaseSelectionneeNode() { return document.querySelector('.selectionner'); }

  /**
   * Obtenir le couleur de la pièce ciblé
   * @param {String} position La position de la pièce ciblé | Exemple: a1
   * @returns {String} Retourne la couleur de la pièce ciblé 
   */
  getCouleur(position) {
    const pièce = this.getPièceNode(position);
    if (pièce) { return pièce.dataset.couleur; }
  }

  getCouleurCaseSelectionnee() {
    return this.getCouleur(this.getPositionSelectionnee());
  }

  /**
   * Obtenir la couleur du joueur courant
   * @returns {String} Retourne la couleur du joueur courant
   */
  getCouleurJoueurCourant() {
    const div = document.querySelector(".joueur-courant");
    if (div) { return div.dataset.couleur; }
  }

  /**
   * Cette fonction fournit les déplacements possible à partir d'une position de départ.
   * @param {string} positionOrigine La position de départ | exemple: a5
   * @param {object} tabCheminPossible Un vecteur représentant une trajectoire | exemple: {type: 'vecteur', x: -8, y: -8}
   * @returns {String[]} Retourne un tableau des positions possible | exemple: ["a1", "b2", "c3"]
   */
  getDeplacementsPossible(positionOrigine, tabCheminPossible, inverser = false) {
    const positions = [];
    const lettres = [];
    const chiffres = [];
    switch(tabCheminPossible.type) {
        case "vecteur":
            // On determine les lettres
            if(tabCheminPossible.x) {
                // On avance sur l'alphabet. Exemple on passe de A vers B
                if (tabCheminPossible.x > 0) {
                    const lettreLegnth = positionOrigine[0].charCodeAt() + tabCheminPossible.x;
                    for(let i = positionOrigine[0].charCodeAt()+1; i <= lettreLegnth; i++ ) {
                        const l = String.fromCharCode(i);
                        lettres.push(l);
                    }
                // On recule sur l'alphabet. Exemple on passe  de B vers A
                } else if (tabCheminPossible.x < 0) {
                    const lettreLegnth = positionOrigine[0].charCodeAt() + tabCheminPossible.x;
                    for(let i = positionOrigine[0].charCodeAt()-1; i >= lettreLegnth  ; i-- ) {
                        const l = String.fromCharCode(i);
                        lettres.push(l);
                    }
                }
            } else {
                const length = Math.abs(tabCheminPossible.y);
                for(let i = 0; i < length; i++ ) {
                    lettres.push(positionOrigine[0]);
                }
            }
    
            // On determine les nombres
            if(tabCheminPossible.y) {
                const nvxChemin = inverser ? -1 * tabCheminPossible.y : tabCheminPossible.y;
               
                // On incéremnte le nombre.
                if (nvxChemin > 0) {
                    const chiffreLegnth = positionOrigine[1]*1 + nvxChemin;
                    for(let i = positionOrigine[1]*1 + 1; i <= chiffreLegnth; i++ ) {
                        chiffres.push(i);
                    }
                // On décréremnte le nombre.
                } else if (nvxChemin < 0) {
                    const chiffreLegnth = positionOrigine[1]*1 + nvxChemin;
       
                    for(let i = positionOrigine[1]*1-1; i >= chiffreLegnth; i-- ) { 
                        chiffres.push(i);
                    }
                }
            } else {
                const length = Math.abs(tabCheminPossible.x);
                for(let i = 0; i < length; i++ ) {
                    chiffres.push(positionOrigine[1]);
                }
            }
            break;
        case "point":
            lettres.push(String.fromCharCode((positionOrigine[0].charCodeAt() + tabCheminPossible.x)));
            chiffres.push(positionOrigine[1]*1 + tabCheminPossible.y);
         break;
    }

    // On forme les positions et on élimine les postions invalide.
    for(let i=0; i < lettres.length; i++) {
        const chiffre = chiffres[i];
        const lettre  = lettres[i];

        // On élimine cette position si elle sort de l'échiquier.
        if (chiffre < 1 || chiffre > 8 || lettre < 'a' || lettre > 'h') { break; }

        const pos          = `${lettre}${chiffre}`;
        const couleurCible = this.getCouleur(pos);

        if (tabCheminPossible.situation) {
            const couleur = this.getCouleur(positionOrigine);
            switch(tabCheminPossible.situation) {
                case 'PRMIER_MOUVEMENT':
                    if (couleur == "noire" && positionOrigine[1] == 7) { break; } // peut se deplacer de deux 
                    if (couleur == "blanche" && positionOrigine[1] == 2) { break; } // peut se deplacer de deux 
                    continue; //  NE peut PAS se deplacer de deux 
                case 'CAPTURER':
                    if (couleurCible && couleur != couleurCible) { break; }  // peut capturer
                    continue; // NE peut PAS capturer
                case 'NORMAL':
                    if (!couleurCible) { break; } // peut avancer d'une case à condition qu'il n'y ait pas de pion devant.
                    continue; // NE peut PAS avancer CAR il y a un pion devant.
            }
        }
        
        // Si cette position à une pièce (donc une couleur) 
        if (couleurCible) {
            const couleurCourant = this.getCouleurJoueurCourant();
            // Et que cette couleur est la même que la couleur du joueur courant 
            // Alors on élimine cette couleur.
            if (couleurCible == couleurCourant) { break; }
            
            else { 
                // Sinon...
                positions.push(pos);
                break;
            }
        } else if(tabCheminPossible.regPion && tabCheminPossible.attaque) { break; } 
        positions.push(pos);
    }

    return positions;
  }
  /**
   * Obtenir le Node de la pièce ciblé
   * @param {String} position La position de la pièce ciblé | Exemple: a1
   * @returns {Node} Retourn le Node de la pièce ciblé
   */
  getPièceNode(position) {
    const caseNode = this.getCaseNode(position);
    if (caseNode) { return caseNode.childNodes[0]; }
  }

  /**
   * Obtenir la position actuellement sélectionnée
   * @returns {Qtring} Retourne la position de la case actuellement sélectionnée
   */
  getPositionSelectionnee() { return this.getCaseSelectionneeNode().dataset.position; }

  /**
   * Placer une pièce (un Node) sur case (position)
   * @param {String} position Position receptrice de la pièce | Exemple: a1
   * @param {Node} pièceNode Élement Node à placer
   */
  placerNode(position, pièceNode) {
    const caseNode = this.getCaseNode(position);
    caseNode ? caseNode.appendChild(pièceNode) : console.log('err: Placement impossible');
  }

  /**
   * Sélectionner une case
   * @param {String} position La position de la case ciblé | Exemple: a1
   */
  selectionnerCase(position) {
    const caseNode = this.getCaseNode(position);
    if(caseNode && caseNode.hasChildNodes()) {
        const pièce = this.getPièceNode(position);
        const couleurJoueurCourant = document.querySelector('.joueur-courant').dataset.couleur;

        if(couleurJoueurCourant == pièce.dataset.couleur) {
            this.deselectionnerCase();
            caseNode.classList.add('selectionner');
        } else { 
          console.log("Sélection non autorisée");
        }
    }
  }
}