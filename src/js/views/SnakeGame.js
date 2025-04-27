import AbstractView from './AbstractView.js';
import Snake from '../games/Snake.js';
import GameDashboard from '../components/GameDashboard.js';

export default class SnakeGame extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Snake');
        this.snake = null;
        this.canvas = null;
        this.gameOptions = {
            difficulty: 'normal',
            powerUps: true,
            mapStyle: 'classic',
            cellSize: 20,
            snakeColor: 'lime',
            foodColor: 'red',
            backgroundColor: 'black',
            borderColor: 'white'
        };
        
        // Load saved options from localStorage if available
        const savedOptions = localStorage.getItem('snakeGameOptions');
        if (savedOptions) {
            try {
                const parsedOptions = JSON.parse(savedOptions);
                this.gameOptions = {...this.gameOptions, ...parsedOptions};
            } catch (e) {
                console.error('Failed to parse saved game options:', e);
            }
        }
        
        // Matchmaking state
        this.isMatchmaking = false;
        this.matchmakingTimer = null;
        this.matchmakingInterval = null;
        
        // Stats dashboard
        this.dashboard = null;
    }

    async getHtml() {
        return `
            <div class="view-container game-view fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1 class="section-title"><i class="bi bi-controller me-2"></i>Snake</h1>
                    <div class="btn-group">
                        <button id="game-settings-btn" class="btn btn-outline-primary">
                            <i class="bi bi-gear me-1"></i> Settings
                        </button>
                        <button id="game-stats-btn" class="btn btn-outline-secondary">
                            <i class="bi bi-bar-chart me-1"></i> Stats
                        </button>
                        <button id="game-matchmaking-btn" class="btn btn-outline-success">
                            <i class="bi bi-people me-1"></i> Multiplayer
                        </button>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-lg-9">
                        <!-- Game Canvas Container -->
                        <div id="game-container" class="text-center mb-4">
                            <canvas id="snake-canvas" width="800" height="600" class="rounded border border-secondary"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-3">
                        <!-- Quick Settings Panel -->
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Quick Settings</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">Difficulty</label>
                                    <div class="btn-group w-100" role="group">
                                        <input type="radio" class="btn-check" name="difficulty" id="easy-btn" value="easy">
                                        <label class="btn btn-outline-success" for="easy-btn">Easy</label>
                                        
                                        <input type="radio" class="btn-check" name="difficulty" id="normal-btn" value="normal" checked>
                                        <label class="btn btn-outline-primary" for="normal-btn">Normal</label>
                                        
                                        <input type="radio" class="btn-check" name="difficulty" id="hard-btn" value="hard">
                                        <label class="btn btn-outline-danger" for="hard-btn">Hard</label>
                                    </div>
                                </div>
                                
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" id="power-ups-switch" checked>
                                    <label class="form-check-label" for="power-ups-switch">Power-ups</label>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Map Style</label>
                                    <select id="map-style-select" class="form-select">
                                        <option value="classic" selected>Classic</option>
                                        <option value="maze">Maze</option>
                                        <option value="open">Wrap Around</option>
                                    </select>
                                </div>
                                
                                <button id="apply-settings-btn" class="btn btn-primary w-100">
                                    <i class="bi bi-check-circle me-1"></i> Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Modal -->
                <div class="modal fade" id="game-stats-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-fullscreen">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"><i class="bi bi-bar-chart me-2"></i>Snake Statistics</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="stats-dashboard-container">
                                <!-- Dashboard will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Settings Modal -->
                <div class="modal fade" id="game-settings-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"><i class="bi bi-gear me-2"></i>Game Settings</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <ul class="nav nav-tabs" id="settingsTabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="gameplay-tab" data-bs-toggle="tab" data-bs-target="#gameplay-panel" type="button" role="tab" aria-controls="gameplay-panel" aria-selected="true">Gameplay</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="visual-tab" data-bs-toggle="tab" data-bs-target="#visual-panel" type="button" role="tab" aria-controls="visual-panel" aria-selected="false">Appearance</button>
                                    </li>
                                </ul>
                                
                                <div class="tab-content mt-3">
                                    <div class="tab-pane fade show active" id="gameplay-panel" role="tabpanel" aria-labelledby="gameplay-tab">
                                        <div class="row mb-4">
                                            <div class="col-md-4">
                                                <h5>Difficulty</h5>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="settingsDifficulty" id="settings-easy" value="easy">
                                                    <label class="form-check-label" for="settings-easy">
                                                        Easy <span class="text-muted">- Slower snake speed</span>
                                                    </label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="settingsDifficulty" id="settings-normal" value="normal" checked>
                                                    <label class="form-check-label" for="settings-normal">
                                                        Normal <span class="text-muted">- Standard speed</span>
                                                    </label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="settingsDifficulty" id="settings-hard" value="hard">
                                                    <label class="form-check-label" for="settings-hard">
                                                        Hard <span class="text-muted">- Faster snake speed</span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-4">
                                                <h5>Map Style</h5>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="settingsMapStyle" id="settings-classic" value="classic" checked>
                                                    <label class="form-check-label" for="settings-classic">
                                                        Classic <span class="text-muted">- Standard walls</span>
                                                    </label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="settingsMapStyle" id="settings-maze" value="maze">
                                                    <label class="form-check-label" for="settings-maze">
                                                        Maze <span class="text-muted">- Obstacles inside</span>
                                                    </label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="settingsMapStyle" id="settings-open" value="open">
                                                    <label class="form-check-label" for="settings-open">
                                                        Wrap Around <span class="text-muted">- No walls</span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-4">
                                                <h5>Game Features</h5>
                                                <div class="form-check form-switch">
                                                    <input class="form-check-input" type="checkbox" id="settings-power-ups" checked>
                                                    <label class="form-check-label" for="settings-power-ups">
                                                        Power-ups
                                                    </label>
                                                </div>
                                                <div class="mt-3">
                                                    <label class="form-label">Cell Size</label>
                                                    <input type="range" class="form-range" min="10" max="30" step="5" id="settings-cell-size" value="20">
                                                    <div class="d-flex justify-content-between">
                                                        <span class="badge bg-secondary">Small</span>
                                                        <span class="badge bg-secondary">Medium</span>
                                                        <span class="badge bg-secondary">Large</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="tab-pane fade" id="visual-panel" role="tabpanel" aria-labelledby="visual-panel-tab">
                                        <div class="row mb-4">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="settings-snake-color" class="form-label">Snake Color</label>
                                                    <input type="color" class="form-control form-control-color w-100" id="settings-snake-color" value="#00ff00">
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label for="settings-food-color" class="form-label">Food Color</label>
                                                    <input type="color" class="form-control form-control-color w-100" id="settings-food-color" value="#ff0000">
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label for="settings-background-color" class="form-label">Background Color</label>
                                                    <input type="color" class="form-control form-control-color w-100" id="settings-background-color" value="#000000">
                                                </div>
                                                
                                                <div class="mb-3">
                                                    <label for="settings-border-color" class="form-label">Border Color</label>
                                                    <input type="color" class="form-control form-control-color w-100" id="settings-border-color" value="#ffffff">
                                                </div>
                                            </div>
                                            
                                            <div class="col-12 mt-3">
                                                <div class="d-flex justify-content-center">
                                                    <div class="preview-box border p-2 text-center">
                                                        <h6>Preview</h6>
                                                        <canvas id="preview-canvas" width="200" height="100"></canvas>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-settings-btn">Save Settings</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Matchmaking Modal -->
                <div class="modal fade" id="matchmaking-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"><i class="bi bi-people me-2"></i>Multiplayer Matchmaking</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body text-center">
                                <div id="matchmaking-searching">
                                    <div class="spinner-border text-primary mb-3" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <h4>Looking for opponent...</h4>
                                    <p class="text-muted" id="matchmaking-time">00:00</p>
                                    <div class="progress mb-3">
                                        <div id="matchmaking-progress" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                                    </div>
                                </div>
                                
                                <div id="matchmaking-found" style="display: none;">
                                    <div class="alert alert-success mb-4">
                                        <i class="bi bi-check-circle-fill me-2"></i>
                                        Opponent found!
                                    </div>
                                    
                                    <div class="d-flex justify-content-center align-items-center mb-4">
                                        <div class="text-center me-4">
                                            <img src="/src/assets/images/default-avatar.png" class="rounded-circle mb-2" width="80" height="80">
                                            <h5 class="mb-0">You</h5>
                                        </div>
                                        
                                        <div class="mx-3">
                                            <span class="badge bg-primary rounded-pill px-3 py-2">VS</span>
                                        </div>
                                        
                                        <div class="text-center ms-4">
                                            <img src="/src/assets/images/default-avatar.png" class="rounded-circle mb-2" width="80" height="80" id="opponent-avatar">
                                            <h5 class="mb-0" id="opponent-name">Opponent</h5>
                                        </div>
                                    </div>
                                    
                                    <p>Game starting in <span id="countdown-timer">5</span> seconds...</p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger" id="cancel-matchmaking-btn">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    afterRender() {
        // Get canvas and initialize game
        this.canvas = document.getElementById('snake-canvas');
        this.resizeCanvas();
        
        // Initialize the snake game with saved options
        this.snake = new Snake(this.canvas, this.gameOptions);
        
        // Listen for game over events
        document.addEventListener('snakeGameOver', this.handleGameOver.bind(this));
        
        // Set up event listeners for all controls
        this.setupEventListeners();
        
        // Set initial form values
        this.updateFormValues();
        
        // Handle window resize
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }
    
    setupEventListeners() {
        // Settings button and modal
        const settingsBtn = document.getElementById('game-settings-btn');
        const settingsModal = new bootstrap.Modal(document.getElementById('game-settings-modal'));
        
        settingsBtn.addEventListener('click', () => {
            this.updateSettingsModal();
            settingsModal.show();
        });
        
        // Stats button and modal
        const statsBtn = document.getElementById('game-stats-btn');
        const statsModal = new bootstrap.Modal(document.getElementById('game-stats-modal'));
        
        statsBtn.addEventListener('click', () => {
            if (!this.dashboard) {
                // Initialize dashboard when stats modal is first opened
                this.dashboard = new GameDashboard(
                    'stats-dashboard-container',
                    1, // Snake game type ID
                    this.getCurrentUserId() // Get current user ID from auth service
                );
            } else {
                // Refresh data if dashboard already exists
                this.dashboard.loadDashboardData();
            }
            statsModal.show();
        });
        
        // Matchmaking button and modal
        const matchmakingBtn = document.getElementById('game-matchmaking-btn');
        const matchmakingModal = new bootstrap.Modal(document.getElementById('matchmaking-modal'));
        
        matchmakingBtn.addEventListener('click', () => {
            matchmakingModal.show();
            this.startMatchmaking();
        });
        
        // Cancel matchmaking button
        const cancelMatchmakingBtn = document.getElementById('cancel-matchmaking-btn');
        cancelMatchmakingBtn.addEventListener('click', () => {
            this.cancelMatchmaking();
            matchmakingModal.hide();
        });
        
        // Quick settings form controls
        const difficultyBtns = document.querySelectorAll('input[name="difficulty"]');
        difficultyBtns.forEach(btn => {
            // Select the correct difficulty option based on the saved option
            if (btn.value === this.gameOptions.difficulty) {
                btn.checked = true;
            }
        });
        
        // Power-ups switch
        const powerUpsSwitch = document.getElementById('power-ups-switch');
        powerUpsSwitch.checked = this.gameOptions.powerUps;
        
        // Map style selector
        const mapStyleSelect = document.getElementById('map-style-select');
        mapStyleSelect.value = this.gameOptions.mapStyle;
        
        // Apply quick settings button
        const applySettingsBtn = document.getElementById('apply-settings-btn');
        applySettingsBtn.addEventListener('click', () => {
            const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
            const powerUpsEnabled = document.getElementById('power-ups-switch').checked;
            const mapStyle = document.getElementById('map-style-select').value;
            
            // Update game options
            this.gameOptions.difficulty = selectedDifficulty;
            this.gameOptions.powerUps = powerUpsEnabled;
            this.gameOptions.mapStyle = mapStyle;
            
            // Save options to localStorage
            localStorage.setItem('snakeGameOptions', JSON.stringify(this.gameOptions));
            
            // Apply changes to the game
            this.snake.updateOptions(this.gameOptions);
            
            // Show confirmation toast
            this.showToast('Settings applied!');
        });
        
        // Save settings from modal
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            settingsModal.hide();
        });
        
        // Preview canvas in settings modal
        const previewCanvas = document.getElementById('preview-canvas');
        if (previewCanvas) {
            // Draw a simple preview when color inputs change
            const colorInputs = document.querySelectorAll('#visual-panel input[type="color"]');
            colorInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.updatePreview();
                });
            });
            
            // Initial preview
            this.updatePreview();
        }
    }
    
    getCurrentUserId() {
        // Get the current user ID from your auth service
        // This is just a placeholder - implement according to your auth system
        return 1;
    }
    
    handleGameOver(event) {
        const gameData = event.detail;
        
        // Record game session in database
        const metadata = {
            difficulty: this.gameOptions.difficulty,
            mapStyle: this.gameOptions.mapStyle,
            powerUpsEnabled: this.gameOptions.powerUps,
            result: gameData.score > this.getHighScore() ? 'win' : 'loss'
        };
        
        StatsService.recordGameSession(
            1, // Snake game type ID
            this.getCurrentUserId(),
            gameData.score,
            metadata
        ).catch(err => console.error('Failed to record game session:', err));
        
        // Show game over message
        setTimeout(() => {
            this.showToast(`Game over! Score: ${gameData.score}`);
        }, 1000);
    }
    
    resizeCanvas() {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;
        
        const maxWidth = gameContainer.offsetWidth;
        
        // Scale the canvas with a max width of 800px
        let canvasWidth = Math.min(800, maxWidth);
        let canvasHeight = (canvasWidth / 4) * 3; // 4:3 aspect ratio
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // If the game is already initialized, restart it with new dimensions
        if (this.snake) {
            this.snake.cleanup();
            this.snake = new Snake(this.canvas, this.gameOptions);
        }
    }
    
    updateFormValues() {
        // Update quick settings
        const difficultyBtns = document.querySelectorAll('input[name="difficulty"]');
        difficultyBtns.forEach(btn => {
            btn.checked = (btn.value === this.gameOptions.difficulty);
        });
        
        const powerUpsSwitch = document.getElementById('power-ups-switch');
        if (powerUpsSwitch) {
            powerUpsSwitch.checked = this.gameOptions.powerUps;
        }
        
        const mapStyleSelect = document.getElementById('map-style-select');
        if (mapStyleSelect) {
            mapStyleSelect.value = this.gameOptions.mapStyle;
        }
    }
    
    updateSettingsModal() {
        // Update difficulty radio buttons
        const difficultyRadios = document.querySelectorAll('input[name="settingsDifficulty"]');
        difficultyRadios.forEach(radio => {
            radio.checked = (radio.value === this.gameOptions.difficulty);
        });
        
        // Update map style radio buttons
        const mapStyleRadios = document.querySelectorAll('input[name="settingsMapStyle"]');
        mapStyleRadios.forEach(radio => {
            radio.checked = (radio.value === this.gameOptions.mapStyle);
        });
        
        // Update power-ups checkbox
        const powerUpsCheck = document.getElementById('settings-power-ups');
        if (powerUpsCheck) {
            powerUpsCheck.checked = this.gameOptions.powerUps;
        }
        
        // Update cell size slider
        const cellSizeSlider = document.getElementById('settings-cell-size');
        if (cellSizeSlider) {
            cellSizeSlider.value = this.gameOptions.cellSize;
        }
        
        // Update color pickers
        const snakeColorPicker = document.getElementById('settings-snake-color');
        if (snakeColorPicker) {
            snakeColorPicker.value = this.gameOptions.snakeColor;
        }
        
        const foodColorPicker = document.getElementById('settings-food-color');
        if (foodColorPicker) {
            foodColorPicker.value = this.gameOptions.foodColor;
        }
        
        const backgroundColorPicker = document.getElementById('settings-background-color');
        if (backgroundColorPicker) {
            backgroundColorPicker.value = this.gameOptions.backgroundColor;
        }
        
        const borderColorPicker = document.getElementById('settings-border-color');
        if (borderColorPicker) {
            borderColorPicker.value = this.gameOptions.borderColor;
        }
        
        // Update preview
        this.updatePreview();
    }
    
    updatePreview() {
        const previewCanvas = document.getElementById('preview-canvas');
        if (!previewCanvas) return;
        
        const ctx = previewCanvas.getContext('2d');
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        
        // Get current color values from the form
        const snakeColor = document.getElementById('settings-snake-color').value;
        const foodColor = document.getElementById('settings-food-color').value;
        const backgroundColor = document.getElementById('settings-background-color').value;
        const borderColor = document.getElementById('settings-border-color').value;
        
        // Draw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw simple snake
        ctx.fillStyle = snakeColor;
        ctx.fillRect(50, 50, 20, 20);
        ctx.fillRect(70, 50, 20, 20);
        ctx.fillRect(90, 50, 20, 20);
        
        // Draw borders
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(50, 50, 20, 20);
        ctx.strokeRect(70, 50, 20, 20);
        ctx.strokeRect(90, 50, 20, 20);
        
        // Draw food
        ctx.fillStyle = foodColor;
        ctx.beginPath();
        ctx.arc(140, 50, 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    saveSettings() {
        // Collect values from the form
        const difficulty = document.querySelector('input[name="settingsDifficulty"]:checked').value;
        const mapStyle = document.querySelector('input[name="settingsMapStyle"]:checked').value;
        const powerUps = document.getElementById('settings-power-ups').checked;
        const cellSize = parseInt(document.getElementById('settings-cell-size').value);
        
        // Color values
        const snakeColor = document.getElementById('settings-snake-color').value;
        const foodColor = document.getElementById('settings-food-color').value;
        const backgroundColor = document.getElementById('settings-background-color').value;
        const borderColor = document.getElementById('settings-border-color').value;
        
        // Update game options
        this.gameOptions = {
            difficulty,
            mapStyle,
            powerUps,
            cellSize,
            snakeColor,
            foodColor,
            backgroundColor,
            borderColor
        };
        
        // Save options to localStorage
        localStorage.setItem('snakeGameOptions', JSON.stringify(this.gameOptions));
        
        // Update quick settings form
        this.updateFormValues();
        
        // Apply changes to the game
        this.snake.updateOptions(this.gameOptions);
        
        // Show confirmation toast
        this.showToast('Settings saved successfully!');
    }
    
    startMatchmaking() {
        // Reset matchmaking UI
        document.getElementById('matchmaking-searching').style.display = 'block';
        document.getElementById('matchmaking-found').style.display = 'none';
        document.getElementById('matchmaking-time').textContent = '00:00';
        document.getElementById('matchmaking-progress').style.width = '0%';
        
        // Set matchmaking state
        this.isMatchmaking = true;
        this.matchmakingStartTime = Date.now();
        
        // Start matchmaking timer
        this.matchmakingTimer = 0;
        this.matchmakingInterval = setInterval(() => {
            this.matchmakingTimer++;
            
            // Update timer display (MM:SS format)
            const minutes = Math.floor(this.matchmakingTimer / 60);
            const seconds = this.matchmakingTimer % 60;
            document.getElementById('matchmaking-time').textContent = 
                `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            // Update progress bar (fills over 30 seconds)
            const progress = Math.min((this.matchmakingTimer / 30) * 100, 100);
            document.getElementById('matchmaking-progress').style.width = `${progress}%`;
            
            // Simulate finding a match after some random time between 5-15 seconds
            if (this.matchmakingTimer === Math.floor(Math.random() * 11) + 5) {
                this.matchFound();
            }
        }, 1000);
    }
    
    matchFound() {
        // Stop the matchmaking timer
        clearInterval(this.matchmakingInterval);
        
        // Update UI
        document.getElementById('matchmaking-searching').style.display = 'none';
        document.getElementById('matchmaking-found').style.display = 'block';
        
        // Randomly select opponent name
        const opponentNames = [
            'Player254', 'GameMaster42', 'SnakeWrangler', 'VelocityViper',
            'PixelPuncher', 'ByteBaron', 'QueueQueen', 'CodeCobra'
        ];
        const randomName = opponentNames[Math.floor(Math.random() * opponentNames.length)];
        document.getElementById('opponent-name').textContent = randomName;
        
        // Start countdown
        let countdown = 5;
        document.getElementById('countdown-timer').textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('countdown-timer').textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // In a real app, this would start a multiplayer game
                // For now, we'll just close the modal and show a message
                const matchmakingModal = bootstrap.Modal.getInstance(document.getElementById('matchmaking-modal'));
                matchmakingModal.hide();
                this.showToast(`Multiplayer match started against ${randomName}!`);
                
                // Reset matchmaking state
                this.isMatchmaking = false;
            }
        }, 1000);
    }
    
    cancelMatchmaking() {
        if (this.matchmakingInterval) {
            clearInterval(this.matchmakingInterval);
            this.isMatchmaking = false;
        }
    }
    
    beforeDestroy() {
        // Clean up game resources
        if (this.snake) {
            this.snake.cleanup();
        }
        
        // Remove event listeners
        document.removeEventListener('snakeGameOver', this.handleGameOver);
        
        // Cancel any matchmaking
        this.cancelMatchmaking();
        
        // Remove window resize listener
        window.removeEventListener('resize', this.resizeCanvas);
    }
}