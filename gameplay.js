
function Gameplay() {

}



Gameplay.prototype.create = function() {

    this.gamePlaying = false;

    this.levelId = this.levelId || 0;

    var levelData = this.levelData = Levels[ this.levelId ];
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

        var planet = new Planet( this.game, planetPosition.x, planetPosition.y, this.planetsGroup );
        this.planetsGroup.add( planet );

        planet.anchor.setTo( 0.5, 0.5 );
        planet.planetId = i;

        planet.inputEnabled = true;
        planet.input.useHandCursor = true;

        planet.events.ownerChanged.add( this.planetOwnerChanged, this );
        
        this.planetGraph.addVertex( planet );

        return planet;

    }, this );

    this.detailPlanets = _.map( levelData.detailPlanets, function( planetPosition ) {

        var planet = new Phaser.Sprite( this.game, planetPosition.x, planetPosition.y, 'planet' );
        this.planetsGroup.add( planet );

        planet.anchor.set( 0.5, 0.5 );
        planet.width = planet.height = planetPosition.size;

        return planet;

    }, this );


    window.levelEdit = function() {
        var str = ""

        _.forEach( this.planetGraph.vertices, function( planet ) {

            planet.events.onInputDown.add( function() {
                console.log( this.planetId, Math.round( planet.x * 100 ) / 100, Math.round( planet.y * 100 ) / 100 );
            }, planet );

            planet.input.enableDrag();

            str += "{ x: " 
                 + Math.round( planet.x * 100 ) / 100 + ", y: "
                 + Math.round( planet.y * 100 ) / 100 + " },\n"

        } );

        console.log( str );

        _.forEach( this.detailPlanets, function( planet ) {

            planet.inputEnabled = true;
            planet.input.useHandCursor = true;

            planet.input.enableDrag();

            planet.events.onInputDown.add( function() {
                console.log( Math.round( planet.x * 100 ) / 100, Math.round( planet.y * 100 ) / 100 );
            }, planet );

        } );


    }.bind( this );

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

    this.ui.create();

    this.startGameplay();

}

Gameplay.prototype.startGameplay = function() {

    this.gamePlaying = true;

    _.forEach( this.ais, function( ai ) { ai.create() } );

    this.gameEvents.create( this.levelData.respawnRate );

};
Gameplay.prototype.stopGameplay = function() {

    this.gamePlaying = false;
    _.forEach( this.ais, function( ai ) { ai.stop() } );
}

Gameplay.prototype.paused = function() {
    this.ui.pausedSprite.revive();
    this.game.world.bringToTop( this.uiGroup );
    this.uiGroup.bringToTop( this.ui.pausedSprite );

}

Gameplay.prototype.resumed = function() {
    this.ui.pausedSprite.kill();
}

Gameplay.prototype.planetOwnerChanged = function() {
    if ( !this.gamePlaying ) return;

    var win = _.all( this.planetGraph.vertices, function( planet ) {
        return planet.ownerId === 0 || planet.ownerId === null;
    } );

    var lose = _.all( this.planetGraph.vertices, function( planet ) {
        return planet.ownerId !== 0;
    } );

    if ( win || lose ) {
        this.stopGameplay();

        this.ui.fill.alpha = 0;
        this.ui.fill.revive();
        this.game.world.bringToTop( this.uiGroup );
        this.uiGroup.bringToTop( this.ui.fill );

        this.game.add.tween( this.ui.fill ).to( {
            alpha: 1
        }, 1000, Phaser.Easing.Linear.None, true, 2000 );

        this.game.time.events.add( 3400, function() {
            this.game.state.states[ 'game-over' ].win = win;
            this.game.state.states[ 'game-over' ].levelId = this.levelId;
            this.game.state.start( 'game-over' );
        }, this );
    }
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


