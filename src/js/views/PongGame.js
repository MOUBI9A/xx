import AbstractView from './AbstractView.js';
import PongGame from '../games/Pong.js';
import GameDashboard from '../components/GameDashboard.js';
import StatsService from '../services/StatsService.js';
import AuthService from '../services/AuthService.js';

export default class PongGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Pong');
        this.game = null;
        this.dashboard = null;
    }

    async getHtml() {
        return `
            <div class="view-container game-view fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1 class="section-title"><i class="bi bi-controller me-2"></i>Pong</h1>
                    <div class="btn-group">
                        <button id="btn-start-1p" class="btn btn-success">
                            <i class="bi bi-person me-1"></i> 1P Game
                        </button>
                        <button id="btn-start-2p" class="btn btn-primary">
                            <i class="bi bi-people me-1"></i> 2P Game
                        </button>
                        <button id="btn-start-4p" class="btn btn-danger">
                            <i class="bi bi-people-fill me-1"></i> 4P Game
                        </button>
                        <button id="btn-tournament" class="btn btn-warning">
                            <i class="bi bi-trophy me-1"></i> Tournament
                        </button>
                        <button id="btn-stats" class="btn btn-secondary">
                            <i class="bi bi-bar-chart me-1"></i> Stats
                        </button>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-9">
                        <div id="game-container" class="text-center mb-4">
                            <canvas id="pong-canvas" width="800" height="400" 
                                class="rounded border border-secondary"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-3">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Game Controls</h5>
                            </div>
                            <div class="card-body">
                                <div id="controls-standard">
                                    <h6>Player 1:</h6>
                                    <p class="mb-3">A/D keys to move up/down</p>
                                    
                                    <h6>Player 2:</h6>
                                    <p class="mb-3">T/G keys to move up/down</p>
                                </div>
                                
                                <div id="controls-4p" style="display: none;">
                                    <h6 class="text-primary">Team 1:</h6>
                                    <p>Player 1: A/D keys (left paddle)</p>
                                    <p class="mb-3">Player 3: ↑/↓ arrow keys (top paddle)</p>
                                    
                                    <h6 class="text-danger">Team 2:</h6>
                                    <p>Player 2: T/G keys (right paddle)</p>
                                    <p class="mb-3">Player 4: 4/6 keys (bottom paddle)</p>
                                </div>
                                
                                <hr>
                                
                                <div class="d-grid gap-2">
                                    <button id="btn-pause" class="btn btn-outline-primary">
                                        <i class="bi bi-pause-fill"></i> Pause
                                    </button>
                                    <button id="btn-restart" class="btn btn-outline-secondary">
                                        <i class="bi bi-arrow-clockwise"></i> Restart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Modal -->
                <div class="modal fade" id="stats-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-fullscreen">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-bar-chart me-2"></i>Pong Statistics
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="stats-dashboard-container">
                                <!-- Dashboard will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    afterRender() {
        // Initialize game canvas
        const canvas = document.getElementById('pong-canvas');
        this.game = new PongGame(canvas);
        
        // Set up event listeners for game controls
        this.setupEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    setupEventListeners() {
        // Game mode buttons
        document.getElementById('btn-start-1p').addEventListener('click', () => {
            this.startGame('single');
            this.updateControlsDisplay(false);
        });
        
        document.getElementById('btn-start-2p').addEventListener('click', () => {
            this.startGame('duo');
            this.updateControlsDisplay(false);
        });
        
        document.getElementById('btn-start-4p').addEventListener('click', () => {
            this.startGame('quad');
            this.updateControlsDisplay(true);
        });
        
        document.getElementById('btn-tournament').addEventListener('click', () => {
            window.location.hash = '#/games/pong/tournament';
        });
        
        // Stats button and modal
        const statsBtn = document.getElementById('btn-stats');
        const statsModal = new bootstrap.Modal(document.getElementById('stats-modal'));
        
        statsBtn.addEventListener('click', () => {
            if (!this.dashboard) {
                this.dashboard = new GameDashboard(
                    'stats-dashboard-container',
                    'pong',
                    this.getCurrentUserId()
                );
            } else {
                this.dashboard.loadDashboardData();
            }
            statsModal.show();
        });
        
        // Game control buttons
        document.getElementById('btn-pause').addEventListener('click', () => {
            const btn = document.getElementById('btn-pause');
            if (this.game.gamePaused) {
                this.game.resume();
                btn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
            } else {
                this.game.pause();
                btn.innerHTML = '<i class="bi bi-play-fill"></i> Resume';
            }
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.startGame(this.game.gameMode);
        });
    }
    
    updateControlsDisplay(is4PlayerMode) {
        document.getElementById('controls-standard').style.display = is4PlayerMode ? 'none' : 'block';
        document.getElementById('controls-4p').style.display = is4PlayerMode ? 'block' : 'none';
    }
    
    startGame(gameMode) {
        // Get current user ID for stats tracking
        const userId = this.getCurrentUserId();
        
        // Determine if all players are humans (for 4-player mode)
        // This could be expanded to allow selecting AI vs human players
        const allHumans = gameMode === 'quad' && false; // Default to some AI players in 4-player mode
        
        // Reset and start the game
        this.game.start(gameMode, userId, allHumans);
        
        // Update pause button state
        const pauseBtn = document.getElementById('btn-pause');
        pauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
        
        // Update active button states
        document.getElementById('btn-start-1p').classList.toggle('active', gameMode === 'single');
        document.getElementById('btn-start-2p').classList.toggle('active', gameMode === 'duo');
        document.getElementById('btn-start-4p').classList.toggle('active', gameMode === 'quad');
    }
    
    handleResize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const maxWidth = container.offsetWidth;
        const canvasWidth = Math.min(800, maxWidth);
        const canvasHeight = canvasWidth / 2; // Maintain 2:1 aspect ratio
        
        const canvas = document.getElementById('pong-canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Reinitialize game with new dimensions if needed
        if (this.game) {
            const currentMode = this.game.gameMode;
            this.game.stop();
            this.game = new PongGame(canvas);
            if (currentMode) {
                // Restart with the same mode if game was already running
                this.startGame(currentMode);
            }
        }
    }
    
    getCurrentUserId() {
        // Get the current user ID from the auth service
        return AuthService.getCurrentUser()?.id || null;
    }
    
    beforeDestroy() {
        // Clean up game resources
        if (this.game) {
            this.game.stop();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
    }
}