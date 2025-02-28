import { Router, RequestHandler } from 'express';
import { Game } from '../models/gameModel';
import * as types from '../types/gameTypes';
import { Team, Player } from '../types/gameTypes';
import { GameService, GameError } from '../services/gameService';

export function createGameRouter(gameService: GameService) {
    const gameRouter = Router();

    const joinGame: RequestHandler<{ gameCode: string }, any, { 
        preferredTeam?: types.Team;
        sessionId: string;
    }> = async (req, res) => {
        try {
            const { gameCode } = req.params;
            const { preferredTeam, sessionId } = req.body;

            console.log(`[GameRouter] Join game request for ${gameCode} from session ${sessionId}, team preference: ${preferredTeam || 'none'}`);

            const result = await gameService.joinGame(sessionId, gameCode, preferredTeam);
            
            console.log(`[GameRouter] Join successful for ${gameCode}, position: ${result.playerPosition}`);
            console.log(`[GameRouter] Game player state after join: ${JSON.stringify(result.game.players)}`);
            

            res.json({
                game: result.game,
                playerPosition: result.playerPosition
            });
        } catch (error) {
            console.error(`[GameRouter] Error joining game:`, error);
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
        try {
            const { preferredTeam, sessionId, gameSize } = req.body;
            console.log('Creating game with team:', preferredTeam, 'and size:', gameSize, 'for session:', sessionId);
            const result = await gameService.createGame(sessionId, preferredTeam, gameSize);
            console.log('Game created:', result.game.gameCode);
            console.log('Player position:', result.game.players);
            res.json({
                game: result.game,
                playerPosition: result.playerPosition
            });
        } catch (error) {
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
        try {
            const { gameCode } = req.params;
            const { sessionId, playerPosition } = req.body;

            const game = await gameService.findGame(gameCode);
            
            const player = game.players[playerPosition];
            if (player.sessionId !== sessionId) {
                res.status(403).json({ error: 'Invalid player session' });
                return;
            }

            if (!player.connected) {
                game.players[playerPosition].connected = true;
                game.players[playerPosition].lastActive = new Date();
                await game.save();
            }

            res.json(game.toClientJSON(playerPosition));
        } catch (error) {
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
    try {
        const games = await Game.find();
        res.json(games);
    } catch (error) {
        next(error);
    }
    };

    const getGamesPlayers: RequestHandler = async (req, res, next) => {
        try {
            const games = await Game.find();
            const playersWithGameCode = games.map(game => ({
                gameCode: game.gameCode,
                gameStatus: game.status,
                players: game.players
            }));
            
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(playersWithGameCode, null, 2));
        } catch (error) {
            next(error);
        }
    };

    const deleteGames: RequestHandler = async (req, res, next) => {
    try {
        await Game.deleteMany({});
        res.json({ message: 'All games deleted' });
    } catch (error) {
        next(error);
    }
    };



    gameRouter.delete('/', deleteGames);
    gameRouter.post('/join/:gameCode', joinGame);
    gameRouter.post('/', createGame);
    gameRouter.get('/', getGames);
    gameRouter.post('/reconnect/:gameCode', reconnectToGame);
    gameRouter.get('/players', getGamesPlayers);

    return gameRouter;
}

