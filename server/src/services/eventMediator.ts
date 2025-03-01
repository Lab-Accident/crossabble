import { GameEventType, EventPayload } from '../types/eventTypes';
import logger from '../utils/logger';

export class EventMediator {
    private listeners: Record<GameEventType, Function[]> = {} as Record<GameEventType, Function[]>;    
    
    constructor() {
        // Initialize listener arrays for all event types
        Object.values(GameEventType).forEach(eventType => {
          this.listeners[eventType as GameEventType] = [];
        });

        logger.info('EventMediator initialized');
      }
      
      subscribe<T extends EventPayload>(eventType: GameEventType, callback: (payload: T) => void): () => void {
        this.listeners[eventType].push(callback as Function);
        
        const listenerCount = this.listeners[eventType].length;
        logger.debug({ eventType, listenerCount }, 'Subscribed to event');
    
        // Return unsubscribe function
        return () => {
          const beforeCount = this.listeners[eventType].length;
          this.listeners[eventType] = this.listeners[eventType].filter(
            listener => listener !== callback
          );
          const afterCount = this.listeners[eventType].length;
          
          const removed = beforeCount !== afterCount;
          logger.debug({ 
            eventType, 
            removed,
            beforeCount,
            afterCount
          }, 'Unsubscribed from event');
        };
      }
      
      publish<T extends EventPayload>(eventType: GameEventType, payload: T): void {
        const listenerCount = this.listeners[eventType]?.length || 0;
        
        // Create a safe version of the payload for logging to avoid circular references
        const safePayload = this.getSafePayload(payload);
        
        logger.debug({ 
          eventType, 
          listenerCount,
          payload: safePayload
        }, 'Publishing event');
        
        if (this.listeners[eventType]) {
          this.listeners[eventType].forEach(callback => {
            try {
              callback(payload);
            } catch (error) {
              logger.error(error as Error, 'Error in event listener', { 
                eventType,
                payload: safePayload
              });
            }
          });
          
          logger.debug({ eventType, listenerCount }, 'Event published successfully');
        } else {
          logger.warn({ eventType }, 'No listeners for event type');
        }
      }

      private getSafePayload(payload: any): any {
        if (!payload) return null;
        
        try {
          // For game objects, just return basic info
          if (payload.game) {
            return {
              ...payload,
              game: payload.game.gameCode ? {
                gameCode: payload.game.gameCode,
                status: payload.game.status
              } : 'Game object present'
            };
          }
          
          // For game arrays, simplify
          if (payload.games && Array.isArray(payload.games)) {
            return {
              ...payload,
              games: `Array of ${payload.games.length} games`
            };
          }
          
          // For session objects, simplify
          if (payload.session) {
            return {
              ...payload,
              session: payload.session.sessionId ? {
                sessionId: payload.session.sessionId,
                gameCode: payload.session.gameCode
              } : 'Session object present'
            };
          }
          
          return payload;
        } catch (error) {
          logger.debug({ error: (error as any).message }, 'Error creating safe payload for logging');
          return { safePayloadError: true };
        }
      }
    }
    
  
  // Export singleton instance
  export const eventMediator = new EventMediator();
