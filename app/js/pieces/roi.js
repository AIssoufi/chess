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
    {type: 'vecteur', x: 1, y: 1},
    {type: 'vecteur', x: 1, Y: 0},
    {type: 'vecteur', x: 1, y: -1},
    {type: 'vecteur', x: 0, y: -1},
    {type: 'vecteur', x: -1, y: -1},
    {type: 'vecteur', x: -1, y: 0},
    {type: 'vecteur', x: -1, y: 1},
    {type: 'vecteur', x: 0, y: 1},
  ]
}

export default roi;