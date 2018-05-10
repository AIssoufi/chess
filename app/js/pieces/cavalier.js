const cavalier = {
  pièce: {
    type: 'cavalier',
    blanche: '&#9816;',
    noire: '&#9822;',
    quantitéIntiale: 2,
    positionInitiale: {
      blanche: ["b1", "g1"],
      noire: ["b8", "g8"]
    }
  },
  mouvements: [
    {type: 'point', x: 1, y: 2},
    {type: 'point', x: -1, y: 2},
    {type: 'point', x: 2, y: 1},
    {type: 'point', x: 2, y: -1},
    {type: 'point', x: -2, y: 1},
    {type: 'point', x: -2, y: -1},
    {type: 'point', x: 1, y: -2},
    {type: 'point', x: -1, y: -2},
  ]
}

export default cavalier;