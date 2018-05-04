
let cases = [...document.querySelectorAll(".case")];
let caseSelectionnee;

cases.forEach((piece) => {
     piece.addEventListener("click", function(event) {
        const uneCase = event.currentTarget;

        if(uneCase.hasChildNodes()) {
            selectionner(uneCase);
        } else {
            deplacer(caseSelectionnee, uneCase);
            selectionner(uneCase);
        }


     });
});

function deplacer(from, to) {
    to.appendChild(from.childNodes[0]);
}

function selectionner(uneCase) {
    caseSelectionnee = uneCase;
}