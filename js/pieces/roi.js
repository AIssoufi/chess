const roi = {
  pièce: {
    type: 'roi',
    blanche: '&#9812;',
    noire: '&#9818;',
    quantitéIntiale: 1,
    positionInitiale: {
      blanche: ["e1"],
      noire: ["e8"]
    }
  },
  mouvements: [
    { haut: 1, droite: 1 },
    { haut: 1, gauche: 1 },
    { bas: 1, droite: 1 },
    { bas: 1, gauche: 1 },
    { haut: 1, droite: 0 },
    { bas: 1, droite: 0 },
    { haut: 0, droite: 1 },
    { bas: 0, gauche: 1 },
  ]
}

export default roi;