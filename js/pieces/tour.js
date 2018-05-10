const tour = {
  pièce: {
    type: 'tour',
    blanche: '&#9814;',
    noire: '&#9820;',
    quantitéIntiale: 2,
    positionInitiale: {
      blanche: ["a1", "h1"],
      noire: ["a8", "h8"]
    }
  },
  mouvements: [
    {type: 'vecteur', x: 7, Y: 0},
    {type: 'vecteur', x: 0, y: -7},
    {type: 'vecteur', x: -7, y: 0},
    {type: 'vecteur', x: 0, y: 7}
  ]
}

export default tour;