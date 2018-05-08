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

  selectionnerCase(position) {
    const caseNode = this.getCaseNode(position);
    if(caseNode) {
        this.deselectionnerCase();
        caseNode.classList.add('selectionner');
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
    }

    this.deselectionnerCase();
  }

  capturer(victimePos, remplacentPos) {
    const v = this.getCaseNode(victimePos);
    const r = this.getCaseNode(remplacentPos);
    document.querySelector('#noire-prisonier').appendChild(v.childNodes[0]);
    v.appendChild(r.childNodes[0]);
    this.deselectionnerCase();
  }

  affihcerChemin(positionDeDepart, cheminPossible) {
    this.decolorerCase();

    let inverser = false;
    const pièce = this.getPièce(positionDeDepart);

    if (pièce) { inverser = pièce.dataset.couleur == "noire"; }

    for(let chemin of cheminPossible) {
        this.colorerCase(this.getDeplacementPossible(positionDeDepart, chemin, inverser));
    }
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