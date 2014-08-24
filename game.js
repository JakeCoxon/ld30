
function lerp( x, a, b ) {
    return a + x * ( b - a );
}

window.onload = function() {

    var game = new Phaser.Game( 800, 600, Phaser.AUTO, '', 
        { preload: preload, create: create, update: update } );

    window.game = game;

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
    };

    var planetGraph = new Graph();

    var edgesGroup, shipsGroup, planetsGroup;
    var ai = new AI( game, 1, planetGraph, sendShipFromPlanet );


    function preload() {

        game.load.image('planet', 'assets/planet.png');
        game.load.image('player0', 'assets/player0.png');
        game.load.image('player1', 'assets/player1.png');
        game.load.image('ship0', 'assets/ship0.png');
        game.load.image('ship1', 'assets/ship1.png');
        game.load.image('line', 'assets/line.png');
        game.load.image('ring', 'assets/ring.png');
        game.load.image('ring-large', 'assets/ring-large.png');
        game.load.image('circle-large', 'assets/circle-large.png');

    }

    function getPooledShip( ownerId ) {
        var ship = shipsGroup.getFirstDead();
        if ( !ship ) {
            ship = new Ship( game, 0, 0, ownerId, 100 );
            shipsGroup.add( ship );
        }
        ship.setOwner( ownerId );
        ship.revive();
        return ship;
    }

    function create() {

        game.stage.backgroundColor = 0x2B3E42;

        edgesGroup = game.add.group();
        shipsGroup = game.add.group();
        planetsGroup = game.add.group();


        window.planets = _.map( levelData.positions, function( planetPosition, i ) {

            var planet = new Planet( game, planetPosition.x, planetPosition.y );
            planetsGroup.add( planet );

            planet.anchor.setTo( 0.5, 0.5 );
            planet.planetId = i;

            planet.inputEnabled = true;
            planet.input.useHandCursor = true;
            
            // planet.input.enableDrag();

            planetGraph.addVertex( planet );

            return planet;

        } );

        planetGraph.vertices[ levelData.playerStart0 ].setOwner( 0 );
        planetGraph.vertices[ levelData.playerStart0 ].setEggs( 5 );
        planetGraph.vertices[ levelData.playerStart1 ].setOwner( 1 );
        planetGraph.vertices[ levelData.playerStart1 ].setEggs( 5 );




        window.edges = _.map( levelData.edges, function( edgeDef ) {

            var planet0 = planetGraph.vertices[ edgeDef[ 0 ] ];
            var planet1 = planetGraph.vertices[ edgeDef[ 1 ] ];

            var edge = new Edge( game, planet0, planet1 );
            edgesGroup.add( edge );

            planetGraph.addEdge( edge, [ planet0, planet1 ] );

            return edge;

        } );

        gameEvents.create();

        ai.start();


    }

    function update() {

        _.forEach( planetGraph.edges, function( edge ) {

            edge.update();

        } );
    }

    function sendShipFromPlanet( planet, edge, attackStrength ) {
        attackStrength = Math.min( attackStrength, planet.numEggs );
        if ( attackStrength <= 0 ) return;

        var ship = getPooledShip( planet.ownerId );
        ship.attackStrength = attackStrength;
        edge.addShipFromPlanet( ship, planet );
        planet.setEggs( planet.numEggs - attackStrength );
    }

    function GameEvents( game ) {
        this.game = game;
        this.selectedPlanet = null;

        this.timer = new Phaser.Timer( game );
        this.clickTimer = new Phaser.Timer( game );

        this.drag = false;
        this.dragDist2 = 0;


    }

    GameEvents.prototype.create = function() {

        this.ring = game.add.sprite( 0, 0, 'ring-large' );
        this.ring.anchor.set( 0.5, 0.5 );
        this.ring.kill();
        this.circle = game.add.sprite( 0, 0, 'circle-large' );
        this.circle.anchor.set( 0.5, 0.5 );
        this.circle.kill();
        this.game.world.sendToBack( this.circle );


        planetGraph.vertices.forEach( function( planet ) {
            planet.events.onInputDown.add( this.onInputDown.bind( this, planet ) );
        }, this );

        planetGraph.vertices.forEach( function( planet ) {
            planet.events.onInputUp.add( this.onInputUp.bind( this, planet ) );
        }, this );

        game.input.moveCallback = this.moveCallback.bind( this );

        this.game.time.events.loop( 4000, this.spawnEggs, this );
    };

    var RING_WIDTH = 150;


    GameEvents.prototype.moveCallback = function( pointer, x, y ) {

        if ( !this.selectedPlanet || !this.drag ) return;

        var dx = x - this.selectedPlanet.x;
        var dy = y - this.selectedPlanet.y;

        this.dragDist2 = dx * dx + dy * dy;

        var dist = Math.sqrt( this.dragDist2 );
        var radius = this.selectedPlanet.width / 2;
        if ( dist > radius ) {

            var percentage = this.percentage = Math.min( ( dist - radius ) / ( 80 - radius ), 1 );


            this.ring.x = this.selectedPlanet.x;
            this.ring.y = this.selectedPlanet.y;
            this.ring.alpha = lerp( percentage, 0.2, 0.5 );
            this.ring.width = lerp( percentage, 120, RING_WIDTH );
            this.ring.height = this.ring.width;

            this.ring.revive();


            this.circle.alpha = 0.2;
            this.circle.x = this.ring.x;
            this.circle.y = this.ring.y;

            this.circle.width = lerp( percentage, radius * 2, RING_WIDTH );
            this.circle.height = this.circle.width;
            this.circle.revive();


        }

    }

    GameEvents.prototype.onInputDown = function( planet ) {
        // this.clickTimer.start();

        if ( this.selectedPlanet ) {
            this.onSelectSecondPlanet( planet );
        }
        else if ( planet.ownerId !== null ) {
            this.selectedPlanet = planet;
            this.drag = true;

        }

    }
    GameEvents.prototype.onInputUp = function() {

        if ( !this.selectedPlanet || !this.drag ) return;

        this.drag = false;

        if ( this.dragDist2 <= Math.pow( this.selectedPlanet.width/2, 2 ) ) {
            this.ring.x = this.selectedPlanet.x;
            this.ring.y = this.selectedPlanet.y;
            this.ring.alpha = 0.5;
            this.ring.width = RING_WIDTH;
            this.ring.height = RING_WIDTH;
            this.ring.revive();

            this.percentage = 1;

            console.log( this.selectedPlanet );
            // this.onSelectPlanet( this.selectedPlanet );

        }
        this.game.add.tween( this.circle )
            .to( { alpha: 0 }, 200, Phaser.Easing.Cubic.InOut, true );

    }

    GameEvents.prototype.spawnEggs = function() {

        _.forEach( planetGraph.vertices, function( planet ) {

            if ( planet.hasOwner() ) {
                planet.setEggs( planet.numEggs + 1 );
            }

        } );

    };

    GameEvents.prototype.onSelectSecondPlanet = function( planet ) {
        if ( this.selectedPlanet == planet ) {
            this.selectedPlanet = null;
            this.hideRing();
            return;
        }

        if ( this.selectedPlanet.numEggs == 0 ) {
            return;
        }

        var attackStrength = Math.ceil( this.selectedPlanet.numEggs * this.percentage );

        
        var edge = planetGraph.getJoiningEdge( this.selectedPlanet, planet );
        if ( !edge ) {
            return;
        }

        sendShipFromPlanet( this.selectedPlanet, edge, attackStrength );

        this.selectedPlanet = null;

        this.hideRing();
    }

    GameEvents.prototype.hideRing = function() {
        

        this.game.add.tween( this.circle )
            .to( { alpha: 0, width: 80, height: 80 }, 200, Phaser.Easing.Cubic.InOut, true );

        var tween = this.game.add.tween( this.ring )
            .to( { alpha: 0, width: 80, height: 80 }, 200, Phaser.Easing.Cubic.InOut, true );

        tween.onComplete.add( function() {
            this.ring.kill();
        }, this );


        this.dragDist2 = 0;

    }

    var gameEvents = new GameEvents( game );


};