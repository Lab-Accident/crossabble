import { Server, Socket } from 'socket.io';
import { Game, IGame } from '../models/gameModel';
import { Session } from '../models/gameSessionModel';
import * as types from '../types/gameTypes';

interface ClientToServerEvents {
  joinGame: (data: { gameCode: string; sessionId: string }) => void;
  leaveGame: () => void;
  requestGameState: (gameCode: string) => void;
}

interface ServerToClientEvents {
  gameStateUpdate: (gameState: any) => void;
  gameStarted: (data: { currentTurn: types.Player }) => void;
  playerJoined: (data: { position: types.Player; gameState: any }) => void;
  error: (error: { message: string }) => void;
  session: (data: { sessionId: string }) => void;
}

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private sessions: Map<string, { gameCode?: string | null; playerPosition?: types.Player }> = new Map();

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
          origin: process.env.CLIENT_URL || 'http://localhost:5173',
          methods: ['GET', 'POST']
      }
  });

  this.setupSocketHandlers();
}

private setupSocketHandlers() {
  this.io.use(async (socket, next) => {
      try {
          // Check for existing sessionId in auth
          const existingSessionId = socket.handshake.auth.sessionId;
          
          if (existingSessionId) {
              // Try to find existing session
              const existingSession = await Session.findOne({ sessionId: existingSessionId });
              if (existingSession) {
                  // Update lastSeen
                  existingSession.lastSeen = new Date();
                  await existingSession.save();
                  
                  // Restore session
                  socket.data.sessionId = existingSessionId;
                  this.sessions.set(existingSessionId, {
                      gameCode: existingSession.gameCode,
                      playerPosition: existingSession.playerPosition ?? undefined
                  });
                  
                  // If there's an active game, rejoin the room
                  if (existingSession.gameCode) {
                      socket.join(existingSession.gameCode);
                  }
                  
                  socket.emit('session', { sessionId: existingSessionId });
                  next();
                  return;
              }
          }
          
          // If no valid existing session, create new one
          const sessionId = this.generateSessionId();
          socket.data.sessionId = sessionId;
          
          await Session.create({
              sessionId: sessionId,
              gameCode: '',
              playerPosition: types.Player.Team1_Player1,
              lastSeen: new Date()
          });
          
          this.sessions.set(sessionId, {});
          socket.emit('session', { sessionId });
          next();
      } catch (error) {
          console.error('Session initialization error:', error);
          next(new Error('Failed to initialize session'));
      }
  });

    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id, 'Session:', socket.data.sessionId);

      const sessionData = this.sessions.get(socket.data.sessionId);
        if (sessionData?.gameCode) {
            socket.join(sessionData.gameCode);
            // Optionally emit current game state
            this.emitGameState(sessionData.gameCode);
        }

      socket.on('joinGame', async (data: { gameCode: string; preferredTeam?: types.Team }) => {
        try {
          const { gameCode, preferredTeam } = data;
          const sessionId = socket.data.sessionId;

          const game = await Game.findOne({ gameCode });
          if (!game) {
              socket.emit('error', { message: 'Game not found' });
              return;
          }

          // Find player position by sessionId
          const position = this.findAvailablePosition(game, preferredTeam);
          if (!position) {
              socket.emit('error', { message: 'No positions available' });
              return;
          }

          // Update session tracking
          this.sessions.set(sessionId, {
            gameCode,
            playerPosition: position
          });

          // Update game state
          game.players[position].sessionId = sessionId;
          game.players[position].connected = true;
          game.players[position].lastActive = new Date();
          await game.save();

          /// Join socket room
          socket.join(gameCode);

          // Notify clients
          this.io.to(gameCode).emit('playerJoined', {
              position,
              gameState: game.toClientJSON()
          });

          // Check if game should start
          this.checkGameStart(game);

        } catch (error) {
          console.error('Error in joinGame:', error);
          socket.emit('error', { message: 'Failed to join game' });
        }
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async emitGameState(gameCode: string) {
    try {
        const game = await Game.findOne({ gameCode });
        if (game) {
            this.io.to(gameCode).emit('gameStateUpdate', game.toClientJSON());
        }
    } catch (error) {
        console.error('Error emitting game state:', error);
    }
}

  private findAvailablePosition(game: IGame, preferredTeam?: types.Team): types.Player | null {
    const positions = preferredTeam 
        ? this.getTeamPositions(preferredTeam)
        : Object.values(types.Player);

    return positions.find(pos => 
        !game.players[pos].connected && !game.players[pos].sessionId
    ) || null;
  }

  private getTeamPositions(team: types.Team): types.Player[] {
    return team === types.Team.Team1
        ? [types.Player.Team1_Player1, types.Player.Team1_Player2]
        : [types.Player.Team2_Player1, types.Player.Team2_Player2];
  }

  private async checkGameStart(game: IGame) {
    const allConnected = Object.values(game.players)
        .map(player => player.connected)
        .every(connected => connected);

    if (allConnected && game.status === types.GameStatus.Waiting) {
        game.status = types.GameStatus.Active;
        game.turnStartedAt = new Date();
        await game.save();

        this.io.to(game.gameCode).emit('gameStarted', {
            currentTurn: game.currentTurn
        });
    }
  }

  private async handleDisconnect(socket: Socket) {
    const sessionId = socket.data.sessionId;
    const sessionData = this.sessions.get(sessionId);

    if (sessionData?.gameCode && sessionData.playerPosition) {
        const game = await Game.findOne({ gameCode: sessionData.gameCode });
        if (game) {
            game.players[sessionData.playerPosition].connected = false;
            await game.save();

            this.io.to(sessionData.gameCode).emit('gameStateUpdate', 
                game.toClientJSON()
            );
        }
    }

    this.sessions.delete(sessionId);
  }
}

// Export a function to create the service
export const createSocketService = (server: any) => {
  return new SocketService(server);
};