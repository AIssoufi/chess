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
    {type: 'vecteur', x: 0, y: -2, regPion: true, premier: true},
    {type: 'vecteur', x: 0, y: -1},
    {type: 'vecteur', x: -1, y: -1, regPion: true, attaque: true},
    {type: 'vecteur', x: 1, y: -1, regPion: true, attaque: true},
  ]
}

export default pion;