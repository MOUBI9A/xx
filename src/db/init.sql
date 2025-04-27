-- Initialize database with tables for users, games, matches, stats, and more

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Game types
CREATE TABLE IF NOT EXISTS game_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default game types
INSERT INTO game_types (name, description) VALUES
('Pong', 'Classic Pong game'),
('TicTacToe', 'Tic Tac Toe game'),
('RockPaperScissors', 'Rock Paper Scissors game')
ON CONFLICT (name) DO NOTHING;

-- User statistics
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    rank_points INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

-- Game-specific statistics
CREATE TABLE IF NOT EXISTS game_specific_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type_id INTEGER NOT NULL REFERENCES game_types(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    highest_score INTEGER,
    best_time INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, game_type_id)
);

-- Game sessions (represents a game instance)
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    game_type_id INTEGER NOT NULL REFERENCES game_types(id),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER,
    winner_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'completed', -- 'active', 'completed', 'abandoned'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB, -- Additional game-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game participants (for multiplayer games)
CREATE TABLE IF NOT EXISTS game_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    result VARCHAR(10), -- 'win', 'loss', 'draw'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (session_id, user_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    criteria JSONB, -- JSON criteria for unlocking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon) VALUES
('First Win', 'Win your first game', 'trophy.png'),
('Veteran', 'Play 50 games total', 'medal.png'),
('Quick Learner', 'Play all available games', 'star.png'),
('Social Butterfly', 'Add 5 friends', 'friends.png'),
('Undefeated', 'Win 10 games in a row', 'crown.png')
ON CONFLICT (name) DO NOTHING;

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, achievement_id)
);

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, friend_id),
    CHECK (user_id != friend_id) -- Prevent self-friendships
);

-- Tournament system
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    game_type_id INTEGER NOT NULL REFERENCES game_types(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
    max_participants INTEGER,
    rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'active', 'eliminated', 'winner'
    seed INTEGER,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, user_id)
);

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    game_session_id INTEGER REFERENCES game_sessions(id),
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    winner_id INTEGER REFERENCES users(id),
    scheduled_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, round, match_number)
);

-- Create indexes for better performance
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_participants_session_id ON game_participants(session_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);

-- Function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger for user_stats table
CREATE TRIGGER update_user_stats_modtime
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger for friendships table
CREATE TRIGGER update_friendships_modtime
    BEFORE UPDATE ON friendships
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger for tournaments table
CREATE TRIGGER update_tournaments_modtime
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger for tournament_matches table
CREATE TRIGGER update_tournament_matches_modtime
    BEFORE UPDATE ON tournament_matches
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Sample data (optional) - comment out for production
-- INSERT INTO users (username, email, password_hash, display_name) VALUES
-- ('admin', 'admin@example.com', 'hash', 'Admin User'),
-- ('player1', 'player1@example.com', 'hash', 'Player One'),
-- ('player2', 'player2@example.com', 'hash', 'Player Two');