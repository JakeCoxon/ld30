function AI( game, ownerId, planetGraph, gameEvents ) {
    this.game = game;
    this.ownerId = ownerId;
    this.planetGraph = planetGraph;
    this.gameEvents = gameEvents;
    this.delayRamp = 1000;
    this.playing = true;
}

AI.prototype.create = function() {
    // this.timer = new Phaser.Timer( this.game );
    this.game.time.events.add( 1000, function() {
        this.tick();
    }, this );
    // this.timer.start();
}

AI.prototype.stop = function() {
    this.playing = false;
}

AI.prototype.tick = function() {
    if ( !this.playing ) return;

    
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

        var attackStrength = Math.floor( planet.numEggs * 0.8 / sendToPlanets.length );
        if ( attackStrength > 0 ) {
            _.forEach( sendToPlanets, function( neighbour, i ) {
                
                this.game.time.events.add( delay, function() {

                    var edge = this.planetGraph.getJoiningEdge( planet, neighbour );

                    this.gameEvents.sendShipFromPlanet( planet, edge, attackStrength );
                }, this );

                delay += this.delayRamp + Math.random() * 100;
                this.delayRamp = Math.approach( this.delayRamp, 200, 100 );
                
            }, this );


        }

    }, this );

    this.game.time.events.add( delay + 5000, this.tick, this );
}