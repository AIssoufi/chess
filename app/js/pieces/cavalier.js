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
    { haut: 2, gauche: 1 },
    { haut: 2, droite: 1 },
    { bas: 2, gauche: 1 },
    { bas: 2, droite: 1 },
    { gauche: 2, haut: 1 },
    { gauche: 2, bas: 1 },
    { droite: 2, haut: 1 },
    { droite: 2, bas: 1 }
  ]
}

export default cavalier;