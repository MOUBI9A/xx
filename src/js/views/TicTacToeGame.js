import AbstractView from './AbstractView.js';
import TicTacToe from '../games/TicTacToe.js';
import GameDashboard from '../components/GameDashboard.js';
import StatsService from '../services/StatsService.js';

export default class TicTacToeGameView extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle('Game Hub - Tic Tac Toe');
        this.game = null;
        this.dashboard = null;
    }

    async getHtml() {
        return `
            <div class="view-container game-view fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1 class="section-title"><i class="bi bi-controller me-2"></i>Tic Tac Toe</h1>
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
                            <canvas id="tictactoe-canvas" width="600" height="600" 
                                class="rounded border border-secondary"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-3">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Game Info</h5>
                            </div>
                            <div class="card-body">
                                <div class="game-status mb-4">
                                    <h6>Status:</h6>
                                    <p id="game-status" class="mb-0">Ready to start</p>
                                </div>
                                
                                <div class="current-player mb-4">
                                    <h6>Current Turn:</h6>
                                    <div class="d-flex align-items-center">
                                        <div class="h4 mb-0 me-2" id="current-symbol">X</div>
                                        <div id="current-player">Player 1</div>
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <div class="d-grid gap-2">
                                    <button id="btn-restart" class="btn btn-outline-primary">
                                        <i class="bi bi-arrow-clockwise"></i> New Game
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mt-3">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0">AI Difficulty</h5>
                            </div>
                            <div class="card-body">
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="ai-difficulty" id="easy-btn" value="easy">
                                    <label class="btn btn-outline-success" for="easy-btn">Easy</label>
                                    
                                    <input type="radio" class="btn-check" name="ai-difficulty" id="normal-btn" value="normal" checked>
                                    <label class="btn btn-outline-primary" for="normal-btn">Normal</label>
                                    
                                    <input type="radio" class="btn-check" name="ai-difficulty" id="hard-btn" value="hard">
                                    <label class="btn btn-outline-danger" for="hard-btn">Hard</label>
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
                                    <i class="bi bi-bar-chart me-2"></i>Tic Tac Toe Statistics
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
        const canvas = document.getElementById('tictactoe-canvas');
        this.game = new TicTacToe(canvas);
        
        // Set up event listeners for game controls
        this.setupEventListeners();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        
        // Update UI elements
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
                    4, // Tic Tac Toe game type ID
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
        
        // AI difficulty buttons
        const difficultyBtns = document.querySelectorAll('input[name="ai-difficulty"]');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('change', (e) => {
                if (this.game.singlePlayerMode) {
                    this.game.setAIDifficulty(e.target.value);
                }
            });
        });
        
        // Listen for game events
        document.addEventListener('tictactoeGameOver', this.handleGameOver.bind(this));
        document.addEventListener('tictactoeMove', this.handleMove.bind(this));
    }
    
    startGame(singlePlayer = true) {
        // Get current AI difficulty if in single player mode
        const difficulty = singlePlayer ? 
            document.querySelector('input[name="ai-difficulty"]:checked').value :
            'normal';
        
        // Reset and start the game
        this.game.start(singlePlayer);
        if (singlePlayer) {
            this.game.setAIDifficulty(difficulty);
        }
        
        // Update UI
        this.updateGameStatus(singlePlayer ? 'Your turn (X)' : 'Player 1\'s turn (X)');
        this.updateCurrentPlayer('X', singlePlayer ? 'You' : 'Player 1');
        
        // Update active button states
        document.getElementById('btn-start-1p').classList.toggle('active', singlePlayer);
        document.getElementById('btn-start-2p').classList.toggle('active', !singlePlayer);
    }
    
    handleGameOver(event) {
        const gameData = event.detail;
        
        // Record game session in database
        const metadata = {
            singlePlayer: this.game.singlePlayerMode,
            aiDifficulty: this.game.singlePlayerMode ? 
                document.querySelector('input[name="ai-difficulty"]:checked').value :
                null,
            result: gameData.winner ? 
                (gameData.winner === 'X' ? 'win' : 'loss') : 
                'draw'
        };
        
        StatsService.recordGameSession(
            4, // Tic Tac Toe game type ID
            this.getCurrentUserId(),
            metadata.result === 'win' ? 1 : 0,
            metadata,
            this.game.singlePlayerMode ? [] : [{
                userId: 2, // Player 2 ID (you should implement proper user handling)
                score: metadata.result === 'loss' ? 1 : 0,
                result: metadata.result === 'win' ? 'loss' : 
                        metadata.result === 'loss' ? 'win' : 'draw'
            }]
        ).catch(err => console.error('Failed to record game session:', err));
        
        // Update UI
        if (gameData.winner) {
            const winnerText = gameData.winner === 'X' ? 
                (this.game.singlePlayerMode ? 'You win!' : 'Player 1 wins!') :
                (this.game.singlePlayerMode ? 'Computer wins!' : 'Player 2 wins!');
            this.updateGameStatus(winnerText);
        } else {
            this.updateGameStatus("It's a draw!");
        }
    }
    
    handleMove(event) {
        const moveData = event.detail;
        
        // Update current player display
        if (this.game.singlePlayerMode) {
            this.updateCurrentPlayer(
                moveData.nextPlayer,
                moveData.nextPlayer === 'X' ? 'You' : 'Computer'
            );
            this.updateGameStatus(
                moveData.nextPlayer === 'X' ? 'Your turn' : 'Computer thinking...'
            );
        } else {
            this.updateCurrentPlayer(
                moveData.nextPlayer,
                moveData.nextPlayer === 'X' ? 'Player 1' : 'Player 2'
            );
            this.updateGameStatus(`Player ${moveData.nextPlayer === 'X' ? '1' : '2'}'s turn`);
        }
    }
    
    updateGameStatus(message) {
        document.getElementById('game-status').textContent = message;
    }
    
    updateCurrentPlayer(symbol, player) {
        document.getElementById('current-symbol').textContent = symbol;
        document.getElementById('current-player').textContent = player;
    }
    
    handleResize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const maxWidth = container.offsetWidth;
        const size = Math.min(600, maxWidth);
        
        const canvas = document.getElementById('tictactoe-canvas');
        canvas.width = size;
        canvas.height = size;
        
        // Reinitialize game with new dimensions if needed
        if (this.game) {
            this.game.stop();
            this.game = new TicTacToe(canvas);
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
        document.removeEventListener('tictactoeGameOver', this.handleGameOver);
        document.removeEventListener('tictactoeMove', this.handleMove);
        window.removeEventListener('resize', this.handleResize);
    }
}