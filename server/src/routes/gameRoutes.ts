import { Router, RequestHandler } from 'express';
import { Game } from '../models/gameModel';
import * as types from '../types/gameTypes';
import { Team, Player } from '../types/gameTypes';
import { GameService, GameError } from '../services/gameService';
import logger from '../utils/logger';

export function createGameRouter(gameService: GameService) {
    const gameRouter = Router();
    logger.debug('Creating game router');

    const joinGame: RequestHandler<{ gameCode: string }, any, { 
        preferredTeam?: types.Team;
        sessionId: string;
    }> = async (req, res) => {
        const { gameCode } = req.params;
        const { preferredTeam, sessionId } = req.body;

        logger.info({ 
            gameCode, 
            sessionId, 
            preferredTeam: preferredTeam || 'none' 
        }, 'Join game request received');

        try {
            const result = await gameService.joinGame(sessionId, gameCode, preferredTeam);
            
            logger.info({ 
                gameCode, 
                sessionId,
                playerPosition: result.playerPosition 
            }, 'Join game successful');
            
            logger.debug({
                gameCode,
                playerCount: Object.values(result.game.players).filter(p => p.connected).length,
                players: result.game.players
            }, 'Game player state after join');

            res.json({
                game: result.game,
                playerPosition: result.playerPosition
            });
        } catch (error) {
            logger.error(error as Error, 'Error joining game', { gameCode, sessionId });
            
            if (error instanceof GameError) {
                res.status(error.code).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        }
    };

    const createGame: RequestHandler<{}, any, { 
        preferredTeam?: Team;
        sessionId: string;
        gameSize?: number;
    }> = async (req, res) => {
        const { preferredTeam, sessionId, gameSize } = req.body;
        
        logger.info({ 
            sessionId, 
            preferredTeam, 
            gameSize 
        }, 'Create game request received');
        
        try {
            const result = await gameService.createGame(sessionId, preferredTeam, gameSize);
            
            logger.info({ 
                gameCode: result.game.gameCode,
                playerPosition: result.playerPosition,
                sessionId
            }, 'Game created successfully');
            
            logger.debug({
                gameCode: result.game.gameCode,
                gameSize: result.game.gameSize,
                players: result.game.players
            }, 'New game details');
            
            res.json({
                game: result.game,
                playerPosition: result.playerPosition
            });
        } catch (error) {
            logger.error(error as Error, 'Error creating game', { 
                sessionId, 
                preferredTeam, 
                gameSize 
            });
            
            if (error instanceof GameError) {
                res.status(error.code).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        }
    };


    const reconnectToGame: RequestHandler<{
        gameCode: string;
    }, any, {
        sessionId: string;
        playerPosition: Player;
    }> = async (req, res) => {
        const { gameCode } = req.params;
        const { sessionId, playerPosition } = req.body;

        logger.info({ 
            gameCode, 
            sessionId, 
            playerPosition 
        }, 'Reconnect to game request received');

        try {
            const game = await gameService.findGame(gameCode);
            logger.debug({ gameCode, gameStatus: game.status }, 'Game found for reconnection');
            
            const player = game.players[playerPosition];
            if (player.sessionId !== sessionId) {
                logger.warn({ 
                    gameCode, 
                    sessionId, 
                    playerPosition,
                    playerSessionId: player.sessionId
                }, 'Invalid player session for reconnection');
                
                res.status(403).json({ error: 'Invalid player session' });
                return;
            }

            if (!player.connected) {
                logger.debug({ gameCode, playerPosition }, 'Reconnecting disconnected player');
                
                game.players[playerPosition].connected = true;
                game.players[playerPosition].lastActive = new Date();
                await game.save();
                
                logger.info({ gameCode, playerPosition }, 'Player reconnected successfully');
            } else {
                logger.debug({ gameCode, playerPosition }, 'Player already connected');
            }

            res.json(game.toClientJSON(playerPosition));
        } catch (error) {
            logger.error(error as Error, 'Error reconnecting to game', { 
                gameCode, 
                sessionId, 
                playerPosition 
            });
            
            if (error instanceof GameError) {
                res.status(error.code).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: error instanceof Error ? error.message : 'An unknown error occurred'
                });
            }
        }
    };


    const getGames: RequestHandler = async (req, res, next) => {
        logger.debug('Get all games request received');
        
        try {
            const games = await Game.find();
            logger.info({ count: games.length }, 'Retrieved games list');
            res.json(games);
        } catch (error) {
            logger.error(error as Error, 'Error retrieving games');
            next(error);
        }
    };

    const getGamesPlayers: RequestHandler = async (req, res, next) => {
        logger.debug('Get games players request received');
        
        try {
            const games = await Game.find();
            const playersWithGameCode = games.map(game => ({
                gameCode: game.gameCode,
                gameStatus: game.status,
                players: game.players
            }));
            
            logger.info({ count: games.length }, 'Retrieved games players data');
            
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(playersWithGameCode, null, 2));
        } catch (error) {
            logger.error(error as Error, 'Error retrieving games players');
            next(error);
        }
    };

    const deleteGames: RequestHandler = async (req, res, next) => {
        logger.warn('Delete all games request received');
        
        try {
            const result = await Game.deleteMany({});
            logger.info({ count: result.deletedCount }, 'All games deleted');
            res.json({ message: 'All games deleted', count: result.deletedCount });
        } catch (error) {
            logger.error(error as Error, 'Error deleting games');
            next(error);
        }
    };


    logger.debug('Setting up game router endpoints');
    gameRouter.delete('/', deleteGames);
    gameRouter.post('/join/:gameCode', joinGame);
    gameRouter.post('/', createGame);
    gameRouter.get('/', getGames);
    gameRouter.post('/reconnect/:gameCode', reconnectToGame);
    gameRouter.get('/players', getGamesPlayers);

    return gameRouter;
}

