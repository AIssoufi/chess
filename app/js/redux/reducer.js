const initialState = {
  joueurCourant: 'noire',
  joueurs: [
    {
      joueur: "noire",
      score: 0
    },
    {
      joueur: "noire",
      score: 0
    }
  ],
  estTerminé: false,
  estEnCours: false
}
const reducer = (state = initialState, action) => {

  switch(action.type) {
    case 'INITIALISER':
      break;
    case 'DEPLACER':
      break;
    case 'SELECTIONNER':
      break;
    case 'TRACER_DEPLACEMENT_POSSIBLE':
      break;
    default:
      return state;
  }
}