import { Socket } from 'socket.io';
import { Session, ISession } from '../models/sessionModel';
import { eventMediator } from './eventMediator';
import { GameEventType } from '../types/eventTypes';
import logger from '../utils/logger';

export class SessionService {
    private activeSessions: Map<string, Socket>;
    private sessions: Map<string, { gameCode: string | null; playerPosition: any }>;

    constructor() {
        this.activeSessions = new Map();
        this.sessions = new Map();
        logger.info('SessionService initialized');
    }

    async validateAndUpdateSession(sessionId: string): Promise<ISession | null> {
        logger.debug({ sessionId }, 'Validating session');
        const session = await Session.findOne({ sessionId });
        
        if (session) {
            logger.debug({ sessionId, lastSeen: session.lastSeen }, 'Session found');
            session.lastSeen = new Date();
            await session.save();
            logger.debug({ sessionId }, 'Session updated');
            
            eventMediator.publish(GameEventType.SESSION_VALIDATED, {
                sessionId,
                session,
                valid: true
            });
        } else {
            logger.warn({ sessionId }, 'Session not found');
            eventMediator.publish(GameEventType.SESSION_VALIDATED, {
                sessionId,
                session: null,
                valid: false
            });
        }
        return session;
    }

    async createNewSession(): Promise<string> {
        const sessionId = Math.random().toString(36).substring(2, 15);
        logger.info({ sessionId }, 'Creating new session');
        
        try {
            await Session.create({
                sessionId,
                gameCode: null,
                playerPosition: null,
                lastSeen: new Date()
            });

            eventMediator.publish(GameEventType.SESSION_CREATED, {
                sessionId
            });

            logger.info({ sessionId }, 'New session created');
            return sessionId;
        } catch (error) {
            logger.error(error as Error, 'Error creating session', { sessionId });
            
            eventMediator.publish(GameEventType.GAME_ERROR, {
                error: error instanceof Error ? error.message : 'Failed to create session',
                context: 'sessionCreate'
            });
            
            throw error;
        }
    }

    setActiveSession(sessionId: string, socket: Socket) {
        logger.debug({ sessionId, socketId: socket.id }, 'Setting active session');
        this.activeSessions.set(sessionId, socket);
        
        // If the session isn't in the sessions map, add it with default values
        if (!this.sessions.has(sessionId)) {
            logger.debug({ sessionId }, 'Adding session to session data');
            this.sessions.set(sessionId, { gameCode: null, playerPosition: null });
        }
      }

    setSession(sessionId: string, data: { gameCode: string; playerPosition: any }) {
        logger.debug({ 
            sessionId, 
            gameCode: data.gameCode, 
            playerPosition: data.playerPosition 
        }, 'Updating session data');

        this.sessions.set(sessionId, data);

        eventMediator.publish(GameEventType.SESSION_UPDATED, {
            sessionId,
            gameCode: data.gameCode,
            playerPosition: data.playerPosition
        });
    }

    getSession(sessionId: string) {
        const session = this.sessions.get(sessionId);
        const found = !!session;
        
        logger.debug({ sessionId, found }, 'Getting session');
        return session;
    }

    removeSession(sessionId: string) {
        logger.info({ sessionId }, 'Removing session');
        this.sessions.delete(sessionId);
        this.activeSessions.delete(sessionId);

        eventMediator.publish(GameEventType.SESSION_REMOVED, {
            sessionId
        });
    }

    getActiveSessions(): Map<string, Socket> {
        const count = this.activeSessions.size;
        logger.debug({ count }, 'Getting active sessions');
        return this.activeSessions;
      }
}