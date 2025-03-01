import { IGame } from '../models/gameModel';
import { ISession } from '../models/sessionModel';
import { Player } from './gameTypes';

export enum GameEventType {
    GAME_CREATED = 'gameCreated',
    GAME_JOINED = 'gameJoined',
    PLAYER_DISCONNECTED = 'playerDisconnected',
    GAME_STATE_UPDATED = 'gameStateUpdated',
    GAME_LIST_UPDATED = 'gameListUpdated',
    PLAYER_STATE_CHANGED = 'playerStateChanged',
    GAME_ERROR = 'gameError',
    SESSION_CREATED = 'sessionCreated',
    SESSION_UPDATED = 'sessionUpdated',
    SESSION_REMOVED = 'sessionRemoved',
    SESSION_VALIDATED = 'sessionValidated'
  }
  
  export interface GameCreatedPayload {
    game: IGame;
    gameCode: string;
  }
  
  export interface GameJoinedPayload {
    game: IGame;
    gameCode: string;
    playerPosition: string;
    sessionId: string;
  }
  
  export interface PlayerDisconnectedPayload {
    game: IGame;
    gameCode: string;
    sessionId: string;
  }
  
  export interface GameStateUpdatedPayload {
    game: IGame;
    gameCode: string;
  }
  
  export interface GameListUpdatedPayload {
    games: IGame[];
  }

  export interface PlayerStateChangedPayload {
    sessionId: string;
    connected: boolean;
  }

  export interface GameErrorPayload {
    error: string;
  }

  export interface SessionCreatedPayload {
    sessionId: string;
}

export interface SessionUpdatedPayload {
    sessionId: string;
    gameCode: string | null;
    playerPosition: Player | null;
}

export interface SessionRemovedPayload {
    sessionId: string;
}

export interface SessionValidatedPayload {
    sessionId: string;
    session: ISession | null;
    valid: boolean;
}

  
  export type EventPayload = 
    | GameCreatedPayload
    | GameJoinedPayload
    | PlayerDisconnectedPayload 
    | GameStateUpdatedPayload
    | GameListUpdatedPayload
    | PlayerStateChangedPayload
    | GameErrorPayload
    | SessionCreatedPayload
    | SessionUpdatedPayload
    | SessionRemovedPayload
    | SessionValidatedPayload;