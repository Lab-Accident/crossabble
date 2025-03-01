import { Game, IGame } from '../models/gameModel';
import { Session } from '../models/sessionModel';
import { Player, PlayerState } from '../types/gameTypes';
import { GameEventType } from '../types/eventTypes';
import { registry } from './registry';
import logger from '../utils/logger';

export class GameStateManager {
    constructor() {
        logger.info('GameStateManager initialized');
    }

    async cleanupStalePlayers(game: IGame): Promise<boolean> {
        logger.debug({ gameCode: game.gameCode }, 'Starting cleanup of stale players');

        let wasChanged = false;
        try {
            // Convert to plain JavaScript object to remove Mongoose internals
            const gameData = game.toObject();
            
            // Get session IDs directly from the plain object
            const sessionIds = (Object.values(gameData.players) as PlayerState[])
                .filter((player) => player.sessionId !== null)
                .map((player) => player.sessionId) as string[];
            
            logger.debug({ gameCode: game.gameCode, sessionCount: sessionIds.length, sessionIds }, 'Found session IDs');

            if (sessionIds.length === 0) {
                logger.debug({ gameCode: game.gameCode }, 'No sessions to check, skipping cleanup');
                return false;
            }
            const existingSessions = await Session.find({ 
                sessionId: { $in: sessionIds } 
            });
            
            const validSessionIds = new Set(existingSessions.map(s => s.sessionId));
            logger.debug({ 
                gameCode: game.gameCode, 
                validCount: validSessionIds.size,
                totalCount: sessionIds.length
            }, 'Found valid sessions');
    
            const updates: Record<string, any> = {};
            const invalidSessions: string[] = [];

            Object.entries(gameData.players).forEach(([position, player]) => {
                const typedPlayer = player as PlayerState;
                if (typedPlayer.sessionId && !validSessionIds.has(typedPlayer.sessionId)) {
                    logger.debug({ 
                        gameCode: game.gameCode, 
                        position, 
                        sessionId: typedPlayer.sessionId 
                    }, 'Found invalid session to clean up');
                    
                    updates[`players.${position}`] = {
                        ...typedPlayer,
                        sessionId: null,
                        connected: false,
                        lastActive: new Date()
                    };
                    invalidSessions.push(typedPlayer.sessionId);
                    wasChanged = true;
                }
            });
    
            if (wasChanged) {
                logger.info({ 
                    gameCode: game.gameCode, 
                    invalidCount: invalidSessions.length,
                    positions: Object.keys(updates).map(p => p.replace('players.', ''))
                }, 'Applying player cleanup updates');
                
                await Game.updateOne({ _id: game._id }, { $set: updates });
                const updatedGame = await Game.findById(game._id);

                Object.keys(updates).forEach(key => {
                    const [_, position] = key.split('.');
                    if (position && game.players[position as Player]) {
                        game.players[position as Player] = {
                            ...game.players[position as Player],
                            sessionId: null,
                            connected: false,
                            lastActive: new Date()
                        };
                    }
                });

                logger.debug({ gameCode: game.gameCode }, 'Publishing game state update event');
                registry.eventMediator.publish(GameEventType.GAME_STATE_UPDATED, {
                    game: updatedGame!,
                    gameCode: game.gameCode
                });
                
                // Add specific player state changed event
                logger.debug({ sessionId: invalidSessions[0] }, 'Publishing player state changed event');
                registry.eventMediator.publish(GameEventType.PLAYER_STATE_CHANGED, {
                    sessionId: sessionIds[0],
                    connected: false
                });
            } else {
                logger.debug({ gameCode: game.gameCode }, 'No stale players found, no changes needed');
            }

            return wasChanged;

        } catch (error) {
            logger.error(error as Error, 'Error during player cleanup', { gameCode: game.gameCode });
            registry.eventMediator.publish(GameEventType.GAME_ERROR, {
                error: error instanceof Error ? error.message : 'Error during player cleanup',
                gameCode: game.gameCode
            });
            return false;
        }
    }

    async handlePlayerStateChange(
        game: IGame,
        position: Player,
        updates: {
            sessionId: string | null;
            connected: boolean;
            lastActive: Date;
          }
    ): Promise<void> {
        logger.debug({ 
            gameCode: game.gameCode, 
            position, 
            sessionId: updates.sessionId,
            connected: updates.connected
        }, 'Handling player state change');

        if (!game.players[position]) {
            logger.warn({ gameCode: game.gameCode, position }, 'Player position not found in game');
            return;
        }

        try {
            // Update player state
            game.players[position] = {
                ...game.players[position],
                ...updates
            };

            logger.debug({ gameCode: game.gameCode, position }, 'Player state updated, saving game');

            // Save game state and notify clients
            await this.updateGameState(game, game.gameCode);
        
            logger.info({ 
                gameCode: game.gameCode, 
                position, 
                connected: updates.connected
            }, 'Player state change completed');
            
        } catch (error) {
            logger.error(error as Error, 'Error updating player state', { 
                gameCode: game.gameCode, 
                position 
            });
            
            throw new Error('Failed to update player state');
        }
    }

    async updateGameState(game: IGame, gameCode: string): Promise<void> {
        if (!game) {
            logger.warn({ gameCode }, 'Cannot update null game state');
            return;
        }
        
        try {
            logger.debug({ gameCode }, 'Saving game state');
            await game.save();
            
            logger.debug({ gameCode }, 'Publishing game state update');

            // Publish the updated game state
            registry.eventMediator.publish(GameEventType.GAME_STATE_UPDATED, {
                game,
                gameCode
            });
            
            logger.debug({ gameCode }, 'Fetching all games for list update');
            const games = await Game.find();

            // Publish game list update
            registry.eventMediator.publish(GameEventType.GAME_LIST_UPDATED, {
                games
            });
            
            logger.info({ gameCode, gameCount: games.length }, 'Game state update published');

        } catch (error) {
            logger.error(error as Error, 'Error updating game state', { gameCode });

            // Add error event
            registry.eventMediator.publish(GameEventType.GAME_ERROR, {
                error: error instanceof Error ? error.message : 'Failed to update game state'
            });
            
            throw new Error('Failed to update game state');
        }
    }
}

