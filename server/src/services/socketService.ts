import { Server, Socket } from 'socket.io';
import { Game } from '../models/gameModel';
import { Session, ISession } from '../models/gameSessionModel';
import { Player, Team, GameStatus } from '../types/gameTypes';
import { GameService, GameError } from './gameService';
import { GameStateManager } from './gameService';

const ONE_HOUR = 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

export class SessionManager {
    private activeSessions: Map<string, Socket>;
    private sessions: Map<string, { gameCode: string | null; playerPosition: any }>;

    constructor() {
        this.activeSessions = new Map();
        this.sessions = new Map();
        console.log('[SessionManager] Initialized');
    }

    async validateAndUpdateSession(sessionId: string): Promise<ISession | null> {
        console.log(`[SessionManager] Validating session: ${sessionId}`);
        const session = await Session.findOne({ sessionId });
        if (session) {
            console.log(`[SessionManager] Session found: ${sessionId}, last seen: ${session.lastSeen}`);
            session.lastSeen = new Date();
            await session.save();
            console.log(`[SessionManager] Session updated: ${sessionId}`);
        } else {
            console.log(`[SessionManager] Session not found: ${sessionId}`);
        }
        return session;
    }

    async createNewSession(): Promise<string> {
        const sessionId = Math.random().toString(36).substring(2, 15);
        console.log(`[SessionManager] Creating new session: ${sessionId}`);
        try {
            await Session.create({
                sessionId,
                gameCode: null,
                playerPosition: null,
                lastSeen: new Date()
            });
            console.log(`[SessionManager] New session created: ${sessionId}`);
        } catch (error) {
            console.error(`[SessionManager] Error creating session: ${sessionId}`, error);
            throw error;
        }
        return sessionId;
    }

    setActiveSession(sessionId: string, socket: Socket) {
        console.log(`[SessionManager] Setting active session: ${sessionId}`);
        this.activeSessions.set(sessionId, socket);
        
        // If the session isn't in the sessions map, add it with default values
        if (!this.sessions.has(sessionId)) {
            console.log(`[SessionManager] Adding session to session data: ${sessionId}`);
            this.sessions.set(sessionId, { gameCode: null, playerPosition: null });
        }
      }

    setSession(sessionId: string, data: { gameCode: string; playerPosition: any }) {
        console.log(`[SessionManager] Updating session data: ${sessionId}, gameCode: ${data.gameCode}, position: ${data.playerPosition}`);
        this.sessions.set(sessionId, data);
    }

    getSession(sessionId: string) {
        const session = this.sessions.get(sessionId);
        console.log(`[SessionManager] Getting session: ${sessionId}`, session ? 'Found' : 'Not found');
        return session;
    }

    removeSession(sessionId: string) {
        console.log(`[SessionManager] Removing session: ${sessionId}`);
        this.sessions.delete(sessionId);
        this.activeSessions.delete(sessionId);
    }
}

export class SocketService {
    private sessionManager: SessionManager;
    private gameService: GameService;
    private io: Server;

    constructor(io: Server) {
        this.io = io
        const gameStateManager = new GameStateManager(this.io);
        this.sessionManager = new SessionManager();
        this.gameService = new GameService(gameStateManager, this.sessionManager);
        
        this.setupSocketHandlers();
        this.setupCleanupIntervals();
    }

    private async handleSessionAuth(socket: Socket): Promise<void> {
        const sessionId = socket.handshake.auth.sessionId;
        console.log(`[SocketService] Auth attempt with sessionId: ${sessionId || 'none'}`);
        
        if (sessionId) {
            console.log(`[SocketService] Trying to validate existing session: ${sessionId}`);
            const session = await this.sessionManager.validateAndUpdateSession(sessionId);
            if (session) {
                console.log(`[SocketService] Existing session validated: ${sessionId}`);
                await this.handleExistingSession(socket, session);
                return;
            } else {
                console.log(`[SocketService] Session not found in database despite being provided: ${sessionId}`);
            }
        } else {
            console.log(`[SocketService] No sessionId provided in handshake`);
        }
        
        console.log(`[SocketService] Creating new session for socket ${socket.id}`);
        await this.handleNewSession(socket);
    }

    private async handleExistingSession(socket: Socket, session: ISession): Promise<void> {
        console.log(`[SocketService] Handling existing session: ${session.sessionId}`);
        socket.data.sessionId = session.sessionId;
        this.sessionManager.setActiveSession(session.sessionId, socket);
        
        console.log(`[SocketService] Session gameCode: ${session.gameCode}, playerPosition: ${session.playerPosition}`);
        if (session.gameCode) {
            console.log(`[SocketService] Attempting to reconnect to game: ${session.gameCode}`);
            await this.reconnectToGame(session);
        }
         
        console.log(`[SocketService] Emitting session data to client: ${session.sessionId}`);
        socket.emit('session', { sessionId: session.sessionId });
    }

    private async handleNewSession(socket: Socket): Promise<void> {
        console.log(`[SocketService] Creating brand new session for socket: ${socket.id}`);
        const newSessionId = await this.sessionManager.createNewSession();

        console.log(`[SocketService] Assigning new sessionId to socket: ${newSessionId}`);
        socket.data.sessionId = newSessionId;
        this.sessionManager.setActiveSession(newSessionId, socket);

        console.log(`[SocketService] Emitting new session to client: ${newSessionId}`);
        socket.emit('session', { sessionId: newSessionId });
    }

    private async reconnectToGame(session: ISession): Promise<void> {
        console.log(`[SocketService] Reconnect attempt to game: ${session.gameCode}, player: ${session.playerPosition}`);

        try {
            if (!session.gameCode || !session.playerPosition) {
                console.log(`[SocketService] Missing game code or player position, cannot reconnect`);
                return;
            }

            console.log(`[SocketService] Looking up game: ${session.gameCode}`);
            const game = await this.gameService.findGame(session.gameCode!);
            if (!game) {
                console.log(`[SocketService] Game not found: ${session.gameCode}`);
                return;
            }

            const playerPos = session.playerPosition as Player;
            if (!Object.values(Player).includes(playerPos)) {
                console.error(`[SocketService] Invalid player position: ${playerPos}`);
                return;
            }

            console.log(`[SocketService] Player in game data: ${JSON.stringify(game.players[playerPos])}`);
            const player = game.players[playerPos];

            if (player && player.sessionId === session.sessionId) {
                console.log(`[SocketService] Successful reconnection to game ${session.gameCode} as ${playerPos}`);
                game.players[playerPos].connected = true;
                game.players[playerPos].lastActive = new Date();
                await game.save();
                
                this.io.to(game.gameCode).emit('gameStateUpdate', game.toClientJSON());
            } else {
                console.log(`[SocketService] Reconnection failed - sessionId mismatch:
                    Player's stored sessionId: ${player?.sessionId}
                    Current session's sessionId: ${session.sessionId}`);
            }

        } catch (error) {
            console.error('[SocketService] Reconnection error:', error);        }
    }

    private setupSocketHandlers(): void {
        this.io.use(async (socket, next) => {
            try {
                await this.handleSessionAuth(socket);
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
            this.setupGameEventHandlers(socket);
            socket.on('requestGameState', async (gameCode: string) => {
                try {
                    const game = await this.gameService.findGame(gameCode);
                    if (game) {
                        socket.emit('gameStateUpdate', game.toClientJSON());
                    }
                } catch (error) {
                    console.error('Error handling game state request:', error);
                }
            });
        });
    }

    private setupGameEventHandlers(socket: Socket): void {
        socket.on('joinGame', (data) => this.handleJoinGame(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    private async handleJoinGame(socket: Socket, data: { 
        gameCode: string; 
        sessionId: string; 
        preferredTeam?: Team;
        playerPosition: Player;
    }): Promise<void> {
        try {
            const { gameCode, playerPosition } = data;
            const sessionId = socket.data.sessionId;
            
            console.log(`[SocketService] Join game event received - game: ${gameCode}, player: ${playerPosition}, session: ${sessionId}`);
            console.log(`[SocketService] Socket ${socket.id} rooms before join:`, Array.from(socket.rooms));
            
            const roomBefore = await this.io.in(gameCode).fetchSockets();
            console.log(`[SocketService] Room ${gameCode} has ${roomBefore.length} sockets before join`);
        
            socket.join(gameCode);
            console.log(`[SocketService] Socket ${socket.id} joined room ${gameCode}`);
            
            this.sessionManager.setSession(sessionId, { gameCode, playerPosition });
            console.log(`[SocketService] Session data updated for ${sessionId} with game ${gameCode} and position ${playerPosition}`);
            
            const game = await this.gameService.findGame(gameCode);
            console.log(`[SocketService] Current game state before playerJoined broadcast:`, {
                gameCode: game.gameCode,
                players: game.players
            });

            console.log(`[SocketService] Broadcasting playerJoined event for ${playerPosition} to room ${gameCode}`);
            this.io.to(gameCode).emit('playerJoined', {
                position: playerPosition,
                gameCode
            });

            console.log(`[SocketService] Broadcasting gameStateUpdate to room ${gameCode}`);
            this.io.to(gameCode).emit('gameStateUpdate', game.toClientJSON());
        
            console.log(`[SocketService] Broadcasting game list update to all clients`);
            const games = await Game.find();
            this.io.emit('gameListUpdate', games.map(g => g.toClientJSON()));
            
            const gameStateForLog = {
                gameCode: game.gameCode,
                status: game.status,
                players: game.players
            };
            console.log(`[SocketService] Game state update broadcast content:`, gameStateForLog);
            
        } catch (error) {
            const errorMessage = error instanceof GameError ? error.message : 'Error joining game';
            console.error(`[SocketService] Error in handleJoinGame:`, error);
            socket.emit('error', { message: errorMessage });
        }
    }

    private async handleDisconnect(socket: Socket): Promise<void> {
        const sessionId = socket.data.sessionId;
        const sessionData = this.sessionManager.getSession(sessionId);

        if (sessionData?.gameCode) {
            try {
                const game = await this.gameService.disconnectPlayer(sessionId, sessionData.gameCode);
                this.io.to(sessionData.gameCode).emit('gameStateUpdate', game.toClientJSON());
                const games = await Game.find();
                this.io.emit('gameListUpdate', games.map(g => g.toClientJSON()));
                
                console.log(`[SocketService] Player disconnected from ${sessionData.gameCode}, updated all clients`);

            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        }

        this.sessionManager.removeSession(sessionId);
    }

    private get activeSessions() {
        return this.sessionManager['activeSessions'];
    }

    private setupCleanupIntervals(): void {
        setInterval(this.cleanupStaleSessions.bind(this), ONE_HOUR);
        setInterval(this.cleanupStaleGames.bind(this), ONE_MINUTE);
    }
    // In your cleanupStaleSessions function
    private async cleanupStaleSessions(): Promise<void> {
        console.log('[SocketService] Starting session cleanup process');
        
        // Use 7 days instead of 1 day for infrequently used apps
        const staleThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        console.log(`[SocketService] Stale threshold set to: ${staleThreshold.toISOString()}`);
        
        try {
        // Only delete sessions that are:
        // 1. Older than the threshold
        // 2. Not associated with any game
        // 3. Not in memory as active sessions
        const activeSessionIds = new Set([...this.activeSessions.keys()]);
        
        // Log what we're planning to clean up
        const sessionsToDelete = await Session.find({
            lastSeen: { $lt: staleThreshold },
            gameCode: null,
            sessionId: { $nin: Array.from(activeSessionIds) }
        });
        
        console.log(`[SocketService] Found ${sessionsToDelete.length} stale sessions to delete`);
        
        // Perform the deletion
        const result = await Session.deleteMany({
            lastSeen: { $lt: staleThreshold },
            gameCode: null,
            sessionId: { $nin: Array.from(activeSessionIds) }
        });
        
        console.log(`[SocketService] Deleted ${result.deletedCount} stale sessions`);
        } catch (error) {
        console.error('[SocketService] Session cleanup error:', error);
        }
    }

    private async cleanupStaleGames(): Promise<void> {
        try {
            console.log("[SocketService] Starting game cleanup");
            const games = await Game.find();
            console.log(`[SocketService] Found ${games.length} games for cleanup check`);
            
            let anyChanges = false;
            
            for (const game of games) {
                console.log(`[SocketService] Checking game ${game.gameCode}`);
                const socketsInRoom = await this.io.in(game.gameCode).allSockets();
                console.log(`[SocketService] Active sockets in game ${game.gameCode}: ${socketsInRoom.size}`);
    
                // Log the current player state before cleanup
                console.log(`[SocketService] Game ${game.gameCode} player state before cleanup:`, 
                    JSON.stringify(game.players, null, 2));
                    
                const wasChanged = await this.gameService.cleanupStaleSessions(game);
                console.log(`[SocketService] Game ${game.gameCode} cleanup result: ${wasChanged}`);
                
                if (wasChanged) {
                    anyChanges = true;
                    if (socketsInRoom.size > 0) {
                        console.log(`[SocketService] Broadcasting update to ${socketsInRoom.size} clients in game ${game.gameCode}`);
                        this.io.to(game.gameCode).emit('gameStateUpdate', game.toClientJSON());
                    }                
                }
            }
            
            // ADDED: If any games were changed, update all clients
            if (anyChanges) {
                console.log("[SocketService] Broadcasting game list update to all clients after cleanup");
                const updatedGames = await Game.find();
                this.io.emit('gameListUpdate', updatedGames.map(g => g.toClientJSON()));
            }
        } catch (error) {
            console.error('[SocketService] Game cleanup error:', error);
        }
    }
    

    private async handleConnection(socket: Socket): Promise<void> {
        const sessionData = this.sessionManager.getSession(socket.data.sessionId);
        if (sessionData?.gameCode) {
            socket.join(sessionData.gameCode);
            try {
                const game = await this.gameService.findGame(sessionData.gameCode);
                this.io.to(sessionData.gameCode).emit('gameStateUpdate', game.toClientJSON());
            } catch (error) {
                console.error('Error emitting game state:', error);
            }
        }
    }
}

export function createSocketService(io: Server) {
    return new SocketService(io);
}