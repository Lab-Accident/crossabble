import { Router, RequestHandler } from 'express';
import { Game } from '../models/gameModel';
import { Session } from '../models/gameSessionModel';
import * as types from '../types/gameTypes';

const gameRouter = Router();

const createCell = (row: number, col: number): types.Cell => ({
  position: { row, col },
  state: types.CellState.Empty,
  letter: null,
  number: null,
  playedBy: null,
});



const joinGame: RequestHandler<{ gameCode: string }, any, { 
  preferredTeam?: types.Team;
  sessionId: string;
}> = async (req, res) => {
  try {
      const { gameCode } = req.params;
      const { preferredTeam, sessionId } = req.body;

      // Validate session exists
      const session = await Session.findOne({ sessionId });
      if (!session) {
          res.status(400).json({ error: 'Invalid session' });
          return;
      }

      // Find positions to try based on preference
      const eligiblePositions = preferredTeam
          ? [
              preferredTeam === types.Team.Team1 
                  ? types.Player.Team1_Player1 
                  : types.Player.Team2_Player1,
              preferredTeam === types.Team.Team1 
                  ? types.Player.Team1_Player2 
                  : types.Player.Team2_Player2
            ]
          : Object.values(types.Player);

      // Try to claim a position
      const game = await Game.findOneAndUpdate(
          {
              gameCode,
              status: types.GameStatus.Waiting,
              $or: eligiblePositions.map(pos => ({
                  [`players.${pos}.sessionId`]: null,
                  [`players.${pos}.connected`]: false
              }))
          },
          {
              $set: {
                  [`players.${eligiblePositions[0]}.sessionId`]: sessionId,
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

      // Update session with game info
      session.gameCode = gameCode;
      session.playerPosition = eligiblePositions[0];
      await session.save();

      res.json({
          game: game.toClientJSON(eligiblePositions[0]),
          playerPosition: eligiblePositions[0]
      });
  } catch (error) {
      res.status(500).json({ 
          error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
  }
};


const createGame: RequestHandler<{}, any, { 
  preferredTeam?: types.Team;
  sessionId: string; 
}> = async (req, res) => {
  try {
      const { preferredTeam, sessionId } = req.body;
      
      // Validate session exists
      const session = await Session.findOne({ sessionId });
      if (!session) {
          res.status(400).json({ error: 'Invalid session' });
          return;
      }
      
      // Generate game code
      const gameCode = Math.random().toString(36).substr(2, 4).toUpperCase();
      
      // Initialize player position based on preferred team
      const playerPosition = preferredTeam === types.Team.Team2 
          ? types.Player.Team2_Player1 
          : types.Player.Team1_Player1;

      // Create initial game state with players object
      const initialPlayers = {
          [types.Player.Team1_Player1]: {
              sessionId: playerPosition === types.Player.Team1_Player1 ? sessionId : null,
              connected: false,
              forfeited: false,
              lastActive: new Date()
          },
          [types.Player.Team1_Player2]: {
              sessionId: null,
              connected: false,
              forfeited: false,
              lastActive: new Date()
          },
          [types.Player.Team2_Player1]: {
              sessionId: playerPosition === types.Player.Team2_Player1 ? sessionId : null,
              connected: false,
              forfeited: false,
              lastActive: new Date()
          },
          [types.Player.Team2_Player2]: {
              sessionId: null,
              connected: false,
              forfeited: false,
              lastActive: new Date()
          }
      };

      // Create game
      const game = await Game.create({
          gameCode,
          status: types.GameStatus.Waiting,
          currentTurn: types.Player.Team1_Player1,
          players: initialPlayers,
          grid: Array(15).fill(null).map((_, row) => 
              Array(15).fill(null).map((_, col) => createCell(row, col))
          ),
          words: [],
          score: { team1: 0, team2: 0 }
      });

      // Update session with game info
      session.gameCode = gameCode;
      session.playerPosition = playerPosition;
      await session.save();

      res.json({
          game: game.toClientJSON(playerPosition),
          playerPosition
      });
  } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({ 
          error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
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