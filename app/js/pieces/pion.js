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
    { haut: 1, droite: 0 },
    { haut: 0, droite: 1 },
    { haut: 0, gauche: 1 }
  ]
}

export default pion;