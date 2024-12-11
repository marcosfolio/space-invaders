const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const laserSound = document.getElementById('laserSound');
const explosionSound = document.getElementById('explosionSound');

const SHIP_COLOR = '#00FFFF'; // Cyan color for the ship

let player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 40,
    width: 48,
    height: 32,
    speed: 5,
    velocity: 0
};

let bullets = [];
let enemies = [];
let gameOver = false;
let ENEMY_SPEED = 0.2; // Initial speed of enemy movement
const SPEED_INCREASE_INTERVAL = 10000; // 10 seconds in milliseconds
const SPEED_INCREASE_FACTOR = 1.2; // 20% speed increase every 10 seconds

let isPaused = false;
let animationId;
let lastSpeedIncreaseTime = 0;

let score = 0;

const STAR_COUNT = 100;
let stars = [];

// Replace the INVADER_COLORS constant with this updated version
const INVADER_COLORS = {
    classic: '#4CAF50',  // Forest green
    octopus: '#FFFF00',  // Yellow
    crab: '#00FFFF',     // Cyan
    squid: '#FF69B4',     // Pink (Hot Pink)
    madusa: '#FF00FF',    // Magenta
    orange: '#FFA500',   // Orange
    lightBlue: '#ADD8E6' // Light Blue
};

// Modify these constants
const FIRST_BIG_ENEMY_THRESHOLD = 50;
const SECOND_BIG_ENEMY_THRESHOLD = 100;

// Change bigEnemy to an array
let bigEnemies = [];

const BIG_ENEMY_HEALTH = 20;
const BIG_ENEMY_SIZE = 100;
const BIG_ENEMY_SHOOT_INTERVAL = 2000; // 2 seconds

let enemyBullets = [];

// Add these constants at the top of the file
const MAX_LEADERBOARD_ENTRIES = 10;
let leaderboard = [];

// Add these constants near the top of the file
const SNAKE_ENEMY_THRESHOLD = 60;
const SNAKE_ENEMY_SIZE = 40; // Reduced size for each segment
const SNAKE_ENEMY_HEALTH = 30;
const SNAKE_ENEMY_SPEED = 1;
const SNAKE_ENEMY_AMPLITUDE = 100;
const SNAKE_ENEMY_FREQUENCY = 0.02;
const SNAKE_ENEMY_LENGTH = 10; // Number of segments in the snake

// Add this to your existing variables
let snakeEnemy = null;

// Add these variables near the top of the file, with the other game state variables
let highScorePromptShown = false;

// Add these variables near the top of the file
let showNameInput = false;
let playerNameInput = '';

// Add these functions for leaderboard management
function loadLeaderboard() {
    const storedLeaderboard = localStorage.getItem('spaceInvadersLeaderboard');
    if (storedLeaderboard) {
        leaderboard = JSON.parse(storedLeaderboard);
    }
}

function saveLeaderboard() {
    localStorage.setItem('spaceInvadersLeaderboard', JSON.stringify(leaderboard));
}

// Modify the updateLeaderboardDisplay function
function updateLeaderboardDisplay() {
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = `
        <div class="leaderboard-header">
            <div class="trophy"></div>
            <h2>Top 10 Scores</h2>
        </div>
    `;
    leaderboard.forEach((entry, index) => {
        leaderboardElement.innerHTML += `<p>${index + 1}. ${entry.name}: ${entry.score}</p>`;
    });
}

function addHighScore(name, score) {
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
        leaderboard.pop();
    }
    saveLeaderboard();
    updateLeaderboardDisplay();
}

// Add this constant near the top of the file
const MADUSA_INVADER_FRAMES = [
    [
        [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0]
    ],
    [
        [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0]
    ]
];

const MADUSA_FRAME_DURATION = 500; // Duration of each frame in milliseconds

// Replace the existing ORANGE_INVADER_MATRIX with this updated version
const ORANGE_INVADER_FRAMES = [
    [
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0]
    ],
    [
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0]
    ]
];

const ORANGE_FRAME_DURATION = 500; // Duration of each frame in milliseconds

// Replace the existing LIGHT_BLUE_INVADER_MATRIX with this updated version
const LIGHT_BLUE_INVADER_FRAMES = [
    [
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0]
    ],
    [
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0]
    ]
];

const LIGHT_BLUE_FRAME_DURATION = 500; // Duration of each frame in milliseconds

// Add this constant near the top of the file
const CRAB_INVADER_FRAMES = [
    [
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0]
    ],
    [
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0]
    ]
];

const CRAB_FRAME_DURATION = 500; // Duration of each frame in milliseconds

// Add this constant near the top of the file
const OCTOPUS_INVADER_FRAMES = [
    [
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 1, 0, 1, 0]
    ],
    [
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
        [1, 0, 1, 0, 0, 0, 0, 1, 0, 1]
    ]
];

const OCTOPUS_FRAME_DURATION = 500; // Duration of each frame in milliseconds

// Add this constant near the top of the file
const SQUID_INVADER_FRAMES = [
    [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0, 0, 1, 0]
    ],
    [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 0, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 1, 0]
    ]
];

const SQUID_FRAME_DURATION = 500; // Duration of each frame in milliseconds

// Modify the createPixelInvader function
function createPixelInvader() {
    const invaderType = Math.floor(Math.random() * 7); // 0-6 for seven types of invaders
    let pixelMap;
    let color;
    let isAnimated = false;

    switch (invaderType) {
        case 0:
            pixelMap = [
                [0, 0, 1, 0, 0, 1, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 1, 1, 0, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 1, 1, 1, 1, 0, 1],
                [1, 0, 1, 0, 0, 1, 0, 1],
                [0, 0, 0, 1, 1, 0, 0, 0]
            ];
            color = INVADER_COLORS.classic;
            break;
        case 1:
            pixelMap = OCTOPUS_INVADER_FRAMES[0];
            color = INVADER_COLORS.octopus;
            isAnimated = true;
            break;
        case 2:
            pixelMap = CRAB_INVADER_FRAMES[0];
            color = INVADER_COLORS.crab;
            isAnimated = true;
            break;
        case 3:
            pixelMap = MADUSA_INVADER_FRAMES[0];
            color = INVADER_COLORS.madusa;
            isAnimated = true;
            break;
        case 4:
            pixelMap = SQUID_INVADER_FRAMES[0];
            color = INVADER_COLORS.squid;
            isAnimated = true;
            break;
        case 5:
            pixelMap = ORANGE_INVADER_FRAMES[0];
            color = INVADER_COLORS.orange;
            isAnimated = true;
            break;
        case 6:
            pixelMap = LIGHT_BLUE_INVADER_FRAMES[0];
            color = INVADER_COLORS.lightBlue;
            isAnimated = true;
            break;
    }

    return { pixelMap, color, isAnimated };
}

// Modify the createEnemy function
function createEnemy(isBig = false, count = 1) {
    if (isBig) {
        for (let i = 0; i < count; i++) {
            let xPosition, overlapping;
            do {
                xPosition = Math.random() * (GAME_WIDTH - BIG_ENEMY_SIZE);
                overlapping = false;

                // Check for overlap with existing enemies
                for (let enemy of enemies) {
                    if (Math.abs(xPosition - enemy.x) < BIG_ENEMY_SIZE + 1) {
                        overlapping = true;
                        break;
                    }
                }

                // Check for overlap with existing big enemies
                for (let bigEnemy of bigEnemies) {
                    if (Math.abs(xPosition - bigEnemy.x) < BIG_ENEMY_SIZE + 1) {
                        overlapping = true;
                        break;
                    }
                }
            } while (overlapping);

            bigEnemies.push({
                x: xPosition,
                y: -BIG_ENEMY_SIZE,
                width: BIG_ENEMY_SIZE,
                height: BIG_ENEMY_SIZE,
                health: BIG_ENEMY_HEALTH,
                color: '#FF00FF', // Magenta color for big enemy
                pixelMap: createBigEnemyPixelMap(),
                lastShootTime: Date.now()
            });
        }
    } else {
        const enemyWidth = 50;
        const enemyHeight = 50;
        let x, overlapping;

        do {
            x = Math.random() * (GAME_WIDTH - enemyWidth);
            overlapping = false;

            // Check for overlap with existing enemies
            for (let enemy of enemies) {
                if (Math.abs(x - enemy.x) < enemyWidth + 1) {
                    overlapping = true;
                    break;
                }
            }

            // Check for overlap with big enemies
            for (let bigEnemy of bigEnemies) {
                if (Math.abs(x - bigEnemy.x) < BIG_ENEMY_SIZE + 1) {
                    overlapping = true;
                    break;
                }
            }
        } while (overlapping);

        const { pixelMap, color, isAnimated } = createPixelInvader();

        enemies.push({
            x: x,
            y: -enemyHeight,
            width: enemyWidth,
            height: enemyHeight,
            color: color,
            pixelMap: pixelMap,
            isAnimated: isAnimated,
            currentFrame: 0,
            lastFrameUpdate: Date.now()
        });
    }
}

function createShipPixelMap() {
    return [
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
        [0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0],
    ];
}

const shipPixelMap = createShipPixelMap();

function drawPlayer() {
    const pixelSize = player.width / shipPixelMap[0].length;
    shipPixelMap.forEach((row, i) => {
        row.forEach((pixel, j) => {
            if (pixel) {
                ctx.fillStyle = SHIP_COLOR;
                ctx.fillRect(
                    player.x + j * pixelSize,
                    player.y + i * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        });
    });
}

function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        const pixelSize = enemy.width / enemy.pixelMap[0].length;

        if (enemy.isAnimated) {
            // Update the frame if it's time
            const currentTime = Date.now();
            let frameDuration;
            switch (enemy.color) {
                case INVADER_COLORS.madusa:
                    frameDuration = MADUSA_FRAME_DURATION;
                    break;
                case INVADER_COLORS.orange:
                    frameDuration = ORANGE_FRAME_DURATION;
                    break;
                case INVADER_COLORS.lightBlue:
                    frameDuration = LIGHT_BLUE_FRAME_DURATION;
                    break;
                case INVADER_COLORS.crab:
                    frameDuration = CRAB_FRAME_DURATION;
                    break;
                case INVADER_COLORS.octopus:
                    frameDuration = OCTOPUS_FRAME_DURATION;
                    break;
                case INVADER_COLORS.squid:
                    frameDuration = SQUID_FRAME_DURATION;
                    break;
                default:
                    frameDuration = 500; // Default frame duration
            }

            if (currentTime - enemy.lastFrameUpdate > frameDuration) {
                if (enemy.color === INVADER_COLORS.madusa) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % MADUSA_INVADER_FRAMES.length;
                    enemy.pixelMap = MADUSA_INVADER_FRAMES[enemy.currentFrame];
                } else if (enemy.color === INVADER_COLORS.orange) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % ORANGE_INVADER_FRAMES.length;
                    enemy.pixelMap = ORANGE_INVADER_FRAMES[enemy.currentFrame];
                } else if (enemy.color === INVADER_COLORS.lightBlue) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % LIGHT_BLUE_INVADER_FRAMES.length;
                    enemy.pixelMap = LIGHT_BLUE_INVADER_FRAMES[enemy.currentFrame];
                } else if (enemy.color === INVADER_COLORS.crab) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % CRAB_INVADER_FRAMES.length;
                    enemy.pixelMap = CRAB_INVADER_FRAMES[enemy.currentFrame];
                } else if (enemy.color === INVADER_COLORS.octopus) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % OCTOPUS_INVADER_FRAMES.length;
                    enemy.pixelMap = OCTOPUS_INVADER_FRAMES[enemy.currentFrame];
                } else if (enemy.color === INVADER_COLORS.squid) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % SQUID_INVADER_FRAMES.length;
                    enemy.pixelMap = SQUID_INVADER_FRAMES[enemy.currentFrame];
                }
                enemy.lastFrameUpdate = currentTime;
            }
        }

        enemy.pixelMap.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(
                        enemy.x + j * pixelSize,
                        enemy.y + i * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    });

    bigEnemies.forEach(bigEnemy => {
        const pixelSize = bigEnemy.width / bigEnemy.pixelMap[0].length;
        bigEnemy.pixelMap.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    ctx.fillStyle = bigEnemy.color;
                    ctx.fillRect(
                        bigEnemy.x + j * pixelSize,
                        bigEnemy.y + i * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    });

    // Draw snake enemy
    if (snakeEnemy) {
        snakeEnemy.forEach(segment => {
            const pixelSize = segment.width / segment.pixelMap[0].length;
            segment.pixelMap.forEach((row, i) => {
                row.forEach((pixel, j) => {
                    if (pixel) {
                        ctx.fillStyle = segment.color;
                        ctx.fillRect(
                            segment.x + j * pixelSize,
                            segment.y + i * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                });
            });
        });
    }
}

function moveBullets() {
    bullets.forEach(bullet => {
        bullet.y -= 5;
    });
    bullets = bullets.filter(bullet => bullet.y > 0);
}

function moveEnemies() {
    enemies.forEach(enemy => {
        enemy.y += ENEMY_SPEED;

        // Check if enemy has reached the player's ship
        if (enemy.y + enemy.height >= player.y) {
            gameOver = true;
        }
    });
    // Remove enemies that have gone off screen
    enemies = enemies.filter(enemy => enemy.y < GAME_HEIGHT);

    bigEnemies.forEach(bigEnemy => {
        bigEnemy.y += ENEMY_SPEED * 0.5; // Move slower than regular enemies

        if (bigEnemy.y + bigEnemy.height >= player.y) {
            gameOver = true;
        }

        // Big enemy shooting
        if (Date.now() - bigEnemy.lastShootTime > BIG_ENEMY_SHOOT_INTERVAL) {
            enemyBullets.push({
                x: bigEnemy.x + bigEnemy.width / 2,
                y: bigEnemy.y + bigEnemy.height,
                width: 4,
                height: 10,
                color: 'red'
            });
            bigEnemy.lastShootTime = Date.now();
        }
    });

    // Move snake enemy
    if (snakeEnemy) {
        snakeEnemy[0].time += SNAKE_ENEMY_FREQUENCY;
        const headX = GAME_WIDTH / 2 + Math.sin(snakeEnemy[0].time) * SNAKE_ENEMY_AMPLITUDE;
        const headY = snakeEnemy[0].initialY + snakeEnemy[0].time * SNAKE_ENEMY_SPEED * 60;

        // Move the head
        snakeEnemy[0].x = headX;
        snakeEnemy[0].y = headY;

        // Move the tail segments
        for (let i = snakeEnemy.length - 1; i > 0; i--) {
            snakeEnemy[i].x = snakeEnemy[i - 1].x;
            snakeEnemy[i].y = snakeEnemy[i - 1].y - SNAKE_ENEMY_SIZE;
        }

        // Remove snake enemy if it goes off screen
        if (snakeEnemy[0].y > GAME_HEIGHT) {
            snakeEnemy = null;
        }
    }
}

function moveEnemyBullets() {
    enemyBullets.forEach(bullet => {
        bullet.y += 3;
    });
    enemyBullets = enemyBullets.filter(bullet => bullet.y < GAME_HEIGHT);
}

// Add this near the top of the file with other global variables
let explosions = [];

// Add this function to create an explosion
function createExplosion(x, y, size, color) {
    explosions.push({
        x: x,
        y: y,
        size: size,
        lifetime: 60, // 1 second at 60 FPS
        color: color
    });
}

// Add this function to draw explosions
function drawExplosions() {
    explosions.forEach(explosion => {
        ctx.fillStyle = explosion.color;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.size * (explosion.lifetime / 60), 0, Math.PI * 2);
        ctx.fill();
    });
}

// Add this function to update explosions
function updateExplosions() {
    explosions = explosions.filter(explosion => {
        explosion.lifetime--;
        return explosion.lifetime > 0;
    });
}

// Modify the checkCollisions function
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Create an explosion at the enemy's position with the enemy's color
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, enemy.color);

                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
                explosionSound.currentTime = 0;
                explosionSound.play();
                score++;
                updateScoreDisplay();

                // Check if it's time to spawn the big enemies
                if (score === FIRST_BIG_ENEMY_THRESHOLD) {
                    createEnemy(true, 1);
                } else if (score === SECOND_BIG_ENEMY_THRESHOLD) {
                    createEnemy(true, 2);
                }
            }
        });

        // Check collision with big enemies
        bigEnemies.forEach((bigEnemy, index) => {
            if (
                bullet.x < bigEnemy.x + bigEnemy.width &&
                bullet.x + bullet.width > bigEnemy.x &&
                bullet.y < bigEnemy.y + bigEnemy.height &&
                bullet.y + bullet.height > bigEnemy.y
            ) {
                bullet.y = -10; // Remove bullet
                explosionSound.currentTime = 0;
                explosionSound.play();
                bigEnemy.health--;

                // Create a small explosion for each hit
                createExplosion(bullet.x, bullet.y, 10, bigEnemy.color);

                if (bigEnemy.health <= 0) {
                    // Create a big explosion when the big enemy is destroyed
                    createExplosion(bigEnemy.x + bigEnemy.width / 2, bigEnemy.y + bigEnemy.height / 2, bigEnemy.width / 2, bigEnemy.color);
                    bigEnemies.splice(index, 1);
                    score += 20; // Bonus points for destroying big enemy
                    updateScoreDisplay();
                }
            }
        });
    });

    // Check collision between enemy bullets and player
    enemyBullets.forEach((bullet, index) => {
        if (
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            gameOver = true;
            enemyBullets.splice(index, 1);
        }
    });

    // Check collision with snake enemy
    if (snakeEnemy) {
        bullets.forEach((bullet, bulletIndex) => {
            snakeEnemy.forEach((segment, segmentIndex) => {
                if (
                    bullet.x < segment.x + segment.width &&
                    bullet.x + bullet.width > segment.x &&
                    bullet.y < segment.y + segment.height &&
                    bullet.y + bullet.height > segment.y
                ) {
                    bullets.splice(bulletIndex, 1);
                    explosionSound.currentTime = 0;
                    explosionSound.play();
                    segment.health--;

                    // Create an explosion for the hit segment
                    createExplosion(segment.x + segment.width / 2, segment.y + segment.height / 2, segment.width / 2, segment.color);

                    if (segment.health <= 0) {
                        if (segmentIndex === 0) {
                            // If the head is destroyed, remove the whole snake
                            score += 50 * snakeEnemy.length; // Bonus points for destroying snake enemy
                            snakeEnemy = null;
                        } else {
                            // Remove the destroyed segment
                            snakeEnemy.splice(segmentIndex, 1);
                            score += 10; // Points for destroying a segment
                        }
                        updateScoreDisplay();
                    }
                }
            });
        });

        // Check if snake enemy collides with player
        snakeEnemy.forEach(segment => {
            if (
                player.x < segment.x + segment.width &&
                player.x + player.width > segment.x &&
                player.y < segment.y + segment.height &&
                player.y + player.height > segment.y
            ) {
                gameOver = true;
            }
        });
    }

    // Check if it's time to spawn the snake enemy
    if (score === SNAKE_ENEMY_THRESHOLD && !snakeEnemy) {
        createSnakeEnemy();
    }
}

function updatePlayer() {
    player.x += player.velocity;

    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > GAME_WIDTH) {
        player.x = GAME_WIDTH - player.width;
    }
}

function increaseEnemySpeed() {
    const currentTime = Date.now();
    if (currentTime - lastSpeedIncreaseTime >= SPEED_INCREASE_INTERVAL) {
        ENEMY_SPEED *= SPEED_INCREASE_FACTOR;
        lastSpeedIncreaseTime = currentTime;
    }
}

function createStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: Math.random() * 2 + 1
        });
    }
}

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function moveStars() {
    stars.forEach(star => {
        star.y += 0.5; // Adjust this value to change star speed
        if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
        }
    });
}

// Add these variables near the top of the file
let gameOverTime = 0;
let shipBlinkInterval;
let shipVisible = true;

// Add these variables at the top of the file with other global variables
let mouseX = 0;
let mouseY = 0;

// Near the top of the file, update these lines
const backgroundMusic = document.getElementById('backgroundMusic');
let isMusicPlaying = false;

// Update the startBackgroundMusic function
function startBackgroundMusic() {
    if (!isMusicPlaying) {
        backgroundMusic.volume = 0.5; // Set volume to 50%
        backgroundMusic.loop = true; // Ensure looping is enabled
        backgroundMusic.play()
            .then(() => {
                isMusicPlaying = true;
                console.log('Background music started successfully');
            })
            .catch(error => {
                console.error('Error playing music:', error);
            });
    }
}

// Add this function to handle user interaction
function handleUserInteraction() {
    if (!isMusicPlaying) {
        startBackgroundMusic();
    }
}

// Modify the togglePause function
function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pauseButton');
    const pauseIcon = pauseButton.querySelector('.pause-icon');
    const playIcon = pauseButton.querySelector('.play-icon');
    if (isPaused) {
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
        cancelAnimationFrame(animationId);
        backgroundMusic.pause(); // Pause the background music
    } else {
        pauseIcon.style.display = 'block';
        playIcon.style.display = 'none';
        gameLoop();
        if (isMusicPlaying) {
            backgroundMusic.play(); // Resume the background music
        }
    }
}

// Modify the restartGame function
function restartGame() {
    cancelAnimationFrame(animationId);
    clearInterval(shipBlinkInterval);
    player.x = GAME_WIDTH / 2;
    player.velocity = 0;
    bullets = [];
    enemies = [];
    gameOver = false;
    isPaused = false;
    score = 0;
    ENEMY_SPEED = 0.2; // Reset enemy speed
    lastSpeedIncreaseTime = Date.now();
    updateScoreDisplay();
    const pauseButton = document.getElementById('pauseButton');
    const pauseIcon = pauseButton.querySelector('.pause-icon');
    const playIcon = pauseButton.querySelector('.play-icon');
    pauseIcon.style.display = 'block';
    playIcon.style.display = 'none';
    createStars(); // Reset stars
    bigEnemies = [];
    enemyBullets = [];
    snakeEnemy = null;
    gameOverTime = 0;
    shipVisible = true;
    highScorePromptShown = false; // Reset the flag
    showNameInput = false;
    playerNameInput = '';
    gameLoop();

    if (!isMusicPlaying) {
        startBackgroundMusic();
    } else {
        backgroundMusic.currentTime = 0; // Restart the music from the beginning
    }

    // ... (rest of the existing reset code)
}

function gameLoop() {
    if (isPaused) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw and move stars
    drawStars();
    moveStars();

    if (gameOver) {
        if (gameOverTime === 0) {
            gameOverTime = Date.now();
            shipBlinkInterval = setInterval(() => {
                shipVisible = !shipVisible;
            }, 200); // Blink every 200ms

            // Check if the score is a high score and show input field
            if (!highScorePromptShown && (leaderboard.length < MAX_LEADERBOARD_ENTRIES || score > leaderboard[leaderboard.length - 1].score)) {
                highScorePromptShown = true;
                showNameInput = true;
            }
        }

        // Draw blinking ship
        if (shipVisible) {
            drawPlayer();
        }

        // Draw name input if needed
        if (showNameInput) {
            ctx.fillStyle = 'white';
            ctx.font = '24px "Pixelify Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Congratulations on your score! Enter your name:', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);

            // Draw input box
            ctx.fillStyle = 'black';
            ctx.fillRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2 - 70, 200, 30);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2 - 70, 200, 30);

            // Draw entered name
            ctx.fillStyle = 'white';
            ctx.textAlign = 'left';
            ctx.fillText(playerNameInput + '|', GAME_WIDTH / 2 - 95, GAME_HEIGHT / 2 - 50);
        }

        // Draw "Game Over" text
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = '60px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 5;
        ctx.strokeText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Draw "Play Again" text
        ctx.font = '30px "Pixelify Sans", sans-serif';
        ctx.strokeText('Play Again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
        ctx.fillText('Play Again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);

        // Add this code to change cursor style
        const textWidth = ctx.measureText('Play Again').width;
        const textHeight = 30; // Approximate height of the text
        const textX = GAME_WIDTH / 2 - textWidth / 2;
        const textY = GAME_HEIGHT / 2 + 80 - textHeight / 2;

        if (
            mouseX >= textX &&
            mouseX <= textX + textWidth &&
            mouseY >= textY &&
            mouseY <= textY + textHeight
        ) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    updatePlayer();
    drawPlayer();
    drawBullets();
    drawEnemies();
    moveBullets();
    moveEnemies();
    moveEnemyBullets();
    checkCollisions();
    increaseEnemySpeed();

    // Draw enemy bullets
    ctx.fillStyle = 'red';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Create new enemy every second (if less than 5 enemies are present)
    if (enemies.length < 5 && Math.random() < 0.02) {
        createEnemy();
    }

    // Add these lines to handle explosions
    updateExplosions();
    drawExplosions();

    animationId = requestAnimationFrame(gameLoop);
}

// Modify the shoot function
function shoot() {
    if (!gameOver) {  // Only shoot and play sound if the game is not over
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10
        });
        laserSound.currentTime = 0;
        laserSound.play();
    }
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
}

// Modify the keydown event listener
document.addEventListener('keydown', (e) => {
    if (!gameOver) {  // Only respond to movement keys if the game is not over
        if (e.key === 'z') {
            player.velocity = -player.speed;
        } else if (e.key === 'x') {
            player.velocity = player.speed;
        }
    }
    if (e.key === 'm') {
        shoot();  // We'll keep this here, but the shoot function will handle the game over state
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'x') {
        player.velocity = 0;
    }
});

// Add this function to handle keypress for name input
function handleNameInput(event) {
    if (showNameInput) {
        if (event.key === 'Enter') {
            if (playerNameInput.trim() !== '') {
                addHighScore(playerNameInput.trim(), score);
                showNameInput = false;
            }
        } else if (event.key === 'Backspace') {
            playerNameInput = playerNameInput.slice(0, -1);
        } else if (event.key.length === 1) {
            playerNameInput += event.key;
        }
    }
}

// Modify the handleCanvasClick function
function handleCanvasClick(event) {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check if the click is on the "Play Again" text
        const textX = GAME_WIDTH / 2;
        const textY = GAME_HEIGHT / 2 + 80;
        const textWidth = ctx.measureText('Play Again').width;
        const textHeight = 30; // Approximate height of the text

        if (
            clickX >= textX - textWidth / 2 &&
            clickX <= textX + textWidth / 2 &&
            clickY >= textY - textHeight / 2 &&
            clickY <= textY + textHeight / 2
        ) {
            if (showNameInput && playerNameInput.trim() !== '') {
                addHighScore(playerNameInput.trim(), score);
            }
            restartGame();
        }
    }
}

// Initial game start
createStars();
lastSpeedIncreaseTime = Date.now();
updateScoreDisplay();
gameLoop();

// Expose functions to global scope
window.restartGame = restartGame;
window.togglePause = togglePause;

// Add this function to create a big enemy pixel map
function createBigEnemyPixelMap() {
    // Create a larger, more complex pixel map for the big enemy
    // This is a simple example, you can make it more detailed
    return [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
    ];
}

// Add this to the end of the file
loadLeaderboard();
updateLeaderboardDisplay();

// Add this function to create the snake enemy pixel map
function createSnakeEnemyPixelMap() {
    return [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 1, 0, 1],
        [0, 1, 0, 1, 1, 0, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0]
    ];
}

// Add this function to create the snake enemy
function createSnakeEnemy() {
    snakeEnemy = [];
    for (let i = 0; i < SNAKE_ENEMY_LENGTH; i++) {
        snakeEnemy.push({
            x: GAME_WIDTH / 2,
            y: -SNAKE_ENEMY_SIZE - i * SNAKE_ENEMY_SIZE,
            width: SNAKE_ENEMY_SIZE,
            height: SNAKE_ENEMY_SIZE,
            health: i === 0 ? SNAKE_ENEMY_HEALTH : 1, // Only the head has full health
            color: i === 0 ? '#00FF00' : '#00CC00', // Slightly darker green for the tail
            pixelMap: createSnakeEnemyPixelMap(),
            initialY: -SNAKE_ENEMY_SIZE - i * SNAKE_ENEMY_SIZE,
            time: 0
        });
    }
}

// Add this event listener at the end of the file
canvas.addEventListener('click', handleCanvasClick);
document.addEventListener('keydown', handleNameInput);
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

// Add this event listener at the end of the file
document.addEventListener('click', handleUserInteraction);
document.addEventListener('keydown', handleUserInteraction);

// Call this function when the game starts
startBackgroundMusic();