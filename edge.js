function Edge( game, planet0, planet1 ) {
    Phaser.Sprite.call( this, game, planet0.x, planet0.y, 'line' );

    this.anchor.setTo( 0, 0.5 );

    var dy = planet1.y - planet0.y;
    var dx = planet1.x - planet0.x;

    this.planet0 = planet0;
    this.planet1 = planet1;

    this.rotation = Math.atan2( dy, dx );
    this.width = Math.sqrt( dx * dx + dy * dy );
    this.height = 3;

    this.distance = this.width - planet0.width / 2 - planet1.width / 2;

    this.sourceShips = [];
    this.targetShips = [];

    this.unitX = dx / this.width;
    this.unitY = dy / this.width;

}

Edge.prototype = Object.create( Phaser.Sprite.prototype );
Edge.prototype.constructor = Edge;


Edge.prototype.addShipFromPlanet = function( ship, planet ) {
    if ( planet == this.planet0 ) {
        this.sourceShips.push( ship );
        ship.rotation = this.rotation + Math.PI/2;
        ship.unitX = this.unitX;
        ship.unitY = this.unitY;
        ship.sourcePlanet = this.planet0;
        ship.targetPlanet = this.planet1;
    } else {
        this.targetShips.push( ship );
        ship.rotation = this.rotation - Math.PI/2;
        ship.isReverse = true;
        ship.unitX = -this.unitX;
        ship.unitY = -this.unitY;
        ship.sourcePlanet = this.planet1;
        ship.targetPlanet = this.planet0;
    }

    ship.startTime = this.game.time.events.seconds;
    ship.travelTime = this.distance / ship.speed;
    ship.offset = Math.random() * 20 - 10;
    ship.percentage = 0;
}

Edge.prototype.updateShipPosition = function( ship ) {

    if ( ship.percentage >= 1 ) {
        ship.kill();
        ship.targetPlanet.hitFromShip( ship );
    }

    ship.percentage = Math.min( ( this.now - ship.startTime ) / ship.travelTime, 1 );

    var distanceAlongLine = ship.percentage * this.distance;

    ship.x = ship.sourcePlanet.x
      + ( ship.sourcePlanet.width / 2 + distanceAlongLine ) * ship.unitX
      + ship.offset * -ship.unitY;

    ship.y = ship.sourcePlanet.y 
      + ( ship.sourcePlanet.width / 2 + distanceAlongLine ) * ship.unitY
      + ship.offset * ship.unitX;

}

Edge.prototype.update = function() {

    this.now = this.game.time.events.seconds;

    this.sourceShips.forEach( this.updateShipPosition, this );
    this.targetShips.forEach( this.updateShipPosition, this );

    this.sourceShips = _.filter( this.sourceShips, function( ship ) { return ship.alive; } );
    this.targetShips = _.filter( this.targetShips, function( ship ) { return ship.alive; } );

}