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
    { haut: 1, droite: 1 },
    { haut: 2, droite: 2 },
    { haut: 3, droite: 3 },
    { haut: 4, droite: 4 },
    { haut: 5, droite: 5 },
    { haut: 6, droite: 6 },
    { haut: 7, droite: 7 },
    { haut: 1, gauche: 1 },
    { haut: 2, gauche: 2 },
    { haut: 3, gauche: 3 },
    { haut: 4, gauche: 4 },
    { haut: 5, gauche: 5 },
    { haut: 6, gauche: 6 },
    { haut: 7, gauche: 7 },
    { bas: 1, droite: 1 },
    { bas: 2, droite: 2 },
    { bas: 3, droite: 3 },
    { bas: 4, droite: 4 },
    { bas: 5, droite: 5 },
    { bas: 6, droite: 6 },
    { bas: 7, droite: 7 },
    { bas: 1, gauche: 1 },
    { bas: 2, gauche: 2 },
    { bas: 3, gauche: 3 },
    { bas: 4, gauche: 4 },
    { bas: 5, gauche: 5 },
    { bas: 6, gauche: 6 },
    { bas: 7, gauche: 7 }
  ]
}

export default fou;