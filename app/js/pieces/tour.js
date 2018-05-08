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
    { haut: 1, droite: 0 },
    { haut: 2, droite: 0 },
    { haut: 3, droite: 0 },
    { haut: 4, droite: 0 },
    { haut: 5, droite: 0 },
    { haut: 6, droite: 0 },
    { haut: 7, droite: 0 },
    { bas: 1, droite: 0 },
    { bas: 2, droite: 0 },
    { bas: 3, droite: 0 },
    { bas: 4, droite: 0 },
    { bas: 5, droite: 0 },
    { bas: 6, droite: 0 },
    { bas: 7, droite: 0 },
    { haut: 0, droite: 1 },
    { haut: 0, droite: 2 },
    { haut: 0, droite: 3 },
    { haut: 0, droite: 4 },
    { haut: 0, droite: 5 },
    { haut: 0, droite: 6 },
    { haut: 0, droite: 7 },
    { bas: 0, gauche: 1 },
    { bas: 0, gauche: 2 },
    { bas: 0, gauche: 3 },
    { bas: 0, gauche: 4 },
    { bas: 0, gauche: 5 },
    { bas: 0, gauche: 6 },
    { bas: 0, gauche: 7 }
  ]
}

export default tour;