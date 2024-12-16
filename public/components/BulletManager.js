export class BulletManager {
    constructor() {
        this.bullets = [];
        this.laserSound = document.getElementById('laserSound');
    }

    createBullet(ship) {
        this.bullets.push({
            x: ship.x + ship.width / 2 - 2,
            y: ship.y,
            width: 4,
            height: 10
        });
        this.laserSound.currentTime = 0;
        this.laserSound.play();
    }

    update() {
        // Move bullets
        this.bullets.forEach(bullet => {
            bullet.y -= 5;
        });
        
        // Remove bullets that are off screen
        this.bullets = this.bullets.filter(bullet => bullet.y > 0);
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        this.bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    getBullets() {
        return this.bullets;
    }

    clearBullets() {
        this.bullets = [];
    }
} 