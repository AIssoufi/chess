var assert = require('assert');
var jsdom = require('mocha-jsdom');

import PièceFactory from '../app/js/PièceFactory.js';

describe("ÉTANT DONNÉE qu'on veut vérifier la création de pièce", function() {
  describe("QUAND on demande la création d'un pion", function() {
    const factory = new PièceFactory();
    const pièceNode = factory.créer("PION", "blanche");

    it('ALORS, il faut que le PION soit créée sans erreur', function(){
        assert.notEqual(pièceNode, undefined);
    });
    it('ALORS, il faut que le type de la pièce soit PION', function(){
      
    });
    it('ALORS, il faut que la pièce ai une couleur', function(){
      
    });
  });
});