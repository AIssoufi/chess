const dame = {
  pièce: {
    type: 'dame',
    blanche: '&#9813;',
    noire: '&#9819;',
    quantitéIntiale: 1,
    positionInitiale: {
      blanche: ["d1"],
      // noire: ["d4"]
      noire: ["d8"]
    }
  },
  mouvements: [
    {type: 'vecteur', x: 7, y: 7},
    {type: 'vecteur', x: 7, Y: 0},
    {type: 'vecteur', x: 7, y: -7},
    {type: 'vecteur', x: 0, y: -7},
    {type: 'vecteur', x: -7, y: -7},
    {type: 'vecteur', x: -7, y: 0},
    {type: 'vecteur', x: -7, y: 7},
    {type: 'vecteur', x: 0, y: 7},
  ]
}

export default dame;