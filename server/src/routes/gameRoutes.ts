import { Router, RequestHandler } from 'express';
import { Game, ICell } from '../models/gameModel';
import * as types from '../types/gameTypes';
import { SocketService } from '../services/socketService';


let socketService: SocketService;
const gameRouter = Router();
export const initializeGameRouter = (socket: SocketService) => {
  socketService = socket;
  return gameRouter;
}


const createCell = (row: number, col: number): ICell => ({
  position: { row, col },
  state: types.CellState.Empty,
  letter: '',
  team: types.Team.None
});

const joinGame: RequestHandler<{ gameCode: string; }, any, { preferredTeam?: types.Team; }> = async (req, res, next) => {
  try {
    const { gameCode } = req.params;
    const { preferredTeam } = req.body;
    const sessionId = Math.random().toString(36).substring(2, 15);

    // Find positions to try, ordered by preference
    const positions = [
      types.Player.Team1_Player1,
      types.Player.Team1_Player2,
      types.Player.Team2_Player1,
      types.Player.Team2_Player2
    ];
    
    const eligiblePositions = preferredTeam
      ? positions.filter(pos => pos.startsWith(preferredTeam))
      : positions;

    // Try to atomically claim a position
    const game = await Game.findOneAndUpdate(
      { 
        gameCode,
        status: 'waiting',
        // Check all eligible positions in one query
        $or: eligiblePositions.map(pos => ({
          [`players.${pos}.connected`]: false
        }))
      },
      {
        $set: {
          [`players.${eligiblePositions[0]}.sessionId`]: sessionId,
          [`players.${eligiblePositions[0]}.connected`]: true,
          [`players.${eligiblePositions[0]}.forfeited`]: false,
          [`players.${eligiblePositions[0]}.lastActive`]: new Date()
        }
      },
      { new: true }
    );

    if (!game) {
      res.status(400).json({
        error: preferredTeam
          ? `No positions available on team ${preferredTeam}`
          : 'Game is full or not available'
      });
      return;
    }

    // Check if all players connected and update game status if needed
    const allConnected = Object.values(game.players).every(p => p.connected);
    if (allConnected) {
      game.status = 'active';
      await game.save();
      
      socketService.notifyGameUpdate(game.gameCode, 'game_started', {
          currentTurn: game.currentTurn
      });
  }

  res.json(game.toClientJSON(eligiblePositions[0]));
  } catch (error) {
    next(error);
  }
};

const createGame: RequestHandler<{}, any, { preferredTeam?: types.Team; }> = async (req, res, next) => {
  try {
    const { preferredTeam } = req.body;
    const sessionId = Math.random().toString(36).substring(2, 15);

    let gameCode;
    let exists = true;
    while (exists) {
      gameCode = Math.random().toString(36).substr(2, 4).toUpperCase();
      exists = (await Game.exists({ gameCode })) !== null;
    }

    const grid = Array(15).fill(null).map((_, row) => 
      Array(15).fill(null).map((_, col) => createCell(row, col))
    );

    const position = preferredTeam 
      ? `${preferredTeam}_Player1` as types.Player
      : types.Player.Team1_Player1;
  
    const game = await Game.create({
      gameCode,
      status: 'waiting',
      currentTurn: types.Player.Team1_Player1,
      grid,
      words: [],
      players: {
        [types.Player.Team1_Player1]: { connected: false},
        [types.Player.Team1_Player2]: { connected: false },
        [types.Player.Team2_Player1]: { connected: false },
        [types.Player.Team2_Player2]: { connected: false },
        [position]: {
          sessionId,
          connected: true,
          forfeited: false,
          lastActive: new Date()
        }
      },
      score: { team1: 0, team2: 0 }
    });

    if (!game) {
      res.status(500).json({ error: 'Failed to create game' });
      return;
    }

    res.json(game.toClientJSON(position));
  } catch (error) {
    next(error);
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

export default gameRouter;