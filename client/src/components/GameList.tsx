import { useState, useEffect } from 'react';
import { GameData, Player } from '../../../server/src/types/gameTypes';
import { Socket } from 'socket.io-client';

interface CurrentGameState {
    game: GameData & { score: { team1: number; team2: number } };
    playerPosition: Player;
}

export const useGameState = (socket: typeof Socket | null) => {
    const [currentGame, setCurrentGame] = useState<CurrentGameState | null>(() => {
        const savedGame = localStorage.getItem('currentGame');
        return savedGame ? JSON.parse(savedGame) : null;
    });

    const [availableGames, setAvailableGames] = useState<GameData[]>([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('playerJoined', (data: { position: Player; gameState: GameData }) => {
            handleGameStateUpdate(data.gameState);
        });

        socket.on('gameStateUpdate', handleGameStateUpdate);

        return () => {
            socket.off('playerJoined');
            socket.off('gameStateUpdate');
        };
    }, [socket]);

    const handleGameStateUpdate = (gameState: GameData) => {
        setAvailableGames(prevGames => {
            const updatedGames = [...prevGames];
            const gameIndex = updatedGames.findIndex(g => g.gameCode === gameState.gameCode);
            if (gameIndex !== -1) {
                updatedGames[gameIndex] = gameState;
            } else {
                updatedGames.push(gameState);
            }
            return updatedGames;
        });

        setCurrentGame(current => {
            if (current?.game.gameCode === gameState.gameCode) {
                return {
                    ...current,
                    game: {
                        ...gameState,
                        score: current.game.score
                    }
                };
            }
            return current;
        });
    };

    return { currentGame, setCurrentGame, availableGames, setAvailableGames };
};
