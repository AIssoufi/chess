import cavalier from './pieces/cavalier.js';
import dame from './pieces/dame.js';
import tour from './pieces/tour.js';
import pion from './pieces/pion.js';
import roi from './pieces/roi.js';
import fou from './pieces/fou.js';

export default class PièceFactory {
  constructor() {
    this.compteur = 1;
  }

  créer({type, couleur}) {
    const pièces = this.getConfigPièces();
    const pièceNode = document.createElement('div');

    pièceNode.id = this.compteur++;
    pièceNode.innerHTML = pièces[type].pièce[couleur];
    pièceNode.className = 'piece';
    pièceNode.dataset.type = type;
    pièceNode.dataset.couleur = couleur;

    return pièceNode;
  }

  getConfigPièces() {
    return { cavalier, dame, fou, pion, roi, tour }
  }

  getPiècesConfigArray() {
    return [cavalier, dame, fou, pion, roi, tour ]
  }
}