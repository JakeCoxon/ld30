var MAX_CAPTURE = 5;

function Planet( game, x, y ) {
    Phaser.Sprite.call( this, game, x, y, 'planet' );
    this.ownerId = null;
    this.captureOwnerId = null;
    this.captureValue = 0;

    this.text = game.add.text( x, y, ' ', { font: 'bold 32px Michroma', fill: 'black' } );
    this.text.alpha = 0.4;
    this.text.anchor.set( 0.5, 0.5 );

    this.middleCircle = game.add.sprite( x, y, 'planet' );
    this.middleCircle.anchor.set( 0.5, 0.5 );
    this.middleCircle.alpha = 0.7;

    this.setCapturing( null );
}

Planet.prototype = Object.create( Phaser.Sprite.prototype );
Planet.prototype.constructor = Planet;

Planet.prototype.setCapturing = function( ownerId ) {
    this.ownerId = null;
    this.captureOwnerId = ownerId;
    this.captureValue = 0;
    this.loadTexture( 'planet' );
};
Planet.prototype.increaseCaptureValue = function( ownerId, value ) {
    var wasZero = this.captureValue == 0;

    this.captureValue += value;

    if ( this.captureValue == 0 ) {
        this.setCapturing( null );

        this.game.add.tween( this.middleCircle ).to( {
            width: 0, height: 0
        }, 200, Phaser.Easing.Quartic.Out, true );

    } else {

        if ( wasZero ) {
            this.captureOwnerId = ownerId;
            this.middleCircle.width = 0;
            this.middleCircle.height = 0;
        }

        if ( this.ownerId == null ) {
            // TODO does this try and reload texture every time?
            this.middleCircle.loadTexture( 'player' + ownerId );
            this.middleCircle.revive();
        }

        this.game.world.bringToTop( this.middleCircle );

        var middleCircleWidth = Math.min( this.captureValue / MAX_CAPTURE, 1 ) * this.width;
        this.game.add.tween( this.middleCircle ).to( {
            width: middleCircleWidth, height: middleCircleWidth
        }, 200, Phaser.Easing.Quartic.Out, true );

        if ( this.captureValue >= MAX_CAPTURE ) {

            var tween = this.game.add.tween( this.middleCircle ).to( {
                alpha: 1,
            }, 200, Phaser.Easing.Quartic.Out, true, 200 );

            var add = this.captureValue - MAX_CAPTURE + 1;

            tween.onComplete.add( function() {
                this.setOwner( ownerId );
                this.setEggs( this.numEggs + add );
            }, this );

        }


    }
};
Planet.prototype.hitFromShip = function( ship ) {

    var attackStrength = ship.attackStrength;

    // Capture state
    if ( this.ownerId === null ) {

        if ( this.captureOwnerId === null || this.captureOwnerId === ship.ownerId ) {
            this.increaseCaptureValue( ship.ownerId, attackStrength );
        } else {
            this.increaseCaptureValue( ship.ownerId, -attackStrength );
        }

    }

    // Attack state
    else {

        if ( this.ownerId !== ship.ownerId ) {
            this.setEggs( this.numEggs - attackStrength );
            if ( this.numEggs <= 0 ) {
                this.setCapturing( ship.ownerId );
                this.increaseCaptureValue( ship.ownerId, -this.numEggs + 1 )
            }
        } else {
            this.setEggs( this.numEggs + attackStrength );
        }
    }

    
}
Planet.prototype.hasOwner = function() {
    return this.ownerId !== null;
}

Planet.prototype.setOwner = function( ownerId ) {
    this.ownerId = ownerId;
    this.setEggs( 0 );
    this.middleCircle.kill();
    this.loadTexture( 'player' + ownerId );
};

Planet.prototype.setEggs = function( num ) {

        var tween = this.game.add.tween( this.text ).to( {
            alpha: 0
        }, 200, Phaser.Easing.Quadratic.In, true );
        tween.onComplete.add( function() {
            this.text.text = num + "";
        }, this );

    tween.to( {
        alpha: 0.4
    }, 200, Phaser.Easing.Quadratic.Out, false, 0 );

    this.numEggs = num;

}
