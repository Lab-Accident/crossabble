import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Game } from './models/gameModel';
import * as types from './types/gameTypes';

interface GameSocket extends Socket {
    gameData?: {
        gameCode: string;
        sessionId: string;
        playerPosition: types.Player;
    };
}

export const initializeSocketIO = (httpServer: HTTPServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket: GameSocket, next) => {
        const { gameCode, sessionId, playerPosition } = socket.handshake.auth;
        
        if (!gameCode || !sessionId || !playerPosition) {
            return next(new Error('Authentication error'));
        }

        socket.gameData = { gameCode, sessionId, playerPosition };
        next();
    });

    io.on('connection', (socket: GameSocket) => {
        console.log('Client connected:', socket.id);

        socket.on('join_game', async (gameCode: string) => {
            if (socket.gameData?.gameCode !== gameCode) {
                socket.disconnect();
                return;
            }

            socket.join(gameCode);
            
            // Update player connection status
            try {
                const game = await Game.findOne({ gameCode });
                if (!game) return;

                const playerPos = socket.gameData.playerPosition;
                game.players[playerPos].connected = true;
                game.players[playerPos].lastActive = new Date();
                await game.save();

                // Check if all players are connected
                const allConnected = Object.values(game.players)
                    .every(p => p.connected);

                if (allConnected && game.status === 'waiting') {
                    game.status = 'active';
                    await game.save();

                    io.to(gameCode).emit('game_started', {
                        currentTurn: game.currentTurn
                    });
                }
            } catch (error) {
                console.error('Error updating player connection:', error);
            }
        });

        socket.on('disconnect', async () => {
            if (!socket.gameData) return;

            try {
                const game = await Game.findOne({ 
                    gameCode: socket.gameData.gameCode 
                });
                if (!game) return;

                const playerPos = socket.gameData.playerPosition;
                game.players[playerPos].connected = false;
                await game.save();

                io.to(socket.gameData.gameCode).emit('game_status_update', {
                    disconnectedPlayer: playerPos
                });
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    });

    return io;
};