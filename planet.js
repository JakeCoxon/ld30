var MAX_CAPTURE = 5;

function Planet( game, x, y, planetsGroup ) {
    Phaser.Sprite.call( this, game, x, y, 'planet' );

    this.planetsGroup = planetsGroup;
    this.ownerId = null;
    this.captureOwnerId = null;
    this.captureValue = 0;

    // this.text = game.add.text( x, y, ' ', { font: 'bold 20px Michroma', fill: 'black' } );
    // this.text.alpha = 0.4;
    // this.text.anchor.set( 0.5, 0.5 );

    this.middleCircle = planetsGroup.add( new Phaser.Sprite( this.game, x, y, 'planet' ) );
    this.middleCircle.anchor.set( 0.5, 0.5 );
    this.middleCircle.alpha = 0.7;

    this.events.ownerChanged = new Phaser.Signal();

    this.goodSound = this.game.add.audio( 'bop' );
    this.badSound = this.game.add.audio( 'bump' );
    this.attackSound = this.game.add.audio( 'shh' );

    this.setCapturing( null );
    this.eggSprites = [];

}

Planet.prototype = Object.create( Phaser.Sprite.prototype );
Planet.prototype.constructor = Planet;

Planet.prototype.increaseCaptureValue = function( ownerId, value ) {
    var wasZero = this.captureValue == 0;

    this.captureValue += value;

    if ( this.captureValue <= 0 ) {

        var tween = this.game.add.tween( this.middleCircle );

        tween.to( {
            width: 0, height: 0
        }, 200, Phaser.Easing.Quartic.Out, true );

        if ( this.captureValue < 0 ) {
            var newValue = -this.captureValue;
            tween.onComplete.add( function() {
                this.increaseCaptureValue( ownerId, newValue );
            }, this );
        }

        this.setCapturing( null );
        this.attackSound.play();

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

        this.planetsGroup.bringToTop( this.middleCircle );

        var middleCircleWidth = Math.min( this.captureValue / MAX_CAPTURE, 1 ) * this.width;
        this.game.add.tween( this.middleCircle ).to( {
            width: middleCircleWidth, height: middleCircleWidth
        }, 200, Phaser.Easing.Quartic.Out, true );

        if ( this.captureValue >= MAX_CAPTURE ) {

            if ( ownerId === 0 ) {
                this.goodSound.play();
            } else {
                this.badSound.play();
            }

            var tween = this.game.add.tween( this.middleCircle ).to( {
                alpha: 1,
            }, 200, Phaser.Easing.Quartic.Out, true, 200 );

            var add = this.captureValue - MAX_CAPTURE + 1;

            tween.onComplete.add( function() {
                this.setOwner( ownerId );
                this.setEggs( this.numEggs + add );
            }, this );

        } else {
            this.attackSound.play();
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
            var newEggs = this.numEggs - attackStrength;
            this.setEggs( newEggs );

            if ( newEggs <= 0 ) {
                this.setCapturing( ship.ownerId );

                if ( ship.ownerId === 0 ) {
                    this.goodSound.play();
                } else {
                    this.badSound.play();
                }

                this.middleCircle.alpha = 1;
                this.middleCircle.width = this.width;
                this.middleCircle.height = this.height;
                this.middleCircle.revive();
                var tween = this.game.add.tween( this.middleCircle );

                tween.to( {
                    width: 0, height: 0, alpha: 0.7
                }, 200, Phaser.Easing.Quartic.Out, true );

                var newCapture = -this.numEggs + 1;
                tween.onComplete.add( function() {
                    this.increaseCaptureValue( ship.ownerId, newCapture );
                }, this );

            } else {
                this.attackSound.play();
            }
        } else {
            this.setEggs( this.numEggs + attackStrength );
            this.attackSound.play();
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
    if ( ownerId !== null ) {
        this.loadTexture( 'player' + ownerId );
    }
    this.events.ownerChanged.dispatch( this );
};
Planet.prototype.setCapturing = function( ownerId ) {
    this.ownerId = null;
    this.captureOwnerId = ownerId;
    this.captureValue = 0;
    this.loadTexture( 'planet' );
    this.events.ownerChanged.dispatch( this );
};

Planet.prototype.setEggs = function( num ) {

    num = Math.max( num, 0 );

    // var tween = this.game.add.tween( this.text ).to( {
    //     alpha: 0
    // }, 200, Phaser.Easing.Quadratic.In, true );

    // tween.onComplete.add( function() {
    //     this.text.text = num + "";
    // }, this );

    // tween.to( {
    //     alpha: 0.4
    // }, 200, Phaser.Easing.Quadratic.Out, false, 0 );

    var visualNum = Math.min( num, 40 );

    for ( var i = 0; i < Math.max( this.eggSprites.length, visualNum ); i++ ) {

        if ( i >= this.eggSprites.length ) {

            var eggSprite = this.planetsGroup.add( new Phaser.Sprite( this.game, 0, 0, 'egg' ) );
            eggSprite.anchor.set( 0.5, 0.5 );
            eggSprite.width = 10; 
            eggSprite.height = 10;
            eggSprite.x = this.x; 
            eggSprite.y = this.y;
            eggSprite.tint = 0xD5E1DD;
            this.eggSprites.push( eggSprite );
        }
        
        var e = this.eggSprites[ i ];

        if ( i >= visualNum ) {
            this.game.add.tween( e ).to( {
                alpha: 0
            }, 200, Phaser.Easing.Linear.None, true);
            continue;
        }
        e.revive()

        var ring = function( i, maxRingSize, radius, offset ) {
            i -= offset || 0;
            if ( i < maxRingSize ) {
                var ringSize = Math.min( maxRingSize, visualNum - ( offset || 0 ) );
                var s = Math.sin( i / ringSize * Math.PI * 2 + Math.PI );
                var c = Math.cos( i / ringSize * Math.PI * 2 + Math.PI );
                this.game.add.tween( e ).to( {
                    x: this.x + s * radius,
                    y: this.y + c * radius,
                }, 400, Phaser.Easing.Sinusoidal.InOut, true)

                this.game.add.tween( e ).to( {
                    alpha: 0.7
                }, 200, Phaser.Easing.Linear.None, true);

                return true;
            }
            return false;
        }.bind( this );

        if ( visualNum >= 21 ) {
            ring( i, 1, 0 ) || ring( i, 20, 10, 1 ) || ring( i, Infinity, 19, 21 );
        }
        else if ( visualNum >= 17 ) {
            ring( i, 1, 0 ) || ring( i, 5, 10, 1 ) || ring( i, Infinity, 19, 6 );
        }
        else if ( visualNum >= 16 ) {
            ring( i, 5, 8 ) || ring( i, Infinity, 19, 5 );
        }
        else if ( visualNum >= 14 ) {
            ring( i, 4, 8 ) || ring( i, Infinity, 18, 4 );
        }
        else if ( visualNum >= 11 ) {
            ring( i, 3, 6 ) || ring( i, Infinity, 17, 3 );
        }
        else if ( visualNum >= 8 ) {
            ring( i, 1, 0 ) || ring( i, Infinity, 14, 1 );
        }
        else if ( visualNum >= 6 ) {
            ring( i, 1, 0 ) || ring( i, Infinity, 10, 1 );
        }
        else if ( visualNum > 1 ) {
            ring( i, Infinity, 10 );
        }
        else if ( visualNum == 1 ) {
            ring( i, Infinity, 0 );
        }

    }

    this.numEggs = num;

}
