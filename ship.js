function Ship( game, x, y, ownerId, speed ) {
    Phaser.Sprite.call( this, game, x, y, 'ship' + ownerId );
    this.ownerId = ownerId;
    this.speed = speed;
    this.anchor.setTo( 0.5, 0.6 );
}

Ship.prototype = Object.create( Phaser.Sprite.prototype );
Ship.prototype.constructor = Ship;

Ship.prototype.setOwner = function( ownerId ) {
    this.loadTexture( 'ship' + ownerId );
    this.ownerId = ownerId;
}
