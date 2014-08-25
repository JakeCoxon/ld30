function GameOver() {
    
}

GameOver.prototype.create = function() {

    var ring = this.ring = this.game.add.sprite( 800 / 2, 600 / 2, 'ring-large' );
    ring.anchor.set( 0.5, 0.5 );
    ring.width = 80;
    ring.height = 80;
    ring.kill();

    var planet = this.planet = this.game.add.sprite( 800 / 2, 600 / 2, this.win ? 'player0' : 'player1' );
    planet.anchor.set( 0.5, 0.5 );
    planet.inputEnabled = true;
    planet.input.useHandCursor = true;

    var play = this.game.add.sprite( 800 / 2, 600 / 2, 'play' );
    play.anchor.set( 0.4, 0.5 );
    play.rotation = this.win ? 0 : Math.PI;


    var fill = this.game.add.sprite( 0, 0, 'solid' );
    fill.tint = 0x2B3E42;
    fill.alpha = 1;
    fill.width = 800;
    fill.height = 600;

    this.game.add.tween( fill ).to( {
        alpha: 0
    }, 500, Phaser.Easing.Linear.None, true );

    this.game.input.onDown.add( function() {

        ring.revive();
        this.game.add.tween( ring ).to( {
            width: 200,
            height: 200,
            alpha: 0
        }, 500, Phaser.Easing.Cubic.Out, true );

        this.game.add.tween( planet ).to( {
            width: 100,
            height: 100,
            alpha: 0
        }, 500, Phaser.Easing.Cubic.Out, true );

        if ( this.win && this.levelId >= Levels.length - 1 ) {
            fill.revive();

            this.game.add.tween( fill ).to( {
                alpha: 1
            }, 2000, Phaser.Easing.Linear.None, true );

            this.game.time.events.add( 3000, function() {
                this.game.state.start( 'main-menu' );
            }, this );

            return;
        }

        fill.revive();

        this.game.add.tween( fill ).to( {
            alpha: 1
        }, 800, Phaser.Easing.Linear.None, true );

        this.game.time.events.add( 1200, function() {

            if ( this.win ) {
                this.game.state.states[ 'gameplay' ].levelId = this.levelId + 1;
            } else {
                this.game.state.states[ 'gameplay' ].levelId = this.levelId;
            }

            this.game.state.start( 'gameplay' );

        }, this );


    }, this );

}

