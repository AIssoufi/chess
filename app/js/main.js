
let cases = [...document.querySelectorAll(".case")];
let caseSelectionnee;

import cavalier from './pieces/cavalier.js';
import dame from './pieces/dame.js';
import tour from './pieces/tour.js';
import pion from './pieces/pion.js';
import roi from './pieces/roi.js';
import fou from './pieces/fou.js';

cases.forEach((piece) => {
     piece.addEventListener("click", function(event) {
        const uneCase = event.currentTarget;

        if (uneCase.hasChildNodes()) {
            selectionner(uneCase);
        } else {
            deplacer(caseSelectionnee, uneCase);
        }
     });
});

function deplacer(from, to) {
    if (!to.classList.contains("chemin")) {
        console.log("Déplacement pas possible !");
        return;
    }
    to.appendChild(from.childNodes[0]);
    selectionner(to);
}

function getEmplacement(uneCase) {
    const parent = uneCase.parentNode;
    const fils = uneCase.childNodes[0];

    return {
        colonne: uneCase.dataset.colonne,
        ligne: parent.dataset.ligne,
        inverserChemin: (fils.dataset.avancer == "vers-le-bas")
    }
}

function getTypeDePiece(uneCase) {
    return {
        type: uneCase.childNodes[0].classList[1]
    }
}

function selectionner(uneCase) {
    caseSelectionnee = uneCase;
    
    switch(getTypeDePiece(uneCase).type) {
        case "pion":
            affihcerChemin(getEmplacement(uneCase), pion);
            break;
        case "tour":
            affihcerChemin(getEmplacement(uneCase), tour);
            break;
        case "cavalier":
            affihcerChemin(getEmplacement(uneCase), cavalier);
            break;
        case "fou":
            affihcerChemin(getEmplacement(uneCase), fou);
            break;
        case "roi":
            affihcerChemin(getEmplacement(uneCase), roi);
            break;
        case "dame":
            affihcerChemin(getEmplacement(uneCase), dame);
            break;
        default:
            break;
    }

    caseSelectionnee.classList.add('selectionner');
}

function affihcerChemin(positionDeDepart, cheminPossible) {
    decolorerCase();
    for(let chemin of cheminPossible.directions) {
        colorerCase(getDeplacementPossible(positionDeDepart, chemin));
    }
}

function getDeplacementPossible(positionDeDepart, cheminPossible) {
    let colonneChemin, ligneChemin;

    if (cheminPossible.haut != undefined) {
        ligneChemin = +cheminPossible.haut;
    } else if (cheminPossible.bas != undefined) {
        ligneChemin = -cheminPossible.bas;
    }

    if (cheminPossible.droite != undefined) {
        colonneChemin = +cheminPossible.droite;
    } else if (cheminPossible.gauche != undefined) {
        colonneChemin = -cheminPossible.gauche;
    }

    if (positionDeDepart.inverserChemin) { ligneChemin = -1 * ligneChemin; }

    return {
        colonne: nombreVersLettre(lettreVersNombre(positionDeDepart.colonne) + colonneChemin),
        ligne: 1 * positionDeDepart.ligne + ligneChemin
    };
}

function lettreVersNombre(lettre) {
    const tab = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return tab.indexOf(lettre) + 1;
}

function nombreVersLettre(nombre) {
    if (nombre < 1) { return null; }
    const tab = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return tab[nombre-1];
}

function colorerCase(postion) {
    if (postion.ligne < 1 || postion.ligne > 8 || lettreVersNombre(postion.colonne) < 1 || lettreVersNombre(postion.colonne) > 8) {
        return;
    }

    const ligne = document.querySelector(`.row[data-ligne='${postion.ligne}']`);
    const uneCase = ligne.querySelector(`.case[data-colonne='${postion.colonne}']`);

    uneCase.classList.add('chemin');
}

function decolorerCase() {
    const tab = [...document.querySelectorAll('.chemin')];
    for( let caseColore of tab ) {
        caseColore.classList.remove('chemin');
    }

    const select = document.querySelector('.selectionner');
    if(select) {
        select.classList.remove('selectionner');
    }
}