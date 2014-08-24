
Math.lerp = function ( x, a, b ) {
    return a + x * ( b - a );
}
Math.approach = function( x, dist, inc ) {
    if ( dist < x ) return Math.max( x - Math.abs( inc ), dist );
    else return Math.min( x + Math.abs( inc ), dist );
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
        respawnRate: 4000
    };

    var planetGraph = new Graph();

    var edgesGroup, shipsGroup, planetsGroup, uiGroup;
    var pausedSprite;

    var gameEvents = new GameEvents( game );

    var ui = new UI( game, planetGraph, gameEvents );

    var ai = new AI( game, 1, planetGraph, gameEvents );


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
        game.load.image('egg', 'assets/egg.png');

        game.load.audio('galaxy', ['assets/galaxy.mp3']);

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


        game.scale.maxWidth = 1024;
        game.scale.maxHeight = 768;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        edgesGroup = game.add.group();
        shipsGroup = game.add.group();
        planetsGroup = game.add.group();
        uiGroup = game.add.group();

        pausedSprite = uiGroup.add( new Phaser.Sprite( game, 0, 0, "line" ) );
        pausedSprite.width = 800;
        pausedSprite.height = 600;
        pausedSprite.alpha = 0.6;

        pausedSprite.kill();

        game.onPause.add( function() {
            pausedSprite.revive();
            game.world.bringToTop( uiGroup );
            uiGroup.bringToTop( pausedSprite );
        } );
        game.onResume.add( function() {
            pausedSprite.kill();
        } );


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

        gameEvents.create( levelData.respawnRate );
        ui.create();
        ai.create();

        var music = game.add.audio('galaxy');
        music.loop = true;
        music.play('');
        window.music = music;

    }

    function update() {

        _.forEach( planetGraph.edges, function( edge ) {

            edge.update();

        } );
    }


    function GameEvents( game ) {
        this.game = game;

    }

    GameEvents.prototype.create = function( respawnRate ) {
        this.game.time.events.loop( respawnRate, this.spawnEggs, this );
    }

    GameEvents.prototype.spawnEggs = function() {

        _.forEach( planetGraph.vertices, function( planet ) {

            if ( planet.hasOwner() ) {
                planet.setEggs( planet.numEggs + 1 );
            }

        } );

    };

    GameEvents.prototype.sendShipFromPlanet = function ( planet, edge, attackStrength ) {
        attackStrength = Math.min( attackStrength, planet.numEggs );
        if ( attackStrength <= 0 ) return;

        var STRENGTH_PER_SHIP = 4;

        function sendShip( availableStrength ) {

            if ( availableStrength <= 0 ) return;

            this.game.time.events.add( 200, function() {

                var ship = getPooledShip( planet.ownerId );
                ship.attackStrength = Math.min( availableStrength, STRENGTH_PER_SHIP );

                edge.addShipFromPlanet( ship, planet );

                sendShip( availableStrength - ship.attackStrength );
            } );
        }

        sendShip( attackStrength );


        planet.setEggs( planet.numEggs - attackStrength );
    }



    



};