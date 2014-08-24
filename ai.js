function AI( game, ownerId, planetGraph, sendShipFromPlanet ) {
    this.game = game;
    this.ownerId = ownerId;
    this.planetGraph = planetGraph;
    this.sendShipFromPlanet = sendShipFromPlanet;
}

AI.prototype.start = function() {
    // this.timer = new Phaser.Timer( this.game );
    this.game.time.events.add( 1000, function() {
        this.tick();
    }, this );
    // this.timer.start();
}

AI.prototype.tick = function() {
    var ownedPlanets = _.filter( this.planetGraph.vertices, function( planet ) {
        return planet.ownerId == this.ownerId; 
    }, this );

    var delay = 0;


    _.forEach( ownedPlanets, function( planet ) {
        var localNeighbours = this.planetGraph.getNeighbours( planet );

        var sendToPlanets = _.filter( localNeighbours, function( n ) { return n.ownerId != this.ownerId }, this )
        if ( sendToPlanets.length == 0 ) {
            sendToPlanets = localNeighbours
        }

        var attackStrength = Math.floor( planet.numEggs / sendToPlanets.length );
        if ( attackStrength > 0 ) {
            _.forEach( sendToPlanets, function( neighbour, i ) {
                
                this.game.time.events.add( delay, function() {

                    var edge = this.planetGraph.getJoiningEdge( planet, neighbour );

                    this.sendShipFromPlanet( planet, edge, attackStrength );
                }, this );

                delay += 200;
                
            }, this );


        }

    }, this );

    this.game.time.events.add( delay + 5000, this.tick, this );
}