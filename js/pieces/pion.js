const pion = {
  pièce: {
    type: 'pion',
    blanche: '&#9817;',
    noire: '&#9823;',
    quantitéIntiale: 8,
    positionInitiale: {
      blanche: ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
      noire: ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"]
    }
  },
  mouvements: [
    {type: 'vecteur', x: -1, y: -1, situation: 'CAPTURER'}, // peut capturer
    {type: 'vecteur', x: 1, y: -1, situation: 'CAPTURER'}, // peut capturer
    {type: 'vecteur', x: 0, y: -2, situation: 'PRMIER_MOUVEMENT'}, // peut se deplacer de deux cases
    {type: 'vecteur', x: 0, y: -1, situation: 'NORMAL'} // peut avancer d'une case à condition qu'il n'y ait pas de pion devant.
  ]
}

export default pion;