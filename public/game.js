import { GERION_INVADER_FRAMES } from './invaders/gerion.js';
import { OCTOPUS_INVADER_FRAMES } from './invaders/octopus.js';
import { MADUSA_INVADER_FRAMES } from './invaders/madusa.js';
import { ORANGE_INVADER_FRAMES } from './invaders/orange.js';
import { LIGHT_BLUE_INVADER_FRAMES } from './invaders/light_blue.js';
import { CRAB_INVADER_FRAMES } from './invaders/crab.js';
import { SQUID_INVADER_FRAMES } from './invaders/squid.js';
import { UGLY_INVADER_FRAMES } from './invaders/ugly.js';
import { FRAME_DURATIONS } from './invaders/frameDurations.js';
import { FINAL_BOSS_ONE_FRAMES } from './invaders/final-boss-one.js';
import { Leaderboard } from './components/Leaderboard.js';
import { PixelInvaderFactory, INVADER_COLORS } from './components/PixelInvaderFactory.js';
import { Ship } from './components/Ship.js';
import { BulletManager } from './components/BulletManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const explosionSound = document.getElementById('explosionSound');

// Create instances of the new components
const ship = new Ship(GAME_WIDTH, GAME_HEIGHT);
const bulletManager = new BulletManager();

let enemies = [];
let gameOver = false;
let ENEMY_SPEED = 0.2; // Initial speed of enemy movement
const SPEED_INCREASE_INTERVAL = 10000; // 10 seconds in milliseconds
const SPEED_INCREASE_FACTOR = 1.2; // 20% speed increase every 10 seconds

let isPaused = false;
let animationId;
let lastSpeedIncreaseTime = 0;

let score = 0;
let enemyKills = 0; // Track enemy kills separately from score
const BOSS_FIGHT_THRESHOLD = 50; // Kill 50 enemies to trigger boss

const STAR_COUNT = 100;
let stars = [];

// Modify these constants
const FIRST_BIG_ENEMY_THRESHOLD = 50;
const SECOND_BIG_ENEMY_THRESHOLD = 100;

// Boss fight state
let isBossFight = false;
let stageCleared = false;
let showStageClearMessage = false;

// Change bigEnemy to an array
let bigEnemies = [];

const BIG_ENEMY_HEALTH = 20;
const BIG_ENEMY_SIZE = 100;
const BIG_ENEMY_SHOOT_INTERVAL = 2000; // 2 seconds

let enemyBullets = [];
// Track how many regular enemies have been spawned pre-boss
let totalEnemiesSpawned = 0;

// Snake enemy removed

// Add these variables near the top of the file, with the other game state variables
let highScorePromptShown = false;

// Add these variables near the top of the file
let showNameInput = false;
let playerNameInput = '';

// Add this near the top with other initializations
const leaderboard = new Leaderboard();

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

            const bossBaseColor = '#FF00FF';
            const bossFlashColor = '#FF66FF';
            const isBossEnemy = isBossFight;
            const baseColor = bossBaseColor;
            const flashColor = isBossEnemy ? bossFlashColor : bossBaseColor;

            bigEnemies.push({
                x: isBossEnemy ? (GAME_WIDTH / 2 - BIG_ENEMY_SIZE / 2) : xPosition,
                y: isBossEnemy ? 30 : -BIG_ENEMY_SIZE,
                width: BIG_ENEMY_SIZE,
                height: BIG_ENEMY_SIZE,
                health: isBossEnemy ? 50 : BIG_ENEMY_HEALTH,
                color: baseColor,
                baseColor,
                flashColor,
                hitFlashUntil: 0,
                pixelMap: FINAL_BOSS_ONE_FRAMES[0],
                isAnimated: true,
                currentFrame: 0,
                lastFrameUpdate: Date.now(),
                lastShootTime: Date.now(),
                // Boss-only movement properties
                isBoss: isBossEnemy,
                vx: isBossEnemy ? 2 : 0
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

        // Enforce pre-boss spawn cap
        if (totalEnemiesSpawned >= BOSS_FIGHT_THRESHOLD) {
            return;
        }

        const invader = PixelInvaderFactory.create();

        enemies.push({
            x: x,
            y: -enemyHeight,
            width: enemyWidth,
            height: enemyHeight,
            color: invader.color,
            pixelMap: invader.pixelMap,
            isAnimated: invader.isAnimated,
            currentFrame: 0,
            lastFrameUpdate: Date.now()
        });
        totalEnemiesSpawned++;
    }
}

// Ship drawing is now handled by ship.draw(ctx) method from Ship.js component

function drawBullets() {
    bulletManager.draw(ctx);
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
                    frameDuration = FRAME_DURATIONS.MADUSA;
                    break;
                case INVADER_COLORS.orange:
                    frameDuration = FRAME_DURATIONS.ORANGE;
                    break;
                case INVADER_COLORS.lightBlue:
                    frameDuration = FRAME_DURATIONS.LIGHT_BLUE;
                    break;
                case INVADER_COLORS.gerion:
                    frameDuration = FRAME_DURATIONS.GERION;
                    break;
                case INVADER_COLORS.crab:
                    frameDuration = FRAME_DURATIONS.CRAB;
                    break;
                case INVADER_COLORS.octopus:
                    frameDuration = FRAME_DURATIONS.OCTOPUS;
                    break;
                case INVADER_COLORS.squid:
                    frameDuration = FRAME_DURATIONS.SQUID;
                    break;
                case INVADER_COLORS.ugly:
                    frameDuration = FRAME_DURATIONS.UGLY;
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
                }
                else if (enemy.color === INVADER_COLORS.gerion) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % GERION_INVADER_FRAMES.length;
                    enemy.pixelMap = GERION_INVADER_FRAMES[enemy.currentFrame];
                } else if (enemy.color === INVADER_COLORS.ugly) {
                    enemy.currentFrame = (enemy.currentFrame + 1) % UGLY_INVADER_FRAMES.length;
                    enemy.pixelMap = UGLY_INVADER_FRAMES[enemy.currentFrame];
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

        // Update animation frame if needed
        if (bigEnemy.isAnimated) {
            const currentTime = Date.now();
            const frameDuration = FRAME_DURATIONS.FINAL_BOSS_ONE;

            if (currentTime - bigEnemy.lastFrameUpdate > frameDuration) {
                bigEnemy.currentFrame = (bigEnemy.currentFrame + 1) % FINAL_BOSS_ONE_FRAMES.length;
                bigEnemy.pixelMap = FINAL_BOSS_ONE_FRAMES[bigEnemy.currentFrame];
                bigEnemy.lastFrameUpdate = currentTime;
            }
        }

        // Reset flash color once timer expires
        if (bigEnemy.hitFlashUntil && Date.now() > bigEnemy.hitFlashUntil) {
            bigEnemy.color = bigEnemy.baseColor;
            bigEnemy.hitFlashUntil = 0;
        }

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

    // Snake enemy removed
}

function moveBullets() {
    bulletManager.update();
}

function moveEnemies() {
    enemies.forEach(enemy => {
        enemy.y += ENEMY_SPEED;

        // Check if enemy has reached the player's ship
        if (enemy.y + enemy.height >= ship.y) {
            gameOver = true;
        }
    });
    // Remove enemies that have gone off screen
    enemies = enemies.filter(enemy => enemy.y < GAME_HEIGHT);

    bigEnemies.forEach(bigEnemy => {
        if (bigEnemy.isBoss) {
            // Boss moves horizontally at the top, bouncing off walls
            bigEnemy.x += bigEnemy.vx;
            if (bigEnemy.x <= 0) {
                bigEnemy.x = 0;
                bigEnemy.vx = Math.abs(bigEnemy.vx);
            } else if (bigEnemy.x + bigEnemy.width >= GAME_WIDTH) {
                bigEnemy.x = GAME_WIDTH - bigEnemy.width;
                bigEnemy.vx = -Math.abs(bigEnemy.vx);
            }
            // Keep boss near the top
            bigEnemy.y = 30;
        } else {
            // Default behavior for other big enemies
            bigEnemy.y += ENEMY_SPEED * 0.5; // Move slower than regular enemies

            if (bigEnemy.y + bigEnemy.height >= ship.y) {
                gameOver = true;
            }
        }

        // Big enemy shooting
        if (Date.now() - bigEnemy.lastShootTime > BIG_ENEMY_SHOOT_INTERVAL) {
            if (bigEnemy.isBoss) {
                if (bossFartSound) {
                    bossFartSound.currentTime = 0;
                    bossFartSound.play().catch(() => {});
                }
                enemyBullets.push({
                    x: bigEnemy.x + bigEnemy.width / 2 - 5,
                    y: bigEnemy.y + bigEnemy.height,
                    width: 10,
                    height: 12,
                    color: '#8B4513',
                    secondaryColor: '#A0522D',
                    isBossBullet: true
                });
            } else {
                enemyBullets.push({
                    x: bigEnemy.x + bigEnemy.width / 2,
                    y: bigEnemy.y + bigEnemy.height,
                    width: 4,
                    height: 10,
                    color: 'red'
                });
            }
            bigEnemy.lastShootTime = Date.now();
        }
    });
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
    const bullets = bulletManager.getBullets();
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
                enemyKills++;
                updateScoreDisplay();

                // On the 50th kill, start boss music and schedule boss spawn after 5s
                if (!isBossFight && enemyKills === BOSS_FIGHT_THRESHOLD) {
                    startBossSequence();
                }

                // Check if it's time to spawn the big enemies (only if not in boss fight)
                if (!isBossFight && enemyKills < BOSS_FIGHT_THRESHOLD) {
                    if (score === FIRST_BIG_ENEMY_THRESHOLD) {
                        createEnemy(true, 1);
                    } else if (score === SECOND_BIG_ENEMY_THRESHOLD) {
                        createEnemy(true, 2);
                    }
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
                if (bigEnemy.isBoss) {
                    bigEnemy.color = bigEnemy.flashColor;
                    bigEnemy.hitFlashUntil = Date.now() + 100; // flash for 100ms
                }

                // Create a small explosion for each hit
                createExplosion(bullet.x, bullet.y, 10, bigEnemy.color);

                if (bigEnemy.health <= 0) {
                    // Create a big explosion when the big enemy is destroyed
                    createExplosion(bigEnemy.x + bigEnemy.width / 2, bigEnemy.y + bigEnemy.height / 2, bigEnemy.width / 2, bigEnemy.color);
                    bigEnemies.splice(index, 1);
                    score += 20; // Bonus points for destroying big enemy
                    updateScoreDisplay();
                    
                    // If this is the boss in boss fight, play death sound and then show stage clear after 3s
                    if (isBossFight && bigEnemies.length === 0) {
                        // Stop boss music and ensure background is stopped
                        if (isBossMusicPlaying) {
                            bossMusic.pause();
                            isBossMusicPlaying = false;
                        }
                        backgroundMusic.pause();
                        backgroundMusic.currentTime = 0;
                        isMusicPlaying = false;

                        // Play boss death sound
                        if (bossDeathSound) {
                            bossDeathSound.currentTime = 0;
                            bossDeathSound.play().catch(() => {});
                        }

                        // Delay stage clear screen by 3 seconds
                        setTimeout(() => {
                            showStageClearScreen();
                        }, 3000);
                    }
                }
            }
        });
    });

    // Check collision between enemy bullets and player
    enemyBullets.forEach((bullet, index) => {
        if (
            bullet.x < ship.x + ship.width &&
            bullet.x + bullet.width > ship.x &&
            bullet.y < ship.y + ship.height &&
            bullet.y + bullet.height > ship.y
        ) {
            gameOver = true;
            enemyBullets.splice(index, 1);
        }
    });
}

function updatePlayer() {
    ship.update();
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
const bossMusic = document.getElementById('bossMusic');
const bossDeathSound = document.getElementById('bossDeathSound');
const bossFartSound = document.getElementById('bossFartSound');
let isMusicPlaying = false;
let isBossMusicPlaying = false;

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

// Function to start boss fight
function startBossFight() {
    isBossFight = true;
    // Stop background music completely (boss music should already be playing from startBossSequence)
    if (isMusicPlaying) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        isMusicPlaying = false;
    }
    // Ensure background music is stopped even if isMusicPlaying was false
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    // Only start boss music if it's not already playing
    if (!isBossMusicPlaying) {
        bossMusic.volume = 0.5;
        bossMusic.loop = true;
        bossMusic.currentTime = 0;
        bossMusic.play()
            .then(() => {
                isBossMusicPlaying = true;
            })
            .catch(error => {
                console.error('Error playing boss music:', error);
            });
    }
    
    // Clear all regular enemies
    enemies = [];
    // Spawn final boss
    createEnemy(true, 1);
}

// Start boss sequence: music immediately, boss appears after 5 seconds
function startBossSequence() {
    // Stop background music and start boss music now
    if (isMusicPlaying) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        isMusicPlaying = false;
    }
    if (!isBossMusicPlaying) {
        bossMusic.currentTime = 0;
        bossMusic.volume = 0.5;
        bossMusic.loop = true;
        bossMusic.play()
            .then(() => { isBossMusicPlaying = true; })
            .catch(err => console.error('Error playing boss music:', err));
    }
    // Delay boss spawn by 5 seconds
    setTimeout(() => {
        startBossFight();
    }, 5000);
}

// Function to show stage clear screen
function showStageClearScreen() {
    showStageClearMessage = true;
    isBossFight = false;
    stageCleared = true;
    // Stop boss music
    if (isBossMusicPlaying) {
        bossMusic.pause();
        isBossMusicPlaying = false;
    }
    // Render the stage clear screen once
    gameLoop();
}

// Function to continue after stage clear
function continueStage() {
    showStageClearMessage = false;
    stageCleared = false;
    // Reset enemy speed progression to initial values
    ENEMY_SPEED = 0.2;
    lastSpeedIncreaseTime = Date.now();
    // Reset ship speed and velocity to normal
    ship.speed = 5; // Reset ship speed to initial value
    ship.velocity = 0; // Stop any movement
    // Reset spawn cap and kill counter so invaders spawn again
    totalEnemiesSpawned = 0;
    enemyKills = 0;
    // Resume background music
    if (!isMusicPlaying) {
        startBackgroundMusic();
    } else {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
    }
    // Game continues normally
    gameLoop();
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
        if (isBossMusicPlaying) {
            bossMusic.pause(); // Pause boss music if playing
        }
    } else {
        pauseIcon.style.display = 'block';
        playIcon.style.display = 'none';
        gameLoop();
        if (isMusicPlaying) {
            backgroundMusic.play(); // Resume the background music
        }
        if (isBossMusicPlaying) {
            bossMusic.play(); // Resume boss music if was playing
        }
    }
}

// Modify the restartGame function
function restartGame() {
    cancelAnimationFrame(animationId);
    clearInterval(shipBlinkInterval);
    ship.x = GAME_WIDTH / 2;
    ship.speed = 5; // Reset ship speed to initial value
    ship.velocity = 0;
    bulletManager.clearBullets();
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
    // Snake enemy removed
    gameOverTime = 0;
    shipVisible = true;
    highScorePromptShown = false; // Reset the flag
    showNameInput = false;
    playerNameInput = '';
    totalEnemiesSpawned = 0;
    enemyKills = 0;
    isBossFight = false;
    stageCleared = false;
    showStageClearMessage = false;
    if (isBossMusicPlaying) {
        bossMusic.pause();
        isBossMusicPlaying = false;
    }
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

    // Draw stage clear message if needed
    if (showStageClearMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = '60px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 5;
        ctx.strokeText('Stage one cleared', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        ctx.fillText('Stage one cleared', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

        // Draw "Continue" button
        ctx.font = '30px "Pixelify Sans", sans-serif';
        const continueText = 'Continue';
        ctx.strokeText(continueText, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
        ctx.fillText(continueText, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);

        // Change cursor style when hovering over Continue button
        const textWidth = ctx.measureText(continueText).width;
        const textHeight = 30;
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

        // Do not schedule another frame here to avoid duplicate loops
        return;
    }

    if (gameOver) {
        if (gameOverTime === 0) {
            gameOverTime = Date.now();
            shipBlinkInterval = setInterval(() => {
                shipVisible = !shipVisible;
            }, 200); // Blink every 200ms

            // Check if the score is a high score and show input field
            if (!highScorePromptShown && leaderboard.isHighScore(score)) {
                highScorePromptShown = true;
                showNameInput = true;
            }
        }

        // Draw blinking ship
        if (shipVisible) {
            ship.draw(ctx);
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
    ship.draw(ctx);
    drawBullets();
    drawEnemies();
    moveBullets();
    moveEnemies();
    moveEnemyBullets();
    checkCollisions();
    increaseEnemySpeed();

    // Draw enemy bullets
    enemyBullets.forEach(bullet => {
        if (bullet.isBossBullet) {
            const segmentHeight = Math.max(2, Math.floor(bullet.height / 3));
            // Top swirl
            ctx.fillStyle = bullet.secondaryColor || bullet.color;
            ctx.fillRect(
                bullet.x + Math.floor(bullet.width * 0.3),
                bullet.y,
                Math.floor(bullet.width * 0.4),
                segmentHeight
            );
            // Middle wider section
            ctx.fillStyle = bullet.color;
            ctx.fillRect(
                bullet.x + Math.floor(bullet.width * 0.1),
                bullet.y + segmentHeight,
                Math.floor(bullet.width * 0.8),
                segmentHeight
            );
            // Base
            ctx.fillRect(
                bullet.x,
                bullet.y + segmentHeight * 2,
                bullet.width,
                segmentHeight
            );
        } else {
            ctx.fillStyle = bullet.color || 'red';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });

    // Create new enemy every second (if less than 5 enemies are present, not in boss fight, and under cap)
    if (!isBossFight && !showStageClearMessage && totalEnemiesSpawned < BOSS_FIGHT_THRESHOLD && enemies.length < 5 && Math.random() < 0.02) {
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
        bulletManager.createBullet(ship);
    }
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
}

// Modify the keydown event listener
document.addEventListener('keydown', (e) => {
    if (!gameOver) {
        if (e.key === 'z') {
            ship.moveLeft();
        } else if (e.key === 'x') {
            ship.moveRight();
        }
    }
    if (e.key === 'm') {
        if (!gameOver) {
            shoot();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'z' || e.key === 'x') {
        ship.stop();
    }
});

// Add this function to handle keypress for name input
function handleNameInput(event) {
    if (showNameInput) {
        if (event.key === 'Enter') {
            if (playerNameInput.trim() !== '') {
                leaderboard.addHighScore(playerNameInput.trim(), score);
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
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if clicking on Continue button during stage clear
    if (showStageClearMessage) {
        const textX = GAME_WIDTH / 2;
        const textY = GAME_HEIGHT / 2 + 80;
        const textWidth = ctx.measureText('Continue').width;
        const textHeight = 30;

        if (
            clickX >= textX - textWidth / 2 &&
            clickX <= textX + textWidth / 2 &&
            clickY >= textY - textHeight / 2 &&
            clickY <= textY + textHeight / 2
        ) {
            continueStage();
        }
        return;
    }

    if (gameOver) {
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
                leaderboard.addHighScore(playerNameInput.trim(), score);
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

// Big enemy pixel map is now imported from invaders/big.js

// Add this to the end of the file
leaderboard.updateDisplay();

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