import StatsService from '../services/StatsService.js';

/**
 * Pong Game
 * Classic arcade game with 1-player, 2-player, and 4-player modes
 */
export default class PongGame {
    constructor(canvasElement) {
        // Canvas setup
        this.canvas = typeof canvasElement === 'string' ? document.getElementById(canvasElement) : canvasElement;
        
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameMode = 'single'; // 'single', 'duo', or 'quad'
        this.score = { team1: 0, team2: 0 };
        this.winner = null;
        this.gameStartTime = Date.now();
        this.userId = null; // Will be set when the game starts
        
        // Initial speed constants (needed for proper resets)
        this.initialBallSpeed = 5;
        
        // Game objects
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 10,
            speed: this.initialBallSpeed,
            velocityX: this.initialBallSpeed,
            velocityY: this.initialBallSpeed
        };
        
        this.paddleHeight = 100;
        this.paddleWidth = 10;
        this.paddleSpeed = 8;
        
        // Side paddles (left - player1, right - player2)
        this.player1 = {
            name: "Player 1",
            x: 0,
            y: (this.canvas.height - this.paddleHeight) / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            moveUp: false,
            moveDown: false,
            color: '#3498db', // Blue
            team: 'team1'
        };
        
        this.player2 = {
            name: "Player 2",
            x: this.canvas.width - this.paddleWidth,
            y: (this.canvas.height - this.paddleHeight) / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            moveUp: false,
            moveDown: false,
            color: '#e74c3c', // Red
            team: 'team2'
        };
        
        // Top and bottom paddles (for 4-player mode)
        this.player3 = {
            name: "Player 3",
            x: (this.canvas.width - this.paddleHeight) / 2, // Centered horizontally
            y: 0,
            width: this.paddleHeight, // Width and height are swapped
            height: this.paddleWidth,
            moveLeft: false,
            moveRight: false,
            color: '#3498db', // Blue (same as player 1)
            team: 'team1'
        };
        
        this.player4 = {
            name: "Player 4",
            x: (this.canvas.width - this.paddleHeight) / 2, // Centered horizontally
            y: this.canvas.height - this.paddleWidth,
            width: this.paddleHeight, // Width and height are swapped
            height: this.paddleWidth,
            moveLeft: false,
            moveRight: false,
            color: '#e74c3c', // Red (same as player 2)
            team: 'team2'
        };
        
        // All players in an array for easier iteration
        this.players = [this.player1, this.player2, this.player3, this.player4];
        
        // AI properties
        this.aiUpdateInterval = 1000; // AI updates position once per second
        this.lastAiUpdate = 0;
        this.aiTargetY = this.canvas.height / 2;
        this.aiTargetX = this.canvas.width / 2;
        
        // Sounds (optional)
        this.sounds = {
            hit: null,
            score: null
        };
        
        // Try to load sounds if available
        try {
            this.sounds.hit = new Audio('../assets/sounds/pong-hit.mp3');
            this.sounds.score = new Audio('../assets/sounds/pong-score.mp3');
        } catch(e) {
            console.log("Sound files could not be loaded, continuing without sound");
        }
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.resetBall = this.resetBall.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
    
    handleKeyDown(e) {
        if (!this.gameRunning) return;
        
        // Player 1 controls (A, D)
        if (e.key === 'a' || e.key === 'A') {
            this.player1.moveUp = true;
        }
        if (e.key === 'd' || e.key === 'D') {
            this.player1.moveDown = true;
        }
        
        // Player 2 controls (T, G)
        if (this.gameMode !== 'single') {
            if (e.key === 't' || e.key === 'T') {
                this.player2.moveUp = true;
            }
            if (e.key === 'g' || e.key === 'G') {
                this.player2.moveDown = true;
            }
        }
        
        // Player 3 controls (Up, Down arrows) - only in 4-player mode
        if (this.gameMode === 'quad') {
            if (e.key === 'ArrowUp') {
                this.player3.moveLeft = true;
                e.preventDefault(); // Prevent scrolling with arrow keys
            }
            if (e.key === 'ArrowDown') {
                this.player3.moveRight = true;
                e.preventDefault(); // Prevent scrolling with arrow keys
            }
            
            // Player 4 controls (4, 6 on numpad) - only in 4-player mode
            if (e.key === '4') {
                this.player4.moveLeft = true;
            }
            if (e.key === '6') {
                this.player4.moveRight = true;
            }
        }
    }
    
    handleKeyUp(e) {
        // Player 1 controls (A, D)
        if (e.key === 'a' || e.key === 'A') {
            this.player1.moveUp = false;
        }
        if (e.key === 'd' || e.key === 'D') {
            this.player1.moveDown = false;
        }
        
        // Player 2 controls (T, G)
        if (e.key === 't' || e.key === 'T') {
            this.player2.moveUp = false;
        }
        if (e.key === 'g' || e.key === 'G') {
            this.player2.moveDown = false;
        }
        
        // Player 3 controls (Up, Down arrows) - only in 4-player mode
        if (e.key === 'ArrowUp') {
            this.player3.moveLeft = false;
            e.preventDefault(); // Prevent scrolling with arrow keys
        }
        if (e.key === 'ArrowDown') {
            this.player3.moveRight = false;
            e.preventDefault(); // Prevent scrolling with arrow keys
        }
        
        // Player 4 controls (4, 6 on numpad) - only in 4-player mode
        if (e.key === '4') {
            this.player4.moveLeft = false;
        }
        if (e.key === '6') {
            this.player4.moveRight = false;
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Randomize direction
        this.ball.velocityX = -this.ball.velocityX;
        this.ball.velocityY = Math.random() * 10 - 5; // Random Y velocity between -5 and 5
    }
    
    updateAI(timestamp) {
        // Only update AI decision once per second
        if (timestamp - this.lastAiUpdate >= this.aiUpdateInterval) {
            this.lastAiUpdate = timestamp;
            
            // Simple AI: track the ball's position
            this.aiTargetY = this.ball.y;
            this.aiTargetX = this.ball.x;
        }
        
        // In single player mode, control player2 (right paddle)
        if (this.gameMode === 'single') {
            // Move paddle toward target position
            const paddleCenter = this.player2.y + (this.player2.height / 2);
            
            // Add some buffering to prevent jittery movement
            if (paddleCenter < this.aiTargetY - 10) {
                this.player2.moveUp = false;
                this.player2.moveDown = true;
            } else if (paddleCenter > this.aiTargetY + 10) {
                this.player2.moveUp = true;
                this.player2.moveDown = false;
            } else {
                this.player2.moveUp = false;
                this.player2.moveDown = false;
            }
        }
        
        // In 4-player mode, also control player3 and player4 if there aren't enough human players
        if (this.gameMode === 'quad' && !this.allHumans) {
            // Control player3 (top paddle)
            const paddle3Center = this.player3.x + (this.player3.width / 2);
            
            if (paddle3Center < this.aiTargetX - 10) {
                this.player3.moveLeft = false;
                this.player3.moveRight = true;
            } else if (paddle3Center > this.aiTargetX + 10) {
                this.player3.moveLeft = true;
                this.player3.moveRight = false;
            } else {
                this.player3.moveLeft = false;
                this.player3.moveRight = false;
            }
            
            // Control player4 (bottom paddle)
            const paddle4Center = this.player4.x + (this.player4.width / 2);
            
            if (paddle4Center < this.aiTargetX - 10) {
                this.player4.moveLeft = false;
                this.player4.moveRight = true;
            } else if (paddle4Center > this.aiTargetX + 10) {
                this.player4.moveLeft = true;
                this.player4.moveRight = false;
            } else {
                this.player4.moveLeft = false;
                this.player4.moveRight = false;
            }
        }
    }
    
    updatePaddles() {
        // Player 1 paddle movement
        if (this.player1.moveUp && this.player1.y > 0) {
            this.player1.y -= this.paddleSpeed;
        }
        if (this.player1.moveDown && this.player1.y < this.canvas.height - this.player1.height) {
            this.player1.y += this.paddleSpeed;
        }
        
        // Player 2 paddle movement
        if (this.player2.moveUp && this.player2.y > 0) {
            this.player2.y -= this.paddleSpeed;
        }
        if (this.player2.moveDown && this.player2.y < this.canvas.height - this.player2.height) {
            this.player2.y += this.paddleSpeed;
        }
        
        // Only update player 3 and 4 in 4-player mode
        if (this.gameMode === 'quad') {
            // Player 3 paddle movement (horizontal)
            if (this.player3.moveLeft && this.player3.x > 0) {
                this.player3.x -= this.paddleSpeed;
            }
            if (this.player3.moveRight && this.player3.x < this.canvas.width - this.player3.width) {
                this.player3.x += this.paddleSpeed;
            }
            
            // Player 4 paddle movement (horizontal)
            if (this.player4.moveLeft && this.player4.x > 0) {
                this.player4.x -= this.paddleSpeed;
            }
            if (this.player4.moveRight && this.player4.x < this.canvas.width - this.player4.width) {
                this.player4.x += this.paddleSpeed;
            }
        }
    }
    
    checkPaddleCollision(paddle) {
        // Different collision detection logic for vertical vs horizontal paddles
        if (paddle === this.player1 || paddle === this.player2) {
            // Vertical paddles (left and right)
            return (
                this.ball.x - this.ball.radius < paddle.x + paddle.width &&
                this.ball.x + this.ball.radius > paddle.x &&
                this.ball.y > paddle.y &&
                this.ball.y < paddle.y + paddle.height
            );
        } else {
            // Horizontal paddles (top and bottom)
            return (
                this.ball.y - this.ball.radius < paddle.y + paddle.height &&
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.x > paddle.x &&
                this.ball.x < paddle.x + paddle.width
            );
        }
    }
    
    handlePaddleCollision(paddle) {
        // Play hit sound
        if (this.sounds.hit) {
            try {
                this.sounds.hit.play().catch(e => console.log("Audio play failed:", e));
            } catch(e) {}
        }
        
        // Different reflection logic for vertical vs horizontal paddles
        if (paddle === this.player1 || paddle === this.player2) {
            // Vertical paddles (left and right)
            const collidePoint = (this.ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
            const angleRad = collidePoint * Math.PI / 4;
            const direction = this.ball.velocityX < 0 ? 1 : -1;
            
            this.ball.velocityX = direction * this.ball.speed * Math.cos(angleRad);
            this.ball.velocityY = this.ball.speed * Math.sin(angleRad);
        } else {
            // Horizontal paddles (top and bottom)
            const collidePoint = (this.ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            const angleRad = collidePoint * Math.PI / 4;
            const direction = this.ball.velocityY < 0 ? 1 : -1;
            
            this.ball.velocityX = this.ball.speed * Math.sin(angleRad);
            this.ball.velocityY = direction * this.ball.speed * Math.cos(angleRad);
        }
        
        // Increase speed slightly after each hit
        this.ball.speed += 0.2;
    }
    
    updateBall() {
        // Ball movement
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;
        
        // Wall collisions (only in 2-player mode)
        if (this.gameMode !== 'quad') {
            // Ceiling and floor collision
            if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
                this.ball.velocityY = -this.ball.velocityY;
                
                // Play hit sound
                if (this.sounds.hit) {
                    try {
                        this.sounds.hit.play().catch(e => console.log("Audio play failed:", e));
                    } catch(e) {}
                }
            }
        }
        
        // Check for paddle collisions
        for (const paddle of this.players) {
            // Skip horizontal paddles in 2-player modes
            if ((paddle === this.player3 || paddle === this.player4) && this.gameMode !== 'quad') {
                continue;
            }
            
            if (this.checkPaddleCollision(paddle)) {
                this.handlePaddleCollision(paddle);
                break; // Only handle one collision per frame
            }
        }
        
        // Score points when ball goes out of bounds
        let scored = false;
        
        // Left boundary
        if (this.ball.x - this.ball.radius < 0) {
            // Team 2 scores (player2 in 2-player, player2 & player4 in 4-player)
            this.score.team2++;
            scored = true;
        }
        // Right boundary
        else if (this.ball.x + this.ball.radius > this.canvas.width) {
            // Team 1 scores (player1 in 2-player, player1 & player3 in 4-player)
            this.score.team1++;
            scored = true;
        }
        
        // Top boundary (only in 4-player mode)
        if (this.gameMode === 'quad') {
            if (this.ball.y - this.ball.radius < 0) {
                // Team 2 scores (player2 & player4)
                this.score.team2++;
                scored = true;
            }
            // Bottom boundary
            else if (this.ball.y + this.ball.radius > this.canvas.height) {
                // Team 1 scores (player1 & player3)
                this.score.team1++;
                scored = true;
            }
        }
        
        if (scored) {
            // Play score sound
            if (this.sounds.score) {
                try {
                    this.sounds.score.play().catch(e => console.log("Audio play failed:", e));
                } catch(e) {}
            }
            
            this.resetBall();
            
            // Check for winner (first to 10 points)
            const winScore = this.gameMode === 'quad' ? 10 : 5; // Higher score for 4-player mode
            
            if (this.score.team1 >= winScore) {
                this.winner = "Team 1";
                this.gameRunning = false;
            } else if (this.score.team2 >= winScore) {
                this.winner = this.gameMode === 'single' ? "Computer" : "Team 2";
                this.gameRunning = false;
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw court divider(s)
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 15]);
        // Vertical divider
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        // Horizontal divider (only in 4-player mode)
        if (this.gameMode === 'quad') {
            this.ctx.moveTo(0, this.canvas.height / 2);
            this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        }
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        // Always draw player1 and player2
        this.ctx.fillStyle = this.player1.color;
        this.ctx.fillRect(this.player1.x, this.player1.y, this.player1.width, this.player1.height);
        
        this.ctx.fillStyle = this.player2.color;
        this.ctx.fillRect(this.player2.x, this.player2.y, this.player2.width, this.player2.height);
        
        // Draw player3 and player4 only in 4-player mode
        if (this.gameMode === 'quad') {
            this.ctx.fillStyle = this.player3.color;
            this.ctx.fillRect(this.player3.x, this.player3.y, this.player3.width, this.player3.height);
            
            this.ctx.fillStyle = this.player4.color;
            this.ctx.fillRect(this.player4.x, this.player4.y, this.player4.width, this.player4.height);
        }
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw score
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.score.team1, this.canvas.width / 4, 60);
        this.ctx.fillText(this.score.team2, 3 * this.canvas.width / 4, 60);
        
        // Draw winner message
        if (this.winner) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.winner} wins!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Click "Restart" to play again', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
        
        // Draw game mode indicator
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        
        let modeText;
        switch (this.gameMode) {
            case 'single': modeText = "1P Mode"; break;
            case 'duo': modeText = "2P Mode"; break;
            case 'quad': modeText = "4P Mode"; break;
            default: modeText = "Unknown Mode";
        }
        
        this.ctx.fillText(modeText, 10, 20);
        
        // Draw controls info
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = this.player1.color;
        this.ctx.fillText("Player 1: A/D", 10, this.canvas.height - 50);
        
        this.ctx.fillStyle = this.player2.color;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(this.gameMode === 'single' ? "Computer" : "Player 2: T/G", this.canvas.width - 10, this.canvas.height - 50);
        
        // Draw additional controls in 4-player mode
        if (this.gameMode === 'quad') {
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = this.player3.color;
            this.ctx.fillText("Player 3: ↑/↓", 10, this.canvas.height - 30);
            
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = this.player4.color;
            this.ctx.fillText("Player 4: 4/6", this.canvas.width - 10, this.canvas.height - 30);
        }
        
        // Draw paused message if game is paused
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '36px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Click "Resume" to continue', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
    
    gameLoop(timestamp) {
        if (this.gameRunning && !this.gamePaused) {
            // Update game state
            this.updatePaddles();
            
            // In single player mode, update AI
            if (this.gameMode === 'single' || (this.gameMode === 'quad' && !this.allHumans)) {
                this.updateAI(timestamp);
            }
            
            this.updateBall();
            
            // Draw everything
            this.draw();
            
            // Continue the loop
            requestAnimationFrame(this.gameLoop);
        } else {
            // If game is not running or is paused, just draw the current state
            this.draw();
        }
    }
    
    start(gameMode = 'single', userId = null, allHumans = false) {
        // Set game mode: 'single' (1P), 'duo' (2P), or 'quad' (4P)
        this.gameMode = gameMode;
        this.userId = userId;
        this.allHumans = allHumans; // Whether all players are human (vs AI)
        
        // Reset game state
        this.score = { team1: 0, team2: 0 };
        this.winner = null;
        this.gamePaused = false;
        this.gameStartTime = Date.now();
        
        // Reset paddles
        this.player1.y = (this.canvas.height - this.paddleHeight) / 2;
        this.player2.y = (this.canvas.height - this.paddleHeight) / 2;
        
        // Reset positions for player 3 and 4 in 4-player mode
        if (this.gameMode === 'quad') {
            this.player3.x = (this.canvas.width - this.paddleHeight) / 2;
            this.player4.x = (this.canvas.width - this.paddleHeight) / 2;
        }
        
        // Reset ball and its speed
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.speed = this.initialBallSpeed; // Reset to initial speed
        this.ball.velocityX = this.initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.velocityY = this.initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        
        // Start the game
        this.gameRunning = true;
        requestAnimationFrame(this.gameLoop);
    }
    
    pause() {
        if (this.gameRunning && !this.gamePaused) {
            this.gamePaused = true;
            // Draw pause indicator
            this.draw();
        }
    }
    
    resume() {
        if (this.gameRunning && this.gamePaused) {
            this.gamePaused = false;
            // Resume game loop
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    togglePause() {
        if (this.gamePaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    stop() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.removeEventListeners();
        
        // Call endGame to record stats
        this.endGame();
    }
    
    endGame() {
        // Record game session in database
        const gameSession = {
            score: this.score,
            metadata: {
                gameMode: this.gameMode,
                winner: this.winner,
                duration: this.calculateGameDuration(),
                allHumans: this.allHumans
            }
        };

        if (this.userId) {
            StatsService.recordGameSession('pong', this.userId, this.score.team1, gameSession.metadata)
                .catch(err => console.error('Failed to record game session:', err));
        }
    }

    calculateGameDuration() {
        return Math.floor((Date.now() - this.gameStartTime) / 1000); // Duration in seconds
    }
}