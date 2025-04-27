import AbstractView from './AbstractView.js';
import RockPaperScissorsGame from '../games/RockPaperScissors.js';
import GameDashboard from '../components/GameDashboard.js';
import StatsService from '../services/StatsService.js';

export default class RockPaperScissorsGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Rock Paper Scissors');
        this.game = null;
        this.dashboard = null;
    }

    async getHtml() {
        return `
            <div class="view-container game-view fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1 class="section-title"><i class="bi bi-controller me-2"></i>Rock Paper Scissors</h1>
                    <div class="btn-group">
                        <button id="btn-start-1p" class="btn btn-success">
                            <i class="bi bi-person me-1"></i> VS Computer
                        </button>
                        <button id="btn-start-2p" class="btn btn-primary">
                            <i class="bi bi-people me-1"></i> 2 Players
                        </button>
                        <button id="btn-stats" class="btn btn-secondary">
                            <i class="bi bi-bar-chart me-1"></i> Stats
                        </button>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-9">
                        <div id="game-container" class="text-center mb-4">
                            <canvas id="rps-canvas" width="800" height="600" 
                                class="rounded border border-secondary"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-3">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Game Info</h5>
                            </div>
                            <div class="card-body">
                                <div class="score-display mb-4">
                                    <h6>Current Score:</h6>
                                    <div class="d-flex justify-content-around align-items-center">
                                        <div class="text-center">
                                            <div class="h4 mb-0" id="player1-score">0</div>
                                            <small>Player 1</small>
                                        </div>
                                        <div class="h4">-</div>
                                        <div class="text-center">
                                            <div class="h4 mb-0" id="player2-score">0</div>
                                            <small id="player2-label">Computer</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="game-status mb-4">
                                    <h6>Status:</h6>
                                    <p id="game-status" class="mb-0">Ready to start</p>
                                </div>
                                
                                <hr>
                                
                                <div class="d-grid gap-2">
                                    <button id="btn-restart" class="btn btn-outline-primary">
                                        <i class="bi bi-arrow-clockwise"></i> New Game
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
                                    <i class="bi bi-bar-chart me-2"></i>Rock Paper Scissors Statistics
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
        const canvas = document.getElementById('rps-canvas');
        this.game = new RockPaperScissorsGame(canvas);
        
        // Set up event listeners for game controls
        this.setupEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        
        // Update UI elements
        this.updateScoreDisplay(0, 0);
        this.updateGameStatus('Choose a game mode to start');
    }
    
    setupEventListeners() {
        // Game mode buttons
        document.getElementById('btn-start-1p').addEventListener('click', () => {
            this.startGame(true);
        });
        
        document.getElementById('btn-start-2p').addEventListener('click', () => {
            this.startGame(false);
        });
        
        // Stats button and modal
        const statsBtn = document.getElementById('btn-stats');
        const statsModal = new bootstrap.Modal(document.getElementById('stats-modal'));
        
        statsBtn.addEventListener('click', () => {
            if (!this.dashboard) {
                this.dashboard = new GameDashboard(
                    'stats-dashboard-container',
                    3, // Rock Paper Scissors game type ID
                    this.getCurrentUserId()
                );
            } else {
                this.dashboard.loadDashboardData();
            }
            statsModal.show();
        });
        
        // Restart button
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.startGame(this.game.singlePlayerMode);
        });
        
        // Listen for game events
        document.addEventListener('rpsGameOver', this.handleGameOver.bind(this));
        document.addEventListener('rpsRoundComplete', this.handleRoundComplete.bind(this));
    }
    
    startGame(singlePlayer = true) {
        // Reset and start the game
        this.game.start(singlePlayer);
        
        // Update UI
        this.updateScoreDisplay(0, 0);
        this.updateGameStatus(singlePlayer ? 'Choose your move' : 'Player 1: Choose your move');
        document.getElementById('player2-label').textContent = singlePlayer ? 'Computer' : 'Player 2';
        
        // Update active button states
        document.getElementById('btn-start-1p').classList.toggle('active', singlePlayer);
        document.getElementById('btn-start-2p').classList.toggle('active', !singlePlayer);
    }
    
    handleGameOver(event) {
        const gameData = event.detail;
        
        // Record game session in database
        const metadata = {
            singlePlayer: this.game.singlePlayerMode,
            roundsPlayed: this.game.roundCount,
            result: gameData.winner === 'player1' ? 'win' : 
                   gameData.winner === 'player2' ? 'loss' : 'draw'
        };
        
        StatsService.recordGameSession(
            3, // Rock Paper Scissors game type ID
            this.getCurrentUserId(),
            gameData.score.player1,
            metadata,
            this.game.singlePlayerMode ? [] : [{
                userId: 2, // Player 2 ID (you should implement proper user handling)
                score: gameData.score.player2,
                result: gameData.winner === 'player2' ? 'win' : 
                       gameData.winner === 'player1' ? 'loss' : 'draw'
            }]
        ).catch(err => console.error('Failed to record game session:', err));
        
        // Update UI
        this.updateGameStatus(
            gameData.winner === 'player1' ? 'Player 1 wins the game!' :
            gameData.winner === 'player2' ? (this.game.singlePlayerMode ? 'Computer wins the game!' : 'Player 2 wins the game!') :
            "It's a draw!"
        );
    }
    
    handleRoundComplete(event) {
        const roundData = event.detail;
        
        // Update score display
        this.updateScoreDisplay(roundData.score.player1, roundData.score.player2);
        
        // Update game status
        if (roundData.result === 'draw') {
            this.updateGameStatus("It's a draw! Next round...");
        } else {
            const winner = roundData.result === 'player1' ? 'Player 1' : 
                          (this.game.singlePlayerMode ? 'Computer' : 'Player 2');
            this.updateGameStatus(`${winner} wins this round!`);
        }
    }
    
    updateScoreDisplay(player1Score, player2Score) {
        document.getElementById('player1-score').textContent = player1Score;
        document.getElementById('player2-score').textContent = player2Score;
    }
    
    updateGameStatus(message) {
        document.getElementById('game-status').textContent = message;
    }
    
    handleResize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const maxWidth = container.offsetWidth;
        const canvasWidth = Math.min(800, maxWidth);
        const canvasHeight = (canvasWidth / 4) * 3; // Maintain 4:3 aspect ratio
        
        const canvas = document.getElementById('rps-canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Reinitialize game with new dimensions if needed
        if (this.game) {
            this.game.stop();
            this.game = new RockPaperScissorsGame(canvas);
        }
    }
    
    getCurrentUserId() {
        // Get the current user ID from your auth service
        // This is just a placeholder - implement according to your auth system
        return 1;
    }
    
    beforeDestroy() {
        // Clean up game resources
        if (this.game) {
            this.game.stop();
        }
        
        // Remove event listeners
        document.removeEventListener('rpsGameOver', this.handleGameOver);
        document.removeEventListener('rpsRoundComplete', this.handleRoundComplete);
        window.removeEventListener('resize', this.handleResize);
    }
}