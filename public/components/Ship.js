export class Ship {
    constructor(gameWidth, gameHeight) {
        this.width = 48;
        this.height = 32;
        this.speed = 5;
        this.velocity = 0;
        this.color = '#00FFFF'; // Ship color
        this.gameWidth = gameWidth;
        
        // Initial position
        this.x = gameWidth / 2;
        this.y = gameHeight - 40;
        
        // Ship pixel map
        this.pixelMap = [
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
            [0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0]
        ];
    }

    moveLeft() {
        this.velocity = -this.speed;
    }

    moveRight() {
        this.velocity = this.speed;
    }

    stop() {
        this.velocity = 0;
    }

    update() {
        this.x += this.velocity;

        // Keep ship within game bounds
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > this.gameWidth) {
            this.x = this.gameWidth - this.width;
        }
    }

    draw(ctx) {
        const pixelSize = this.width / this.pixelMap[0].length;
        this.pixelMap.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(
                        this.x + j * pixelSize,
                        this.y + i * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
} 