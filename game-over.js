function GameOver() {
    
}

GameOver.prototype.create = function() {

    var planet = this.planet = this.game.add.sprite( 800 / 2, 600 / 2, this.win ? 'player0' : 'player1' );
    planet.anchor.set( 0.5, 0.5 );
    planet.inputEnabled = true;

    var play = this.game.add.sprite( 800 / 2, 600 / 2, 'play' );
    play.anchor.set( 0.4, 0.5 );
    play.rotation = this.win ? 0 : Math.PI;

    this.game.input.onDown.add( function() {

        if ( this.win ) {
            this.game.state.states[ 'gameplay' ].levelId = this.levelId + 1;
        } else {
            this.game.state.states[ 'gameplay' ].levelId = this.levelId;
        }
        
        this.game.state.start( 'gameplay' );

    }, this );

}

