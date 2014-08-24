
function Gameplay() {

}

var levelData = {
    positions: [
        { x: 148.13420958071947, y: 463.00298454239964 },
        { x: 548.0702181458473, y: 400.50939767062664 },
        { x: 399.276088565588, y: 286.9718343168497 },
        { x: 661.5447843521833, y: 104.6057182662189 },
        { x: 280.08115224540234, y: 151.6812285091728 } 
    ],
    edges: [ [0, 2], [1, 2], [2, 3], [2, 4], [0, 1], [4, 3] ],
    playerStart0: 0,
    playerStart1: 3,
    respawnRate: 4000,
    starting: { 0: [0, 5], 3: [1, 5] }
};

Gameplay.prototype.create = function() {

    var planetGraph = this.planetGraph = new Graph();

    this.gameEvents = new GameEvents( this.game, this );

    this.ui = new UI( this.game, this );

    this.ais = [
        new AI( this.game, 1, this.planetGraph, this.gameEvents )
    ];

    this.game.stage.backgroundColor = 0x2B3E42;

    this.edgesGroup = this.game.add.group();
    this.shipsGroup = this.game.add.group();
    this.planetsGroup = this.game.add.group();
    this.uiGroup = this.game.add.group();


    window.planets = _.map( levelData.positions, function( planetPosition, i ) {

        var planet = new Planet( this.game, planetPosition.x, planetPosition.y );
        this.planetsGroup.add( planet );

        planet.anchor.setTo( 0.5, 0.5 );
        planet.planetId = i;

        planet.inputEnabled = true;
        planet.input.useHandCursor = true;
        
        // planet.input.enableDrag();

        this.planetGraph.addVertex( planet );

        return planet;

    }, this );

    _.forEach( levelData.starting, function( tuple, planetId ) {

        this.planetGraph.vertices[ planetId ].setOwner( tuple[ 0 ] );
        this.planetGraph.vertices[ planetId ].setEggs( tuple[ 1 ] );

    }, this );


    window.edges = _.map( levelData.edges, function( edgeDef ) {

        var planet0 = this.planetGraph.vertices[ edgeDef[ 0 ] ];
        var planet1 = this.planetGraph.vertices[ edgeDef[ 1 ] ];

        var edge = new Edge( this.game, planet0, planet1 );
        this.edgesGroup.add( edge );

        this.planetGraph.addEdge( edge, [ planet0, planet1 ] );

        return edge;

    }, this );

    this.gameEvents.create( levelData.respawnRate );
    this.ui.create();
    
    _.forEach( this.ais, function( ai ) { ai.create() } );

    var music = this.game.add.audio('galaxy');
    music.loop = true;
    music.play('');
    window.music = music;

}

Gameplay.prototype.getPooledShip = function( ownerId ) {
    var ship = this.shipsGroup.getFirstDead();
    if ( !ship ) {
        ship = new Ship( this.game, 0, 0, ownerId, 100 );
        this.shipsGroup.add( ship );
    }
    ship.setOwner( ownerId );
    ship.revive();
    return ship;
}

Gameplay.prototype.update = function() {

    _.forEach( this.planetGraph.edges, function( edge ) {

        edge.update();

    } );
}


function GameEvents( game, gameplay ) {
    this.game = game;
    this.gameplay = gameplay;

}

GameEvents.prototype.create = function( respawnRate ) {
    this.game.time.events.loop( respawnRate, this.spawnEggs, this );
}

GameEvents.prototype.spawnEggs = function() {

    _.forEach( this.gameplay.planetGraph.vertices, function( planet ) {

        if ( planet.hasOwner() ) {
            planet.setEggs( planet.numEggs + 1 );
        }

    } );

};

GameEvents.prototype.sendShipFromPlanet = function ( planet, edge, attackStrength ) {
    attackStrength = Math.min( attackStrength, planet.numEggs );
    if ( attackStrength <= 0 ) return;

    var STRENGTH_PER_SHIP = 4;

    var sendShip = function( availableStrength ) {

        if ( availableStrength <= 0 ) return;

        this.game.time.events.add( 200, function() {

            var ship = this.gameplay.getPooledShip( planet.ownerId );
            ship.attackStrength = Math.min( availableStrength, STRENGTH_PER_SHIP );

            edge.addShipFromPlanet( ship, planet );

            sendShip( availableStrength - ship.attackStrength );
        }, this );
    }.bind( this );

    sendShip( attackStrength );


    planet.setEggs( planet.numEggs - attackStrength );
}


