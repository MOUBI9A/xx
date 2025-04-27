export default class Snake {
    constructor(canvasElement, options = {}) {
        // Handle canvas parameter whether it's a string ID or DOM element
        this.canvas = typeof canvasElement === 'string' ? document.getElementById(canvasElement) : canvasElement;
        
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cellSize = options.cellSize || 20;
        this.speed = options.speed || 150; // milliseconds per move
        this.backgroundColor = options.backgroundColor || 'black';
        this.foodColor = options.foodColor || 'red';
        this.snakeColor = options.snakeColor || 'lime';
        this.borderColor = options.borderColor || 'white';
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.difficulty = options.difficulty || 'normal'; // easy, normal, hard
        this.powerUps = options.powerUps || false; // Enable/disable power-ups
        this.mapStyle = options.mapStyle || 'classic'; // classic, maze, open
        this.gameHistory = [];
        this.gameStartTime = null;
        
        // Adjust speed based on difficulty
        if (this.difficulty === 'easy') {
            this.speed = 200;
        } else if (this.difficulty === 'hard') {
            this.speed = 100;
        }
        
        // Initialize game
        this.initGame();
    }
    
    initGame() {
        // Create snake (starts with 3 segments)
        this.snake = [
            { x: Math.floor(this.width / this.cellSize / 2) * this.cellSize, 
              y: Math.floor(this.height / this.cellSize / 2) * this.cellSize }
        ];
        
        // Initial direction (right)
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // Generate initial food
        this.generateFood();
        
        // Generate obstacles for maze mode
        this.obstacles = [];
        if (this.mapStyle === 'maze') {
            this.generateObstacles();
        }
        
        // Reset score
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.gameStartTime = Date.now();
        
        // Start game loop
        this.gameInterval = setInterval(() => this.update(), this.speed);
        
        // Set up keyboard controls
        this.setupControls();
    }
    
    setupControls() {
        document.removeEventListener('keydown', this.handleKeyDown);
        this.handleKeyDown = (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
                case 'p':
                    this.togglePause();
                    break;
                case 'r':
                    this.restart();
                    break;
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Add touch controls for mobile
        this.addTouchControls();
    }
    
    addTouchControls() {
        // Track touch start position
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            // Determine swipe direction based on which axis has the larger change
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (diffX > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (diffX < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // Vertical swipe
                if (diffY > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (diffY < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
            
            e.preventDefault();
        }, { passive: false });
    }
    
    update() {
        if (this.gameOver || this.paused) return;
        
        this.direction = this.nextDirection;
        
        // Calculate new head position
        const head = { x: this.snake[0].x, y: this.snake[0].y };
        switch(this.direction) {
            case 'up':
                head.y -= this.cellSize;
                break;
            case 'down':
                head.y += this.cellSize;
                break;
            case 'left':
                head.x -= this.cellSize;
                break;
            case 'right':
                head.x += this.cellSize;
                break;
        }
        
        // Check if the game is over (collision with walls or self)
        if (this.isCollision(head)) {
            this.endGame();
            return;
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check if snake ate food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
            this.generateFood();
            
            // Generate power-up randomly if enabled
            if (this.powerUps && Math.random() < 0.3 && !this.powerUp) {
                this.generatePowerUp();
            }
        } else {
            // If not eating, remove tail
            this.snake.pop();
        }
        
        // Check for power-up collision
        if (this.powerUp && head.x === this.powerUp.x && head.y === this.powerUp.y) {
            this.activatePowerUp();
        }
        
        // Draw the current state
        this.draw();
    }
    
    isCollision(head) {
        // Wall collision (if not in open map style)
        if (this.mapStyle !== 'open') {
            if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
                return true;
            }
        } else {
            // Wrap around for open map style
            if (head.x < 0) head.x = this.width - this.cellSize;
            if (head.x >= this.width) head.x = 0;
            if (head.y < 0) head.y = this.height - this.cellSize;
            if (head.y >= this.height) head.y = 0;
        }
        
        // Self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                return true;
            }
        }
        
        // Obstacle collision in maze mode
        if (this.mapStyle === 'maze') {
            for (let i = 0; i < this.obstacles.length; i++) {
                if (this.obstacles[i].x === head.x && this.obstacles[i].y === head.y) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    generateFood() {
        const gridWidth = Math.floor(this.width / this.cellSize);
        const gridHeight = Math.floor(this.height / this.cellSize);
        
        // Generate random position
        let x, y;
        let validPosition = false;
        
        while (!validPosition) {
            x = Math.floor(Math.random() * gridWidth) * this.cellSize;
            y = Math.floor(Math.random() * gridHeight) * this.cellSize;
            
            validPosition = true;
            
            // Make sure food doesn't appear on snake
            for (let segment of this.snake) {
                if (segment.x === x && segment.y === y) {
                    validPosition = false;
                    break;
                }
            }
            
            // Make sure food doesn't appear on obstacles
            if (validPosition && this.mapStyle === 'maze') {
                for (let obstacle of this.obstacles) {
                    if (obstacle.x === x && obstacle.y === y) {
                        validPosition = false;
                        break;
                    }
                }
            }
        }
        
        this.food = { x, y };
    }
    
    generateObstacles() {
        const gridWidth = Math.floor(this.width / this.cellSize);
        const gridHeight = Math.floor(this.height / this.cellSize);
        
        // Create maze pattern
        const numObstacles = Math.floor((gridWidth * gridHeight) * 0.1); // 10% of grid cells are obstacles
        
        for (let i = 0; i < numObstacles; i++) {
            let x, y;
            let validPosition = false;
            
            // Find valid position for obstacle
            while (!validPosition) {
                x = Math.floor(Math.random() * gridWidth) * this.cellSize;
                y = Math.floor(Math.random() * gridHeight) * this.cellSize;
                
                // Make sure obstacle is not on snake's starting position
                const snakeHeadX = Math.floor(this.width / this.cellSize / 2) * this.cellSize;
                const snakeHeadY = Math.floor(this.height / this.cellSize / 2) * this.cellSize;
                
                const padding = 3 * this.cellSize; // Leave space around snake start
                if (Math.abs(x - snakeHeadX) < padding && Math.abs(y - snakeHeadY) < padding) {
                    continue;
                }
                
                validPosition = true;
                
                // Check for existing obstacles
                for (let obstacle of this.obstacles) {
                    if (obstacle.x === x && obstacle.y === y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            this.obstacles.push({ x, y });
        }
    }
    
    generatePowerUp() {
        const gridWidth = Math.floor(this.width / this.cellSize);
        const gridHeight = Math.floor(this.height / this.cellSize);
        
        let x, y;
        let validPosition = false;
        
        while (!validPosition) {
            x = Math.floor(Math.random() * gridWidth) * this.cellSize;
            y = Math.floor(Math.random() * gridHeight) * this.cellSize;
            
            validPosition = true;
            
            // Check snake
            for (let segment of this.snake) {
                if (segment.x === x && segment.y === y) {
                    validPosition = false;
                    break;
                }
            }
            
            // Check obstacles
            if (validPosition && this.mapStyle === 'maze') {
                for (let obstacle of this.obstacles) {
                    if (obstacle.x === x && obstacle.y === y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Check food
            if (this.food.x === x && this.food.y === y) {
                validPosition = false;
            }
        }
        
        // Random power-up type
        const powerUpTypes = ['speed', 'score', 'size'];
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        this.powerUp = { x, y, type };
        
        // Power-ups disappear after a time
        this.powerUpTimeout = setTimeout(() => {
            this.powerUp = null;
        }, 10000); // 10 seconds
    }
    
    activatePowerUp() {
        clearTimeout(this.powerUpTimeout);
        
        switch(this.powerUp.type) {
            case 'speed':
                // Temporary speed boost
                const originalSpeed = this.speed;
                this.speed = this.speed * 0.7; // 30% faster
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.update(), this.speed);
                
                setTimeout(() => {
                    this.speed = originalSpeed;
                    clearInterval(this.gameInterval);
                    this.gameInterval = setInterval(() => this.update(), this.speed);
                }, 5000); // lasts 5 seconds
                break;
                
            case 'score':
                // Bonus points
                this.score += 50;
                break;
                
            case 'size':
                // Add length to the snake
                const tail = this.snake[this.snake.length - 1];
                // Add 3 segments
                for (let i = 0; i < 3; i++) {
                    this.snake.push({...tail});
                }
                break;
        }
        
        this.powerUp = null;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw obstacles if in maze mode
        if (this.mapStyle === 'maze') {
            this.ctx.fillStyle = '#666666';
            for (let obstacle of this.obstacles) {
                this.ctx.fillRect(obstacle.x, obstacle.y, this.cellSize, this.cellSize);
                
                // Add border
                this.ctx.strokeStyle = '#333333';
                this.ctx.strokeRect(obstacle.x, obstacle.y, this.cellSize, this.cellSize);
            }
        }
        
        // Draw snake
        this.ctx.fillStyle = this.snakeColor;
        for (let i = 0; i < this.snake.length; i++) {
            this.ctx.fillRect(this.snake[i].x, this.snake[i].y, this.cellSize, this.cellSize);
            
            // Draw segment border
            this.ctx.strokeStyle = this.borderColor;
            this.ctx.strokeRect(this.snake[i].x, this.snake[i].y, this.cellSize, this.cellSize);
        }
        
        // Draw food
        this.ctx.fillStyle = this.foodColor;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x + this.cellSize / 2,
            this.food.y + this.cellSize / 2,
            this.cellSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw power-up if active
        if (this.powerUp) {
            let powerUpColor;
            switch(this.powerUp.type) {
                case 'speed': powerUpColor = 'yellow'; break;
                case 'score': powerUpColor = 'purple'; break;
                case 'size': powerUpColor = 'cyan'; break;
            }
            
            this.ctx.fillStyle = powerUpColor;
            this.ctx.beginPath();
            this.ctx.arc(
                this.powerUp.x + this.cellSize / 2,
                this.powerUp.y + this.cellSize / 2,
                this.cellSize / 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Add sparkle effect
            this.ctx.strokeStyle = 'white';
            this.ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2) + (Date.now() / 500) % (Math.PI * 2);
                const x1 = this.powerUp.x + this.cellSize / 2 + Math.cos(angle) * (this.cellSize / 1.5);
                const y1 = this.powerUp.y + this.cellSize / 2 + Math.sin(angle) * (this.cellSize / 1.5);
                this.ctx.moveTo(this.powerUp.x + this.cellSize / 2, this.powerUp.y + this.cellSize / 2);
                this.ctx.lineTo(x1, y1);
            }
            this.ctx.stroke();
        }
        
        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`High: ${this.highScore}`, 10, 60);
    }
    
    endGame() {
        clearInterval(this.gameInterval);
        this.gameOver = true;
        
        // Record game session in database
        const gameSession = {
            score: this.score,
            metadata: {
                difficulty: this.difficulty,
                powerUps: this.powerUps,
                mapStyle: this.mapStyle,
                startedAt: this.gameStartTime,
                endedAt: Date.now(),
                duration: Math.floor((Date.now() - this.gameStartTime) / 1000)
            }
        };
        
        // Record the session using StatsService
        StatsService.recordGameSession('snake', this.userId, this.score, gameSession.metadata)
            .catch(err => console.error('Failed to record game session:', err));
            
        // Draw game over screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'red';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 40);
        
        // Dispatch custom event with game results
        const gameOverEvent = new CustomEvent('snakeGameOver', { 
            detail: {
                ...gameSession,
                highScore: this.highScore
            }
        });
        document.dispatchEvent(gameOverEvent);
    }
    
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            // Draw pause screen
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 40);
        }
    }
    
    restart() {
        clearInterval(this.gameInterval);
        this.initGame();
    }
    
    updateOptions(options) {
        // Update game options
        if (options.cellSize) this.cellSize = options.cellSize;
        if (options.backgroundColor) this.backgroundColor = options.backgroundColor;
        if (options.foodColor) this.foodColor = options.foodColor;
        if (options.snakeColor) this.snakeColor = options.snakeColor;
        if (options.borderColor) this.borderColor = options.borderColor;
        
        // Update gameplay options
        if (options.difficulty) {
            this.difficulty = options.difficulty;
            if (this.difficulty === 'easy') {
                this.speed = 200;
            } else if (this.difficulty === 'normal') {
                this.speed = 150;
            } else if (this.difficulty === 'hard') {
                this.speed = 100;
            }
            
            if (!this.gameOver && !this.paused) {
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.update(), this.speed);
            }
        }
        
        // Update feature toggles
        if (options.powerUps !== undefined) this.powerUps = options.powerUps;
        
        // Update map style (only when restarting the game)
        if (options.mapStyle) {
            this.mapStyle = options.mapStyle;
            if (!this.gameOver) {
                this.restart();
            }
        }
        
        // Redraw if the game is paused or over
        if (this.paused || this.gameOver) {
            this.draw();
            if (this.paused) this.togglePause();
        }
    }
    
    cleanup() {
        clearInterval(this.gameInterval);
        if (this.powerUpTimeout) clearTimeout(this.powerUpTimeout);
        document.removeEventListener('keydown', this.handleKeyDown);
    }
    
    getGameHistory() {
        return JSON.parse(localStorage.getItem('snakeGameHistory') || '[]');
    }
}