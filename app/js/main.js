import Echiquier from './Echiquier.js';
import PièceFactory from './PièceFactory.js';
import consoleLog from './console-log.js';

const jeu = new Echiquier();
const factory = new PièceFactory();

let positionSelectionnee = null;
let coupsPossibles = [];

// ─── Rendu DOM ──────────────────────────────────────────────────────────────

function rendreBoard() {
  document.querySelectorAll('.piece').forEach((p) => p.remove());
  for (const [position, piece] of jeu.plateau) {
    const caseNode = document.querySelector(`.case[data-position="${position}"]`);
    if (caseNode) caseNode.appendChild(factory.créer({ type: piece.type, couleur: piece.couleur }));
  }
}

function rendrePrisonniers() {
  for (const couleur of ['blanche', 'noire']) {
    const zone = document.getElementById(`${couleur}-prisoniers`);
    const compteur = document.getElementById(`${couleur}-nb-prisonier`);
    zone.innerHTML = '';
    compteur.textContent = jeu.captures[couleur].length;
    for (const piece of jeu.captures[couleur]) {
      zone.appendChild(factory.créer({ type: piece.type, couleur: piece.couleur }));
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
  const couleur = jeu.couleurCourante;
  if (jeu.estEchecEtMat(couleur)) {
    jeu.termine = true;
    const gagnant = couleur === 'blanche' ? 'noire' : 'blanche';
    console.log(`Échec et mat ! ${gagnant} gagne.`);
    setTimeout(() => {
      document.querySelector('.couleur-joueur-gagnant').textContent = gagnant;
      afficherAlerte('fin-de-partie', () => initialiser());
    }, 200);
  } else if (jeu.estPat(couleur)) {
    jeu.termine = true;
    console.log('Pat — match nul.');
    setTimeout(() => afficherAlerte('pat', () => initialiser()), 200);
  } else if (jeu.estEnEchec(couleur)) {
    console.log(`${couleur} est en échec !`);
    marquerEchec(couleur);
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

function afficherAlerte(nom, callback) {
  const wrapper = document.querySelector('.alert__wrapper');
  const alerte = wrapper.querySelector(`.${nom}`);
  wrapper.style.display = 'block';
  document.querySelector('.main__wrapper').classList.add('alert__background');
  alerte.classList.add('afficher');
  if (callback) {
    const btn = alerte.querySelector('button');
    const handler = () => {
      btn.removeEventListener('click', handler);
      supprimerAlerte();
      callback();
    };
    btn.addEventListener('click', handler);
  }
}

function supprimerAlerte() {
  const wrapper = document.querySelector('.alert__wrapper');
  wrapper.style.display = 'none';
  document.querySelector('.main__wrapper').classList.remove('alert__background');
  wrapper.querySelectorAll('.afficher').forEach((a) => a.classList.remove('afficher'));
}

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
initialiser();
