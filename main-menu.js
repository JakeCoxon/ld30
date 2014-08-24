function MainMenu() {
    
}

MainMenu.prototype.create = function() {

    this.splashState = 0;

    function centerAnchor( sprite ) {
        sprite.anchor.set( 0.5, 0.5 );
        return sprite;
    }
    var ring = this.ring = centerAnchor( this.game.add.sprite( 800 / 2, 600 / 2, 'ring-large' ) );
    ring.anchor.set( 0.5, 0.5 );
    ring.width = 80;
    ring.height = 80;
    ring.kill();

    var line = this.line = this.game.add.sprite( 800 / 2, 600 / 2, 'line' );
    line.anchor.set( 0, 0.5 );
    line.width = 300;
    line.height = 3;
    line.alpha = 0;
    line.kill();

    var ship = this.game.add.sprite( 800 / 2 - 150 + 20, 600 / 2, 'ship0' );
    ship.anchor.set( 0.5, 0.6 );
    ship.rotation = Math.PI / 2;
    ship.kill();

    var mainPlanet = this.mainPlanet = centerAnchor( this.game.add.sprite( 800 / 2, 600 / 2, 'player0' ) );
    mainPlanet.inputEnabled = true;

    var secondPlanet = this.secondPlanet = centerAnchor( this.game.add.sprite( 800 / 2 + 300, 600 / 2, 'planet' ) );
    secondPlanet.inputEnabled = true;
    secondPlanet.kill();


    var play = centerAnchor( this.game.add.sprite( 800 / 2 + 2, 600 / 2, 'play' ) );


    var makeFloating = function( angle, dist, radius, speed ) {
        var planet = centerAnchor( this.game.add.sprite( 800 / 2, 600 / 2, 'planet' ) );
        planet.width = radius;
        planet.height = radius;
        planet.angle = angle;
        planet.dist = dist;
        planet.speed = speed;
        return planet;
    }.bind( this );


    this.floating = [
        makeFloating( Math.PI, 200, 60, 0.002 ),
        makeFloating( -3 * Math.PI / 2, 120, 40, 0.02 ),
        makeFloating( 4.21231, 270, 30, 0.008 ),
    ];



    var fill = this.game.add.sprite( 0, 0, 'solid' );
    fill.tint = 0x2B3E42;
    fill.width = 800;
    fill.height = 600;
    fill.kill();

    


    this.mainPlanet.events.onInputDown.add( function() {

        if ( this.splashState !== 0 ) return;
        this.splashState = 1;


        var easing = Phaser.Easing.Quartic.InOut;

        ring.alpha = 0.8;
        ring.revive();

        this.game.add.tween( ring ).to( {
            width: 120,
            height: 120,
            alpha: 0.5
        }, 500, easing, true );

        this.game.add.tween( mainPlanet ).to( {
            width: 80,
            height: 80
        }, 500, easing, true );

        this.game.time.events.add( 500, function() {


            this.game.add.tween( mainPlanet ).to( {
                x: 800/2 - 150,
            }, 1000, easing, true );


            secondPlanet.revive();
            secondPlanet.alpha = 0;
            this.game.add.tween( secondPlanet ).to( {
                alpha: 1
            }, 1000, easing, true );


            this.game.add.tween( play ).to( {
                alpha: 0,
                x: 800/2 - 150,
            }, 1000, easing, true );

            line.revive();
            this.game.add.tween( line ).to( {
                alpha: 1
            }, 1000, easing, true ); 

            this.game.add.tween( ring ).to( {
                x: 800/2 - 150,
                alpha: 0.5
            }, 1000, easing, true );

        }, this );


    }, this );

    this.secondPlanet.events.onInputDown.add( function() {

        ship.revive();

        this.game.add.tween( mainPlanet ).to( {
            x: 800 / 2 - 500,
        }, 1500, Phaser.Easing.Quartic.In, true );

        fill.revive();
        fill.alpha = 0;
        var tween = this.game.add.tween( fill ).to( {
            alpha: 1
        }, 200, Phaser.Easing.Linear.None, true, 1200 );

        this.game.time.events.add( 2000, function() {
            this.game.state.start('gameplay');
        }, this );

    }, this )

    window.game = this.game;
}


MainMenu.prototype.update = function() {
    _.forEach( this.floating, function( planet ) {

        planet.x = this.mainPlanet.x + Math.sin( planet.angle ) * planet.dist;
        planet.y = this.mainPlanet.y + Math.cos( planet.angle ) * planet.dist;


        planet.angle += planet.speed * ( this.splashState == 1 ? 0.1 : 1 );

    }, this );


    if ( this.splashState == 0 ) {
        this.mainPlanet.width = Math.lerp( Math.sin( this.game.time.now / 1000 ) * 0.5 + 0.5, 80, 100 );
        this.mainPlanet.height = this.mainPlanet.width;
    } else {
        this.secondPlanet.width = Math.lerp( Math.sin( this.game.time.now / 1000 ) * 0.5 + 0.5, 80, 100 );
        this.secondPlanet.height = this.secondPlanet.width;
    }

}

MainMenu.prototype.render = function() { 

    this.line.x = this.mainPlanet.x;
    this.ring.x = this.mainPlanet.x;
    this.secondPlanet.x = this.mainPlanet.x + 300;

}