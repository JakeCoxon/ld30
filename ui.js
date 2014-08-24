
function UI( game, gameplay ) {
    this.game = game;
    this.gameplay = gameplay;
    this.planetGraph = gameplay.planetGraph;
    this.gameEvents = gameplay.gameEvents;
    // this.clickTimer = new Phaser.Timer( game );

    this.drag = false;
    this.dragDist2 = 0;
}

UI.prototype.create = function() {

    this.setupPauseMenu();

    this.ring = this.game.add.sprite( 0, 0, 'ring-large' );
    this.ring.anchor.set( 0.5, 0.5 );
    this.ring.kill();
    this.circle = this.game.add.sprite( 0, 0, 'circle-large' );
    this.circle.anchor.set( 0.5, 0.5 );
    this.circle.kill();
    this.game.world.sendToBack( this.circle );


    this.planetGraph.vertices.forEach( function( planet ) {
        planet.events.onInputDown.add( this.onInputDown.bind( this, planet ) );
    }, this );

    this.planetGraph.vertices.forEach( function( planet ) {
        planet.events.onInputUp.add( this.onInputUp.bind( this, planet ) );
    }, this );

    this.game.input.moveCallback = this.moveCallback.bind( this );

};

UI.prototype.setupPauseMenu = function() { 

    var pausedSprite = this.gameplay.uiGroup.add( new Phaser.Sprite( this.game, 0, 0, 'solid' ) );
    pausedSprite.width = 800;
    pausedSprite.height = 600;
    pausedSprite.tint = 0x02B3E42;
    pausedSprite.alpha = 0.6;

    pausedSprite.kill();

    this.game.onPause.add( function() {
        pausedSprite.revive();
        this.game.world.bringToTop( this.gameplay.uiGroup );
        this.gameplay.uiGroup.bringToTop( pausedSprite );
    }, this );

    this.game.onResume.add( function() {
        pausedSprite.kill();
    }, this );

}



UI.prototype.moveCallback = function( pointer, x, y ) {

    if ( !this.selectedPlanet || !this.drag ) return;

    var dx = x - this.selectedPlanet.x;
    var dy = y - this.selectedPlanet.y;

    this.dragDist2 = dx * dx + dy * dy;

    var dist = Math.sqrt( this.dragDist2 );
    var radius = this.selectedPlanet.width / 2;
    if ( dist > radius ) {

        var percentage = this.percentage = Math.min( ( dist - radius ) / ( 80 - radius ), 1 );

        var MAX_RING_WIDTH = 150;

        this.ring.x = this.selectedPlanet.x;
        this.ring.y = this.selectedPlanet.y;
        this.ring.alpha = Math.lerp( percentage, 0.2, 0.5 );
        this.ring.width = Math.lerp( percentage, 120, MAX_RING_WIDTH );
        this.ring.height = this.ring.width;

        this.ring.revive();


        this.circle.alpha = 0.2;
        this.circle.x = this.ring.x;
        this.circle.y = this.ring.y;

        this.circle.width = Math.lerp( percentage, radius * 2, MAX_RING_WIDTH );
        this.circle.height = this.circle.width;
        this.circle.revive();


    }

}

UI.prototype.onInputDown = function( planet ) {
    // this.clickTimer.start();

    if ( this.selectedPlanet ) {
        this.onSelectSecondPlanet( planet );
    }
    else if ( planet.ownerId === 0 ) {
        this.selectedPlanet = planet;
        this.drag = true;

    }

}
UI.prototype.onInputUp = function() {

    if ( !this.selectedPlanet || !this.drag ) return;

    this.drag = false;

    if ( this.dragDist2 <= Math.pow( this.selectedPlanet.width/2, 2 ) ) {
        var DEFAULT_RING_WIDTH = 120;

        this.ring.x = this.selectedPlanet.x;
        this.ring.y = this.selectedPlanet.y;
        this.ring.alpha = 0.5;
        this.ring.width = DEFAULT_RING_WIDTH;
        this.ring.height = DEFAULT_RING_WIDTH;
        this.ring.revive();

        this.percentage = 0.5;

        // console.log( this.selectedPlanet );
        // this.onSelectPlanet( this.selectedPlanet );

    }
    this.game.add.tween( this.circle )
        .to( { alpha: 0 }, 200, Phaser.Easing.Cubic.InOut, true );

}


UI.prototype.onSelectSecondPlanet = function( planet ) {
    if ( this.selectedPlanet == planet ) {
        this.selectedPlanet = null;
        this.hideRing();
        return;
    }

    if ( this.selectedPlanet.numEggs == 0 ) {
        return;
    }

    var attackStrength = Math.ceil( this.selectedPlanet.numEggs * this.percentage );

    
    var edge = this.planetGraph.getJoiningEdge( this.selectedPlanet, planet );
    if ( !edge ) {
        return;
    }

    this.gameEvents.sendShipFromPlanet( this.selectedPlanet, edge, attackStrength );

    this.selectedPlanet = null;

    this.hideRing();
}

UI.prototype.hideRing = function() {
    

    this.game.add.tween( this.circle )
        .to( { alpha: 0, width: 80, height: 80 }, 200, Phaser.Easing.Cubic.InOut, true );

    var tween = this.game.add.tween( this.ring )
        .to( { alpha: 0, width: 80, height: 80 }, 200, Phaser.Easing.Cubic.InOut, true );

    tween.onComplete.add( function() {
        this.ring.kill();
    }, this );


    this.dragDist2 = 0;

}