const fou = {
  pièce: {
    type: 'fou',
    blanche: '&#9815;',
    noire: '&#9821;',
    quantitéIntiale: 2,
    positionInitiale: {
      blanche: ["c1", "f1"],
      noire: ["c8", "f8"]
    }
  },
  mouvements: [
    {type: 'vecteur', x: 7, y: 7},
    {type: 'vecteur', x: 7, y: -7},
    {type: 'vecteur', x: -7, y: -7},
    {type: 'vecteur', x: -7, y: 7}
  ]
}

export default fou;