import Echiquier from './Chessboard.js';
import PièceFactory from './PieceFactory.js';
import { COLORS } from './colors/constants.js';
import consoleLog from './console-log.js';
import { showCopyrightYear } from './copyright/show-copyright-year.js';
import {
  GAME_OUTCOMES,
  GAME_OVER_ALERTS,
  GAME_OVER_DIALOG_DELAY_MS,
} from './game-over/constants.js';
import { getGameOutcome } from './game-over/utils.js';

const jeu = new Echiquier();
const factory = new PièceFactory();

let positionSelectionnee = null;
let coupsPossibles = [];

// ─── Rendu DOM ──────────────────────────────────────────────────────────────

function rendreBoard() {
  document.querySelectorAll('.piece').forEach((p) => p.remove());
  for (const [position, piece] of jeu.plateau) {
    const caseNode = document.querySelector(`.case[data-position="${position}"]`);
    const pieceNode = factory.créer({ type: piece.type, couleur: piece.couleur });
    if (caseNode && pieceNode) caseNode.appendChild(pieceNode);
  }
}

function rendrePrisonniers() {
  for (const couleur of COLORS) {
    const zone = document.getElementById(`${couleur}-prisoniers`);
    const compteur = document.getElementById(`${couleur}-nb-prisonier`);
    zone.innerHTML = '';
    compteur.textContent = jeu.captures[couleur].length;
    for (const piece of jeu.captures[couleur]) {
      const pieceNode = factory.créer({ type: piece.type, couleur: piece.couleur });
      if (pieceNode) zone.appendChild(pieceNode);
    }
  }
}

function mettreAJourJoueurCourant() {
  document.querySelectorAll('.control').forEach((c) => c.classList.remove('joueur-courant'));
  document
    .querySelector(`.control[data-couleur="${jeu.couleurCourante}"]`)
    ?.classList.add('joueur-courant');
}

// ─── Sélection et mise en valeur ────────────────────────────────────────────

function deselectionner() {
  document.querySelectorAll('.chemin').forEach((c) => c.classList.remove('chemin'));
  document.querySelectorAll('.selectionner').forEach((c) => c.classList.remove('selectionner'));
  positionSelectionnee = null;
  coupsPossibles = [];
}

function selectionner(position) {
  deselectionner();
  const piece = jeu.getPièce(position);
  if (!piece || piece.couleur !== jeu.couleurCourante) return;

  const moves = jeu.getDeplacementsPossibles(position);
  if (moves.length === 0) return;

  positionSelectionnee = position;
  coupsPossibles = moves;
  document.querySelector(`.case[data-position="${position}"]`)?.classList.add('selectionner');
  for (const dest of moves) {
    document.querySelector(`.case[data-position="${dest}"]`)?.classList.add('chemin');
  }
}

// ─── Indicateur d'échec ─────────────────────────────────────────────────────

function marquerEchec(couleur) {
  effacerEchec();
  for (const [p, piece] of jeu.plateau) {
    if (piece.type === 'roi' && piece.couleur === couleur) {
      document.querySelector(`.case[data-position="${p}"]`)?.classList.add('echec');
      break;
    }
  }
}

function effacerEchec() {
  document.querySelectorAll('.case.echec').forEach((c) => c.classList.remove('echec'));
}

// ─── Après chaque coup ──────────────────────────────────────────────────────

function apresDeplacemement() {
  const { outcome, color, winner } = getGameOutcome({ game: jeu });
  if (outcome === GAME_OUTCOMES.checkmate) {
    jeu.termine = true;
    console.log(`Échec et mat ! ${winner} gagne.`);
    marquerEchec(color);
    document.querySelector('.couleur-joueur-gagnant').textContent = winner;
    setTimeout(() => afficherAlerte(GAME_OVER_ALERTS.checkmate), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.stalemate) {
    jeu.termine = true;
    console.log('Pat — match nul.');
    setTimeout(() => afficherAlerte(GAME_OVER_ALERTS.stalemate), GAME_OVER_DIALOG_DELAY_MS);
  } else if (outcome === GAME_OUTCOMES.check) {
    console.log(`${color} est en échec !`);
    marquerEchec(color);
  }
}

// ─── Promotion ──────────────────────────────────────────────────────────────

function afficherPromotion(position) {
  const piece = jeu.getPièce(position);
  const wrapper = document.querySelector('.promotion__wrapper');
  wrapper.querySelectorAll('[data-type]').forEach((btn) => {
    btn.textContent = factory.getSymbole(btn.dataset.type, piece.couleur);
  });
  wrapper.style.display = 'flex';
}

document.querySelector('.promotion__wrapper').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-type]');
  if (!btn || !jeu.positionPromotion) return;

  jeu.promouvoir(jeu.positionPromotion, btn.dataset.type);
  document.querySelector('.promotion__wrapper').style.display = 'none';
  rendreBoard();
  rendrePrisonniers();
  mettreAJourJoueurCourant();
  effacerEchec();
  apresDeplacemement();
});

// ─── Alertes ────────────────────────────────────────────────────────────────

const gameOverDialog = document.querySelector('.alert__wrapper');

function afficherAlerte(alertName) {
  const alertElement = gameOverDialog.querySelector(`.${alertName}`);
  alertElement.classList.add('afficher');
  gameOverDialog.setAttribute('aria-labelledby', alertElement.querySelector('h2').id);
  gameOverDialog.showModal();
  alertElement.querySelector('button').focus();
}

// "Rejouer" and Escape both close the dialog: either way a new game starts, so the finished
// game never stays on screen without a way to play again.
gameOverDialog.addEventListener('close', () => {
  gameOverDialog.querySelectorAll('.afficher').forEach((a) => a.classList.remove('afficher'));
  initialiser();
});

// ─── Gestionnaire de clics (délégation sur le plateau) ──────────────────────

document.querySelector('.container-piece').addEventListener('click', (event) => {
  if (jeu.termine || jeu.positionPromotion) return;

  const caseNode = event.target.closest('.case');
  if (!caseNode) return;

  const position = caseNode.dataset.position;
  const piece = jeu.getPièce(position);

  if (positionSelectionnee) {
    if (coupsPossibles.includes(position)) {
      // Exécuter le coup
      const result = jeu.deplacer(positionSelectionnee, position);
      if (!result) return;

      rendreBoard();
      rendrePrisonniers();
      deselectionner();
      effacerEchec();

      const log = result.coupSpécial
        ? `${result.from} → ${result.to} (${result.coupSpécial})`
        : `${result.from} → ${result.to}`;
      console.log(log);

      if (result.promotion) {
        afficherPromotion(result.to);
        return;
      }

      mettreAJourJoueurCourant();
      apresDeplacemement();
    } else if (piece && piece.couleur === jeu.couleurCourante) {
      // Resélectionner une autre pièce alliée
      selectionner(position);
    } else {
      deselectionner();
    }
  } else if (piece && piece.couleur === jeu.couleurCourante) {
    selectionner(position);
  }
});

// ─── Initialisation ──────────────────────────────────────────────────────────

function initialiser() {
  jeu.initialiser();
  rendreBoard();
  rendrePrisonniers();
  deselectionner();
  effacerEchec();
  mettreAJourJoueurCourant();
}

consoleLog();
showCopyrightYear();
initialiser();
