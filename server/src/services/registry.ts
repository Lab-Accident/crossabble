import { Server } from 'socket.io';
import { GameService } from './gameService';
import { SessionService } from './sessionService';
import { eventMediator } from './eventMediator';
import { GameStateManager } from './gameStateManager';
import logger from '../utils/logger';

/**
 * Simple service registry to break circular dependencies
 * and provide global access to services without direct imports
 */
export class Registry {
  // Core services
  public eventMediator = eventMediator;
  private _gameStateManager: GameStateManager | null = null;
  private _sessionService: SessionService | null = null;
  private _gameService: GameService | null = null;
  private _io: Server | null = null;

  constructor() {
    logger.info('Registry instance created');
  }

  // Initialize the service registry with core services
  public initialize(io: Server): void {
    try {
      logger.info('Initializing registry services');
      this._io = io;
      
      logger.debug('Creating GameStateManager');
      this._gameStateManager = new GameStateManager();
      
      logger.debug('Creating SessionService');
      this._sessionService = new SessionService();
      
      logger.debug('Creating GameService');
      this._gameService = new GameService();

      logger.info({
        services: [
          'GameStateManager',
          'SessionService',
          'GameService'
        ]
      }, 'Services initialized successfully');
      
    } catch (error) {
      logger.error(error as Error, 'Failed to initialize services');
      throw error;
    }
  }

  public get servicesInitialized(): boolean {
    return !!(this._io && this._gameStateManager && this._sessionService && this._gameService);
  }

  // Getters to ensure services are initialized before access
  public get gameStateManager(): GameStateManager {
    if (!this._gameStateManager) {
      logger.error('Attempted to access uninitialized GameStateManager');
      throw new Error('GameStateManager is not initialized');
    }
    return this._gameStateManager;
  }

  public get sessionService(): SessionService {
    if (!this._sessionService) {
      logger.error('Attempted to access uninitialized SessionService');
      throw new Error('SessionManager is not initialized');
    }
    return this._sessionService;
  }

  public get gameService(): GameService {
    if (!this._gameService) {
      logger.error('Attempted to access uninitialized GameService');
      throw new Error('GameService is not initialized');
    }
    return this._gameService;
  }

  public get io(): Server {
    if (!this._io) {
      logger.error('Attempted to access uninitialized Server instance');
      throw new Error('Server is not initialized');
    }
    return this._io;
  }
}

export const registry = new Registry();
