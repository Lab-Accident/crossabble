import { Game, IGame } from '../models/gameModel';
import { Player, Team, GameStatus, CellState, PlayerState, GamePlayers } from '../types/gameTypes';
import { GameEventType } from '../types/eventTypes';
import { registry } from './registry';
import logger from '../utils/logger';
import { config } from '../config';

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

export class GameService {
    constructor() {
        logger.debug('GameService initialized');
    }

    // Core game management
    async findGame(gameCode: string) {
        logger.debug({ gameCode }, 'Finding game');
        const game = await Game.findOne({ gameCode });
        
        if (!game) {
            throw new Error('Game not found');
        }
        
        logger.debug({ gameCode, gameStatus: game.status }, 'Game found');
        await this.cleanupStaleSessions(game);
        return game;
    }

    async fetchGameList(): Promise<IGame[]> {
        try {
            logger.debug('Fetching game list');
            const games = await Game.find();
            
            logger.debug({ count: games.length }, 'Game list fetched');
            
            // Publish the game list through the mediator
            registry.eventMediator.publish(GameEventType.GAME_LIST_UPDATED, {
                games
            });
            
            return games;
        } catch (error) {
            logger.error({ err: error }, 'Error fetching game list');
            throw error;
        }
    }

    async createGame(sessionId: string, preferredTeam?: Team, gameSize: number = 15) {
        logger.info({ sessionId, preferredTeam, gameSize }, 'Creating new game');

        await registry.sessionService.validateAndUpdateSession(sessionId);
        
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

        logger.info({ gameCode, playerPosition }, 'Game created successfully');

        registry.eventMediator.publish(GameEventType.GAME_CREATED, { 
            game: game, 
            gameCode: game.gameCode 
        });
        
        registry.sessionService.setSession(sessionId, { gameCode, playerPosition });

        return {
            game: game.toClientJSON(playerPosition),
            playerPosition
        };
    }

    // Player management
    async joinGame(sessionId: string, gameCode: string, preferredTeam?: Team): Promise<GameJoinResult> {
        logger.info({ gameCode, sessionId, preferredTeam }, 'Processing join game request');

        const session = await registry.sessionService!.validateAndUpdateSession(sessionId);
        logger.debug({ sessionId, valid: !!session }, 'Session validation result');

        const game = await this.findGame(gameCode);
        logger.debug({ gameCode, gameStatus: game.status }, 'Game found for join request');        

        if (game.status !== GameStatus.Waiting) {
            logger.warn({ gameCode, gameStatus: game.status }, 'Cannot join game that is not in waiting state');
            throw new Error('Game has already started');
        }

        const position = this.findAvailablePosition(game, preferredTeam);
        if (!position) {
            logger.warn({ gameCode, preferredTeam }, 'No positions available in game');
            throw new GameError(400, 'No positions available');
        }

        logger.info({ gameCode, position, sessionId }, 'Assigning position to player');

        await registry.gameStateManager.handlePlayerStateChange(game, position, {
            sessionId,
            connected: true,
            lastActive: new Date()
        });

        logger.debug({ gameCode, position }, 'Player state updated');
        
        const playerPosition = position;
        registry.sessionService!.setSession(sessionId, { gameCode, playerPosition });
        
        logger.debug({ sessionId, gameCode, playerPosition }, 'Session updated with game and position');

        // Publish the join event
        registry.eventMediator.publish(GameEventType.GAME_JOINED, {
            game,
            gameCode,
            playerPosition,
            sessionId
        });
        
        return {
            game: game.toClientJSON(position),
            playerPosition
        };
    }

    async disconnectPlayer(sessionId: string, gameCode: string) {
        logger.info({ sessionId, gameCode }, 'Disconnecting player');

        const game = await this.findGame(gameCode);
        const position = this.findPlayerPosition(game, sessionId);
        
        if (position) {
            logger.debug({ gameCode, position, sessionId }, 'Updating player state for disconnect');

            await this.updatePlayerState(game, position, {
                sessionId: null,
                connected: false,
                lastActive: new Date()
            });

            logger.info({ gameCode, position }, 'Player disconnected');
        } else {
            logger.warn({ gameCode, sessionId }, 'Attempted to disconnect player not in game');
        }

        registry.eventMediator.publish(GameEventType.PLAYER_DISCONNECTED, {
            game,
            gameCode,
            sessionId,
        });

        return game;
    }

    async cleanupAllGames() {
        logger.info('Starting cleanup of all games');

        const games = await this.fetchGameList();
        logger.debug({ count: games.length }, 'Games to cleanup');
        
        for (const game of games) {
            await registry.gameStateManager!.cleanupStalePlayers(game);
        }

        logger.info('Completed cleanup of all games');
    }

    // Helper methods
    private createInitialPlayers(sessionId: string, initialPosition: Player) {
        logger.debug({ sessionId, initialPosition }, 'Creating initial player states');

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
        logger.debug({ size }, 'Creating initial game grid');

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
        logger.debug({ gameCode: game.gameCode, sessionId }, 'Player position not found');
        return null;
    }

    private findAvailablePosition(game: IGame, preferredTeam?: Team): Player | null {
        logger.debug({ gameCode: game.gameCode, preferredTeam }, 'Finding available position');

        const eligiblePositions = preferredTeam
            ? this.getTeamPositions(preferredTeam)
            : Object.values(Player);

        const position = eligiblePositions.find(
            pos => !game.players[pos].sessionId && !game.players[pos].connected
        ) || null;

        logger.debug({ gameCode: game.gameCode, availablePosition: position }, 'Available position result');
        return position;
    }

    private getTeamPositions(team: Team): Player[] {
        return team === Team.Team1 
            ? [Player.Team1_Player1, Player.Team1_Player2]
            : [Player.Team2_Player1, Player.Team2_Player2];
    }

    private async updatePlayerState(game: IGame, position: Player, state: PlayerStateUpdate) {
        logger.debug({ 
            gameCode: game.gameCode, 
            position, 
            connected: state.connected,
            hasSessionId: !!state.sessionId
        }, 'Updating player state');

        // Check if position is already taken by this session
        const existingPositions = Object.entries(game.players)
            .filter(([_, player]) => player.sessionId === state.sessionId);
        
        if (existingPositions.length > 0) {
            logger.warn({ 
                gameCode: game.gameCode, 
                sessionId: state.sessionId, 
                existingPositions: existingPositions.map(([pos]) => pos) 
            }, 'Session already in game at another position');
    
            throw new GameError(400, 'Already joined this game in another position');
        }

        game.players[position] = {
            ...game.players[position],
            ...state
        };
        await game.save();
        logger.debug({ gameCode: game.gameCode, position }, 'Player state saved');

        registry.eventMediator.publish(GameEventType.PLAYER_STATE_CHANGED, {
            gameCode: game.gameCode,
            playerPosition: position,
            sessionId: state.sessionId || '',
            connected: state.connected
        });
    }

    async cleanupStaleSessions(game: IGame): Promise<boolean> {
        logger.debug({ gameCode: game.gameCode }, 'Cleaning up stale sessions for game');
        return registry.gameStateManager!.cleanupStalePlayers(game);
    }
}