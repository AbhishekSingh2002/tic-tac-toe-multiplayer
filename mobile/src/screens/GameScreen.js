import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { makeMove } from '../services/api';
import { on, off } from '../services/socket';
import Board from '../components/Board';

export default function GameScreen({ navigation, route, session }) {
  const { matchId } = route.params;
  const [gameState, setGameState] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  useEffect(() => {
    setupGameListeners();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (gameState && mySymbol) {
      setIsMyTurn(gameState.next_turn === mySymbol && gameState.status === 'active');
    }
  }, [gameState, mySymbol]);

  const setupGameListeners = () => {
    // Handle match joined - get initial state
    on('matchJoined', (data) => {
      console.log('Match joined:', data);
      setGameState(data.state);
      setMySymbol(data.your_symbol);
      setIsLoading(false);
    });

    // Handle game updates
    on('gameUpdate', (data) => {
      console.log('Game update:', data);
      setGameState(data.state);

      // Check if game ended
      if (data.game_status === 'win' || data.game_status === 'draw') {
        setTimeout(() => {
          navigation.replace('Result', {
            gameState: data.state,
            mySymbol,
            gameStatus: data.game_status,
          });
        }, 1500);
      }
    });

    // Handle game over
    on('gameOver', (data) => {
      console.log('Game over:', data);
      setGameState(data.state);
      
      setTimeout(() => {
        navigation.replace('Result', {
          gameState: data.state,
          mySymbol,
          reason: data.reason,
        });
      }, 1500);
    });

    // Handle opponent disconnection
    on('opponentDisconnected', () => {
      setOpponentDisconnected(true);
      Alert.alert(
        'Opponent Disconnected',
        'Your opponent has disconnected. They have 5 minutes to reconnect.',
        [{ text: 'OK' }]
      );
    });

    // Handle opponent reconnection
    on('playerReconnected', () => {
      setOpponentDisconnected(false);
      Alert.alert(
        'Opponent Reconnected',
        'Your opponent has reconnected. Game continues!',
        [{ text: 'OK' }]
      );
    });
  };

  const cleanup = () => {
    off('matchJoined');
    off('gameUpdate');
    off('gameOver');
    off('opponentDisconnected');
    off('playerReconnected');
  };

  const handleCellPress = async (cellIndex) => {
    if (!isMyTurn || !gameState) return;

    // Optimistic update
    const newBoard = [...gameState.board];
    newBoard[cellIndex] = mySymbol;
    setGameState({ ...gameState, board: newBoard });
    setIsMyTurn(false);

    try {
      await makeMove(matchId, cellIndex);
    } catch (error) {
      console.error('Move failed:', error);
      
      // Revert optimistic update
      setGameState(gameState);
      setIsMyTurn(true);
      
      Alert.alert('Error', error.message || 'Failed to make move. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const getOpponentSymbol = () => (mySymbol === 'X' ? 'O' : 'X');
  const currentTurnText = isMyTurn ? 'Your Turn' : `Opponent's Turn`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <View style={[styles.symbolBadge, styles.symbolBadgeX]}>
            <Text style={styles.symbolText}>X</Text>
          </View>
          <Text style={styles.playerLabel}>
            {mySymbol === 'X' ? 'You' : 'Opponent'}
          </Text>
        </View>

        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>{currentTurnText}</Text>
          {opponentDisconnected && (
            <Text style={styles.disconnectedText}>Opponent disconnected</Text>
          )}
        </View>

        <View style={styles.playerInfo}>
          <View style={[styles.symbolBadge, styles.symbolBadgeO]}>
            <Text style={styles.symbolText}>O</Text>
          </View>
          <Text style={styles.playerLabel}>
            {mySymbol === 'O' ? 'You' : 'Opponent'}
          </Text>
        </View>
      </View>

      <Board
        board={gameState?.board || Array(9).fill('')}
        onCellPress={handleCellPress}
        disabled={!isMyTurn || opponentDisconnected}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Playing as: <Text style={styles.boldText}>{mySymbol}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  playerInfo: {
    alignItems: 'center',
  },
  symbolBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  symbolBadgeX: {
    backgroundColor: '#3B82F6',
  },
  symbolBadgeO: {
    backgroundColor: '#EF4444',
  },
  symbolText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  turnIndicator: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  turnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  disconnectedText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#4F46E5',
  },
});
