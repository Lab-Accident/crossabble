import { Server, Socket } from 'socket.io';
import { Game } from '../models/gameModel';
import { Session, ISession } from '../models/sessionModel';
import { Player, Team } from '../types/gameTypes';
import { GameError } from './gameService';
import { registry } from './registry';
import { eventMediator } from './eventMediator';
import { GameEventType, GameListUpdatedPayload, SessionCreatedPayload, SessionUpdatedPayload, SessionRemovedPayload } from '../types/eventTypes';
import logger from '../utils/logger';
import { config } from '../config';

const ONE_HOUR = config.sessionCleanupInterval || 60 * 60 * 1000;
const ONE_MINUTE = config.gameCleanupInterval || 60 * 1000;
const STALE_SESSION_THRESHOLD = config.staleSessionThreshold || 7 * 24 * 60 * 60 * 1000;

export class SocketService {
    constructor(io: Server) {
        registry.initialize(io);

        this.setupSocketHandlers(io);
        this.setupCleanupIntervals();
        this.setupMediatorListeners();

        logger.info('SocketService initialized with all dependencies');
    }

    private async handleGameListUpdate() {
        try {
            logger.debug('Handling game list update broadcast');
            const games = await registry.gameService!.fetchGameList();
            registry.io!.emit('gameListUpdate', games.map(g => g.toClientJSON()));          console.log(`[SocketService] Broadcasted game list update via mediator`);
            logger.debug({ count: games.length }, 'Broadcasted game list update via mediator');
        } catch (error) {
            logger.error(error as Error, 'Error handling game list update');        }
    }

    private setupMediatorListeners() {
        logger.debug('Setting up event mediator listeners');

        // Listen for game created events
        registry.eventMediator.subscribe(GameEventType.GAME_CREATED, async (payload: { game: InstanceType<typeof Game>; gameCode: string }) => {
            const { gameCode } = payload;
            logger.debug({ gameCode }, 'Received gameCreated event');            
            
            await this.handleGameListUpdate();
        });

        // Game joined events
        registry.eventMediator.subscribe(GameEventType.GAME_JOINED, async (payload : any) => {
            const { gameCode, playerPosition } = payload;
            logger.debug({ gameCode, playerPosition }, 'Received gameJoined event');
            await this.handleGameListUpdate();
        });
        
        // Player disconnected events
        registry.eventMediator.subscribe(GameEventType.PLAYER_DISCONNECTED, async (payload : any) => {
            const { game, gameCode, sessionId } = payload;
            logger.debug({ gameCode, sessionId }, 'Received playerDisconnected event');
            registry.io!.to(gameCode).emit('gameStateUpdate', game.toClientJSON());
            registry.io!.to(gameCode).emit('playerDisconnected', {
                gameCode,
                timestamp: new Date().toISOString()
            });

            logger.debug({ gameCode }, 'Broadcasted playerDisconnected event to room');
        });
        
        // Game state updated events
        registry.eventMediator.subscribe(GameEventType.GAME_STATE_UPDATED, async (payload : any) => {
            const { gameCode } = payload;
            logger.debug({ gameCode }, 'Received gameStateUpdated event');
            await this.handleGameListUpdate();
        });

        registry.eventMediator.subscribe(GameEventType.GAME_LIST_UPDATED, async (payload: GameListUpdatedPayload) => {
            try {
                const { games } = payload;
                logger.debug({ count: games.length }, 'Received gameListUpdated event');
                registry.io!.emit('gameListUpdate', games.map(g => g.toClientJSON()));
            } catch (error) {
                logger.error(error as Error, 'Error handling game list update');
            }
        });

        registry.eventMediator.subscribe(GameEventType.SESSION_CREATED, (payload: SessionCreatedPayload) => {
            const { sessionId } = payload;
            logger.debug({ sessionId }, 'Received sessionCreated event');
            // Any additional logic you need when a session is created
        });
        
        registry.eventMediator.subscribe(GameEventType.SESSION_UPDATED, (payload: SessionUpdatedPayload) => {
            const { sessionId, gameCode, playerPosition } = payload;
            logger.debug({ sessionId, gameCode, playerPosition }, 'Received sessionUpdated event');

            // Find socket associated with this session and notify if needed
            const socket = registry.sessionService!['activeSessions'].get(sessionId);
            if (socket && gameCode) {
                // Ensure socket is in the right room
                socket.join(gameCode);
                logger.debug({ sessionId, socketId: socket.id, gameCode }, 'Added socket to game room');
            }
        });
        
        registry.eventMediator.subscribe(GameEventType.SESSION_REMOVED, (payload: SessionRemovedPayload) => {
            const { sessionId } = payload;
            logger.debug({ sessionId }, 'Received sessionRemoved event');
            // Any cleanup that might be needed
        });
      }

    private async handleSessionAuth(socket: Socket): Promise<void> {
        const sessionId = socket.handshake.auth.sessionId;
        logger.debug(
            { socketId: socket.id, sessionId: sessionId || 'none' },
            'Socket authentication attempt'
        );
        
        if (!sessionId) {
            logger.debug({ socketId: socket.id }, 'No sessionId provided in handshake');
            return this.handleNewSession(socket);
        }
        
        try {
            logger.debug({ sessionId }, 'Validating existing session');
            const session = await registry.sessionService!.validateAndUpdateSession(sessionId);
            
            if (session) {
            logger.info({ sessionId, socketId: socket.id }, 'Existing session validated');
            return this.handleExistingSession(socket, session);
            } else {
            logger.warn({ sessionId }, 'Session not found in database despite being provided');
            return this.handleNewSession(socket);
            }
        } catch (error) {
            logger.error({ sessionId, socketId: socket.id, error }, 'Error validating session');
            return this.handleNewSession(socket);
        }
    }

    private async handleExistingSession(socket: Socket, session: ISession): Promise<void> {
        logger.debug({ sessionId: session.sessionId, socketId: socket.id }, 'Handling existing session');
        socket.data.sessionId = session.sessionId;
        registry.sessionService!.setActiveSession(session.sessionId, socket);
        
        logger.debug({ 
            sessionId: session.sessionId, 
            gameCode: session.gameCode, 
            playerPosition: session.playerPosition 
        }, 'Session data');
        
        if (session.gameCode) {
            logger.info({ sessionId: session.sessionId, gameCode: session.gameCode }, 'Attempting to reconnect to game');
            await this.reconnectToGame(session);
        }
         
        logger.debug({ sessionId: session.sessionId }, 'Emitting session data to client');
        socket.emit('session', { sessionId: session.sessionId });
    }

    private async handleNewSession(socket: Socket): Promise<void> {
        logger.debug({ socketId: socket.id }, 'Creating brand new session for socket');
        const newSessionId = await registry.sessionService!.createNewSession();

        logger.debug({ socketId: socket.id, sessionId: newSessionId }, 'Assigning new sessionId to socket');
        socket.data.sessionId = newSessionId;
        registry.sessionService!.setActiveSession(newSessionId, socket);

        logger.debug({ sessionId: newSessionId }, 'Emitting new session to client');
        socket.emit('session', { sessionId: newSessionId });
    }

    private async reconnectToGame(session: ISession): Promise<void> {
        logger.debug({ 
            sessionId: session.sessionId,
            gameCode: session.gameCode, 
            playerPosition: session.playerPosition 
        }, 'Reconnect attempt to game');

        try {
            if (!session.gameCode || !session.playerPosition) {
                logger.warn({ sessionId: session.sessionId }, 'Missing game code or player position, cannot reconnect');
                return;
            }

            logger.debug({ gameCode: session.gameCode }, 'Looking up game');
            const game = await registry.gameService!.findGame(session.gameCode!);
            if (!game) {
                logger.warn({ gameCode: session.gameCode }, 'Game not found');
                return;
            }

            const playerPos = session.playerPosition as Player;
            if (!Object.values(Player).includes(playerPos)) {
                logger.error({ playerPosition: playerPos }, 'Invalid player position');
                return;
            }

            logger.debug({ 
                gameCode: session.gameCode, 
                playerPosition: playerPos,
                playerData: game.players[playerPos]
            }, 'Player in game data');

            const player = game.players[playerPos];

            if (player && player.sessionId === session.sessionId) {
                logger.info({ 
                    sessionId: session.sessionId,
                    gameCode: session.gameCode, 
                    playerPosition: playerPos 
                }, 'Successful reconnection to game');

                game.players[playerPos].connected = true;
                game.players[playerPos].lastActive = new Date();
                await game.save();

                registry.eventMediator.publish(GameEventType.GAME_STATE_UPDATED, {
                    game,
                    gameCode: game.gameCode
                });
                
            } else {
                logger.warn({
                    sessionId: session.sessionId,
                    playerSessionId: player?.sessionId,
                    gameCode: session.gameCode,
                    playerPosition: playerPos
                }, 'Reconnection failed - sessionId mismatch');
            }

        } catch (error) {
            logger.error(error as Error, 'Reconnection error', { 
                sessionId: session.sessionId,
                gameCode: session.gameCode
            });  
        }
    }

    private setupSocketHandlers(io:Server): void {
        logger.debug('Setting up socket event handlers');

        io.use(async (socket, next) => {
            try {
                await this.handleSessionAuth(socket);
                next();
            } catch (error) {
                logger.error(error as Error, 'Socket authentication error', { socketId: socket.id });
                next(new Error('Authentication error'));
            }
        });

        io.on('connection', (socket: Socket) => {
            logger.debug({ socketId: socket.id }, 'Socket connected');
            this.handleConnection(socket);
            this.setupGameEventHandlers(socket);

            socket.on('requestGameState', async (gameCode: string) => {
                logger.debug({ socketId: socket.id, gameCode }, 'Game state requested');
                try {
                    const game = await registry.gameService!.findGame(gameCode);
                    if (game) {
                        socket.emit('gameStateUpdate', game.toClientJSON());
                        logger.debug({ gameCode }, 'Game state sent to client');
                    }
                } catch (error) {
                    logger.error(error as Error, 'Error handling game state request', { 
                        socketId: socket.id, 
                        gameCode 
                    });                }
            });
        });
        logger.debug('Socket handlers setup complete');
    }

    private setupGameEventHandlers(socket: Socket): void {
        logger.debug({ socketId: socket.id }, 'Setting up game event handlers for socket');
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
            const { gameCode, playerPosition, preferredTeam } = data;
            const sessionId = socket.data.sessionId;

            logger.info({ 
                socketId: socket.id, 
                sessionId, 
                gameCode, 
                playerPosition,
                preferredTeam
            }, 'Join game event received');
            
            const roomsBefore = Array.from(socket.rooms);
            logger.debug({ socketId: socket.id, rooms: roomsBefore }, 'Socket rooms before join');
            
            const roomBefore = await registry.io!.in(gameCode).fetchSockets();
            logger.debug({ gameCode, count: roomBefore.length }, 'Room has sockets before join');
        
            socket.join(gameCode);
            logger.debug({ socketId: socket.id, gameCode }, 'Socket joined room');
            
            registry.sessionService!.setSession(sessionId, { gameCode, playerPosition });
            logger.debug({ sessionId, gameCode, playerPosition }, 'Session data updated');

            const game = await registry.gameService!.findGame(gameCode);

            logger.debug({ 
                gameCode: game.gameCode,
                status: game.status,
                playerCount: Object.values(game.players).filter(p => p.connected).length
            }, 'Current game state before playerJoined broadcast');

            logger.info({ gameCode, playerPosition }, 'Broadcasting playerJoined event to room');
            
        } catch (error) {
            const errorMessage = error instanceof GameError ? error.message : 'Error joining game';
            logger.error(error as Error, 'Error in handleJoinGame', { 
                socketId: socket.id, 
                sessionId: socket.data.sessionId,
                gameCode: data.gameCode 
            });
            socket.emit('error', { message: errorMessage });
        }
    }

    private async handleDisconnect(socket: Socket): Promise<void> {
        const sessionId = socket.data.sessionId;
        logger.info({ socketId: socket.id, sessionId }, 'Socket disconnected');
        const sessionData = registry.sessionService!.getSession(sessionId);

        if (sessionData?.gameCode) {
            try {
                logger.debug({ sessionId, gameCode: sessionData.gameCode }, 'Disconnecting player from game');
                const game = await registry.gameService!.disconnectPlayer(sessionId, sessionData.gameCode);
                registry.io!.to(sessionData.gameCode).emit('gameStateUpdate', game.toClientJSON());
                
                logger.info({ sessionId, gameCode: sessionData.gameCode }, 'Player disconnected from game, updated all clients');
            } catch (error) {
                logger.error(error as Error, 'Error handling disconnect', { sessionId, gameCode: sessionData.gameCode });            }
        }

        registry.sessionService!.removeSession(sessionId);
    }

    private get activeSessions() {
        return registry.sessionService!['activeSessions'];
    }

    private setupCleanupIntervals(): void {
        logger.debug({ 
            sessionInterval: ONE_HOUR / 1000 / 60 / 60 + ' hours', 
            gameInterval: ONE_MINUTE / 1000 / 60 + ' minutes' 
        }, 'Setting up cleanup intervals');

        setInterval(this.cleanupStaleSessions.bind(this), ONE_HOUR);
        setInterval(this.cleanupStaleGames.bind(this), ONE_MINUTE);
    }

    private async cleanupStaleSessions(): Promise<void> {
        logger.info('Starting session cleanup process');

        // Use 7 days instead of 1 day for infrequently used apps
        const staleThreshold = new Date(Date.now() - STALE_SESSION_THRESHOLD);
        logger.debug({ staleThreshold: staleThreshold.toISOString() }, 'Stale threshold set');

        try {
        // Only delete sessions that are:
        // 1. Older than the threshold
        // 2. Not associated with any game
        // 3. Not in memory as active sessions
        const activeSessionIds = new Set([...this.activeSessions.keys()]);
        logger.debug({ activeCount: activeSessionIds.size }, 'Active sessions in memory');
        
        // Log what we're planning to clean up
        const sessionsToDelete = await Session.find({
            lastSeen: { $lt: staleThreshold },
            gameCode: null,
            sessionId: { $nin: Array.from(activeSessionIds) }
        });
        
        logger.info({ count: sessionsToDelete.length }, 'Found stale sessions to delete');

        if (sessionsToDelete.length > 0) {
                const result = await Session.deleteMany({
                    lastSeen: { $lt: staleThreshold },
                    gameCode: null,
                    sessionId: { $nin: Array.from(activeSessionIds) }
                });
                
                logger.info({ deletedCount: result.deletedCount }, 'Deleted stale sessions');
            }
        } catch (error) {
            logger.error(error as Error, 'Session cleanup error');
        }
    }

    private async cleanupStaleGames(): Promise<void> {
        try {
            logger.debug('Starting game cleanup');
            const games = await Game.find();
            logger.debug({ count: games.length }, 'Found games for cleanup check');
                        
            let anyChanges = false;
            
            for (const game of games) {
                logger.debug({ gameCode: game.gameCode }, 'Checking game');
                const socketsInRoom = await registry.io!.in(game.gameCode).allSockets();
                logger.debug({ gameCode: game.gameCode, activeSocketCount: socketsInRoom.size }, 'Active sockets in game');

                const connectedPlayers = Object.values(game.players).filter(p => p.connected).length;
                logger.debug({ 
                    gameCode: game.gameCode, 
                    connectedPlayers
                }, 'Game player state before cleanup');
                    
                const wasChanged = await registry.gameService!.cleanupStaleSessions(game);
                logger.debug({ gameCode: game.gameCode, wasChanged }, 'Game cleanup result');

                if (wasChanged) {
                    anyChanges = true;
                    if (socketsInRoom.size > 0) {
                        logger.info({ 
                            gameCode: game.gameCode, 
                            clientCount: socketsInRoom.size 
                        }, 'Broadcasting update to clients in game');
                        
                        registry.io!.to(game.gameCode).emit('gameStateUpdate', game.toClientJSON());
                    }             
                }
            }
            
            if (anyChanges) {
                logger.info('Publishing game list update after cleanup');
                const updatedGames = await Game.find();
                registry.eventMediator.publish(GameEventType.GAME_LIST_UPDATED, { games: updatedGames });
            }
        } catch (error) {
            logger.error(error as Error, 'Game cleanup error');
        }
    }
    

    private async handleConnection(socket: Socket): Promise<void> {
        const sessionId = socket.data.sessionId;
        const sessionData = registry.sessionService!.getSession(sessionId);
        
        logger.debug({ socketId: socket.id, sessionId }, 'Handling new connection');

        if (sessionData?.gameCode) {
            logger.debug({ sessionId, gameCode: sessionData.gameCode }, 'Adding socket to game room');
            socket.join(sessionData.gameCode);

            try {
                const game = await registry.gameService!.findGame(sessionData.gameCode);
                eventMediator.publish(GameEventType.GAME_STATE_UPDATED, {
                    game,
                    gameCode: sessionData.gameCode
                });

                logger.debug({ gameCode: sessionData.gameCode }, 'Published game state update');
            } catch (error) {
                logger.error(error as Error, 'Error emitting game state', { 
                    sessionId, 
                    gameCode: sessionData.gameCode 
                });
            }
        }
    }
}

export function createSocketService(io: Server) {
    logger.info('Creating SocketService instance');
    return new SocketService(io);
}