
Math.lerp = function ( x, a, b ) {
    return a + x * ( b - a );
}
Math.approach = function( x, dist, inc ) {
    if ( dist < x ) return Math.max( x - Math.abs( inc ), dist );
    else return Math.min( x + Math.abs( inc ), dist );
}

window.onload = function() {

    var game = new Phaser.Game( 800, 600, Phaser.AUTO, '', {
        create: function() {

            game.state.add( 'preloader', Preloader );
            game.state.add( 'main-menu', MainMenu );
            game.state.add( 'gameplay', Gameplay );
            game.state.add( 'game-over', GameOver );

            game.state.start( 'preloader' );
        }
    } );


    window.game = game;


};