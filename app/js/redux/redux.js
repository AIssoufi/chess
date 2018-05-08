const createStore = reducer => {
  let état;
  let abonnées = [];

  const getState = () => this.état;

  const disptach = action => {
    this.état = reducer(this.état, action);
    this.abonnées.forEach(abonnée => {
      abonnée();      
    });
  };

  const subscribe = listener => {
    this.abonnées.push(listener);

    return () => {
      this.abonnées = this.abonnées.filter( l => {
        if( l != listener) { return l; }
      });
    }
  }
};