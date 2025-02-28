// services/gameService.ts
import { Game, IGame } from '../models/gameModel';
import { Session } from '../models/gameSessionModel';
import { Player, Team, GameStatus, CellState, PlayerState, GamePlayers } from '../types/gameTypes';
import { Server, Socket } from 'socket.io';
import { SessionManager, SocketService } from './socketService';

interface GameJoinResult {
    game: ReturnType<IGame['toClientJSON']>;
    playerPosition: Player;
}

interface PlayerStateUpdate {
    sessionId: string | null;
    connected: boolean;
    lastActive: Date;
}

export class GameError extends Error {
    constructor(public code: number, message: string) {
        super(message);
        this.name = 'GameError';
    }
}

export class GameStateManager {
    constructor(private io: Server) {}

    async cleanupStalePlayers(game: IGame): Promise<boolean> {
        let wasChanged = false;
        try {
            // Convert to plain JavaScript object to remove Mongoose internals
            const gameData = game.toObject();
            
            // Get session IDs directly from the plain object
            const sessionIds = (Object.values(gameData.players) as PlayerState[])
                .filter((player) => player.sessionId !== null)
                .map((player) => player.sessionId) as string[];
            
            console.log("Found session IDs:", sessionIds);
            
            if (sessionIds.length === 0) return false;
    
            const existingSessions = await Session.find({ 
                sessionId: { $in: sessionIds } 
            });
            
            const validSessionIds = new Set(existingSessions.map(s => s.sessionId));
    
            const updates: Record<string, any> = {};
            
            Object.entries(gameData.players).forEach(([position, player]) => {
                const typedPlayer = player as PlayerState;
                if (typedPlayer.sessionId && !validSessionIds.has(typedPlayer.sessionId)) {
                    updates[`players.${position}`] = {
                        ...typedPlayer,
                        sessionId: null,
                        connected: false,
                        lastActive: new Date()
                    };
                    wasChanged = true;
                }
            });
    
            if (wasChanged) {
                // Atomic update
                await Game.findByIdAndUpdate(
                    game._id,
                    { $set: updates },
                    { new: true }
                );

                // Ensure we have the latest game state
                const updatedGame = await Game.findById(game._id);
                if (updatedGame) {
                    // Broadcast to all clients in the game room
                    this.io.to(game.gameCode).emit('gameStateUpdate', updatedGame.toClientJSON());
                    
                    // Also emit a specific stale player removal event
                    this.io.to(game.gameCode).emit('playerStateChanged', {
                        gameCode: game.gameCode,
                        updates: updates
                    });
                }
            }
    
            return wasChanged;
        } catch (error) {
            console.error('Error during cleanup:', error);
            // Attempt to recover and notify clients of the error
            this.io.to(game.gameCode).emit('gameError', {
                message: 'Error during player cleanup',
                gameCode: game.gameCode
            });
            return false;
        }
    }

    
    async handlePlayerStateChange(
        game: IGame,
        position: Player,
        updates: PlayerStateUpdate
    ): Promise<void> {
        if (!game.players[position]) return;

        try {
            // Update player state
            game.players[position] = {
                ...game.players[position],
                ...updates
            };

            // Save game state and notify clients
            await this.updateGameState(game, game.gameCode);
        } catch (error) {
            console.error(`Error updating player state for position ${position}:`, error);
            throw new Error('Failed to update player state');
        }
    }

    async updateGameState(game: IGame, gameCode: string): Promise<void> {
        if (!game) {
            console.log(`[GameStateManager] Cannot update null game state for ${gameCode}`);
            return;
        }
        
        try {
            await game.save();
            
            // Get connected socket count before broadcast
            const socketsInRoom = await this.io.in(gameCode).allSockets();
            const clientCount = socketsInRoom.size;
            
            console.log(`[GameStateManager] Broadcasting game state update for ${gameCode} to ${clientCount} clients`);
            console.log(`[GameStateManager] Game ${gameCode} player state: ${JSON.stringify(game.players)}`);
            
            // Log player connections
            const connectedPlayers = Object.entries(game.players || {})
                .filter(([_, player]) => player && player.connected) // Add null check here
                .map(([position, player]) => position);
                
            console.log(`[GameStateManager] Connected players in ${gameCode}: ${connectedPlayers.join(', ') || 'None'}`);
            
            // Create a trimmed version of client JSON for logging
            const clientJSON = game.toClientJSON();
            const logData = {
                gameCode: clientJSON.gameCode,
                status: clientJSON.status,
                currentTurn: clientJSON.currentTurn,
                players: clientJSON.players
            };
            
            console.log(`[GameStateManager] Emitting to room ${gameCode}: ${JSON.stringify(logData)}`);
            
            // Emit and track acknowledgements
            this.io.to(gameCode).emit('gameStateUpdate', game.toClientJSON());
        
            // ADDED: Also broadcast a game list update to all clients
            const games = await Game.find();
            this.io.emit('gameListUpdate', games.map(g => g.toClientJSON()));
            
            console.log(`[GameStateManager] Broadcasted game list update to all clients`);

        } catch (error) {
            console.error(`[GameStateManager] Error updating game state for ${gameCode}:`, error);
            throw new Error('Failed to update game state');
        }
    }

    async debugRoomMembership(gameCode: string): Promise<void> {
        try {
            const socketsInRoom = await this.io.in(gameCode).allSockets();
            console.log(`[GameStateManager] Room ${gameCode} has ${socketsInRoom.size} sockets:`);
            
            // Get details for each socket in the room
            for (const socketId of socketsInRoom) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    console.log(`[GameStateManager] Socket ${socketId} in room ${gameCode}:`, {
                        rooms: Array.from(socket.rooms),
                        data: socket.data
                    });
                }
            }
        } catch (error) {
            console.error(`[GameStateManager] Error checking room membership for ${gameCode}:`, error);
        }
    }

}

export class GameService {
    constructor(
        private gameStateManager: GameStateManager,
        private sessionManager: SessionManager
    ) {}

    // Core game management
    async findGame(gameCode: string) {
        const game = await Game.findOne({ gameCode });
        if (!game) {
            throw new Error('Game not found');
        }
        await this.cleanupStaleSessions(game);
        return game;
    }

    async createGame(sessionId: string, preferredTeam?: Team, gameSize: number = 15) {
        await this.sessionManager.validateAndUpdateSession(sessionId);
        
        const validatedGameSize = Math.min(Math.max(5, gameSize), 25);
        const gameCode = Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const playerPosition = preferredTeam === Team.Team2 
            ? Player.Team2_Player1 
            : Player.Team1_Player1;

        const game = await Game.create({
            gameCode,
            status: GameStatus.Waiting,
            currentTurn: Player.Team1_Player1,
            players: this.createInitialPlayers(sessionId, playerPosition),
            grid: this.createInitialGrid(validatedGameSize),
            words: [],
            score: { team1: 0, team2: 0 }
        });

        this.sessionManager.setSession(sessionId, { gameCode, playerPosition });

        return {
            game: game.toClientJSON(playerPosition),
            playerPosition
        };
    }

    // Player management
    async joinGame(sessionId: string, gameCode: string, preferredTeam?: Team): Promise<GameJoinResult> {
        console.log(`[GameService] Processing join for game ${gameCode}, session ${sessionId}`);
        const session = await this.sessionManager.validateAndUpdateSession(sessionId);
        console.log(`[GameService] Session validation for ${sessionId}: ${session ? 'valid' : 'invalid'}`);

        const game = await this.findGame(gameCode);
        console.log(`[GameService] Found game ${gameCode}, status: ${game.status}`);
        console.log(`[GameService] Current players: ${JSON.stringify(game.players)}`);

        if (game.status !== GameStatus.Waiting) {
            console.log(`[GameService] Game ${gameCode} not in waiting state: ${game.status}`);
            throw new Error('Game has already started');
        }

        const position = this.findAvailablePosition(game, preferredTeam);
        if (!position) {
            console.log(`[GameService] No available positions in game ${gameCode} for team ${preferredTeam || 'any'}`);
            throw new GameError(400, 'No positions available');
        }

        console.log(`[GameService] Assigning position ${position} to player ${sessionId} in game ${gameCode}`);

        await this.gameStateManager.handlePlayerStateChange(game, position, {
            sessionId,
            connected: true,
            lastActive: new Date()
        });

        console.log(`[GameService] Player state updated for ${position} in game ${gameCode}`);
        console.log(`[GameService] Player states after update: ${JSON.stringify(game.players)}`);

        const playerPosition = position;
        this.sessionManager.setSession(sessionId, { gameCode, playerPosition });
        console.log(`[GameService] Session ${sessionId} updated with game ${gameCode} and position ${playerPosition}`);
        return {
            game: game.toClientJSON(position),
            playerPosition: position
        };
    }

    async disconnectPlayer(sessionId: string, gameCode: string) {
        const game = await this.findGame(gameCode);
        const position = this.findPlayerPosition(game, sessionId);
        
        if (position) {
            await this.updatePlayerState(game, position, {
                sessionId: null,
                connected: false,
                lastActive: new Date()
            });
        }

        return game;
    }

    async cleanupAllGames() {
        const games = await Game.find();
        for (const game of games) {
            await this.gameStateManager.cleanupStalePlayers(game);
        }
    }

    // Helper methods
    private createInitialPlayers(sessionId: string, initialPosition: Player) {
        const defaultPlayerState = {
            sessionId: null,
            connected: false,
            forfeited: false,
            lastActive: new Date()
        };

        return {
            [Player.Team1_Player1]: {
                ...defaultPlayerState,
                sessionId: initialPosition === Player.Team1_Player1 ? sessionId : null,
                connected: initialPosition === Player.Team1_Player1
            },
            [Player.Team1_Player2]: { ...defaultPlayerState },
            [Player.Team2_Player1]: {
                ...defaultPlayerState,
                sessionId: initialPosition === Player.Team2_Player1 ? sessionId : null,
                connected: initialPosition === Player.Team2_Player1
            },
            [Player.Team2_Player2]: { ...defaultPlayerState }
        };
    }

    private createInitialGrid(size: number) {
        return Array(size).fill(null).map((_, row) => 
            Array(size).fill(null).map((_, col) => ({
                position: { row, col },
                state: CellState.Empty,
                letter: null,
                number: null,
                playedBy: null,
            }))
        );
    }

    private findPlayerPosition(game: IGame, sessionId: string): Player | null {
        for (const [position, player] of Object.entries(game.players)) {
            if (player.sessionId === sessionId) {
                return position as Player;
            }
        }
        return null;
    }

    private findAvailablePosition(game: IGame, preferredTeam?: Team): Player | null {
        const eligiblePositions = preferredTeam
            ? this.getTeamPositions(preferredTeam)
            : Object.values(Player);

        return eligiblePositions.find(
            pos => !game.players[pos].sessionId && !game.players[pos].connected
        ) || null;
    }

    private getTeamPositions(team: Team): Player[] {
        return team === Team.Team1 
            ? [Player.Team1_Player1, Player.Team1_Player2]
            : [Player.Team2_Player1, Player.Team2_Player2];
    }

    private async updatePlayerState(game: IGame, position: Player, state: PlayerStateUpdate) {
        // Check if position is already taken by this session
        const existingPositions = Object.entries(game.players)
            .filter(([_, player]) => player.sessionId === state.sessionId);
        
        if (existingPositions.length > 0) {
            throw new GameError(400, 'Already joined this game in another position');
        }
    
        game.players[position] = {
            ...game.players[position],
            ...state
        };
        await game.save();
    }

    async cleanupStaleSessions(game: IGame): Promise<boolean> {
        return this.gameStateManager.cleanupStalePlayers(game);
    }
}