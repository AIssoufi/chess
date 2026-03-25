import cavalier from './pieces/cavalier.js';
import dame from './pieces/dame.js';
import tour from './pieces/tour.js';
import pion from './pieces/pion.js';
import roi from './pieces/roi.js';
import fou from './pieces/fou.js';

const CONFIGS = { cavalier, dame, fou, pion, roi, tour };

export default class PièceFactory {
  constructor() {
    this.compteur = 1;
  }

  créer({ type, couleur }) {
    const node = document.createElement('div');
    node.id = this.compteur++;
    node.textContent = CONFIGS[type].pièce[couleur];
    node.className = 'piece';
    node.dataset.type = type;
    node.dataset.couleur = couleur;
    return node;
  }

  getSymbole(type, couleur) {
    return CONFIGS[type].pièce[couleur];
  }
}
