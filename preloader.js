function Preloader() {
    
}


Preloader.prototype.preload = function() {

    this.game.load.image('planet', 'assets/planet.png');
    this.game.load.image('player0', 'assets/player0.png');
    this.game.load.image('player1', 'assets/player1.png');
    this.game.load.image('ship0', 'assets/ship0.png');
    this.game.load.image('ship1', 'assets/ship1.png');
    this.game.load.image('line', 'assets/line.png');
    this.game.load.image('ring', 'assets/ring.png');
    this.game.load.image('ring-large', 'assets/ring-large.png');
    this.game.load.image('circle-large', 'assets/circle-large.png');
    this.game.load.image('egg', 'assets/egg.png');
    this.game.load.image('play', 'assets/play.png');
    this.game.load.image('solid', 'assets/solid.png');

    this.game.load.audio('galaxy', ['assets/galaxy.mp3']);
    
}

Preloader.prototype.create = function() {
    
    this.game.stage.backgroundColor = 0x2B3E42;

    this.game.state.start('main-menu');

    var music = this.game.add.audio('galaxy');
    music.loop = true;
    music.play('');
    window.music = music;

}