import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { leaveMatch, disconnect } from '../services/socket';

export default function ResultScreen({ navigation, route, session }) {
  const { gameState, mySymbol, gameStatus, reason } = route.params;
  
  const isWinner = gameState?.winner_id === session?.user_id;
  const isDraw = gameState?.status === 'finished' && !gameState?.winner_id;
  
  let resultTitle = '';
  let resultColor = '';
  let resultMessage = '';

  if (reason === 'opponent_timeout') {
    resultTitle = 'You Win!';
    resultColor = '#10B981';
    resultMessage = 'Opponent timed out';
  } else if (isDraw) {
    resultTitle = "It's a Draw!";
    resultColor = '#F59E0B';
    resultMessage = 'Well played by both sides';
  } else if (isWinner) {
    resultTitle = 'You Win!';
    resultColor = '#10B981';
    resultMessage = 'Congratulations!';
  } else {
    resultTitle = 'You Lost';
    resultColor = '#EF4444';
    resultMessage = 'Better luck next time';
  }

  const handlePlayAgain = async () => {
    await leaveMatch();
    navigation.navigate('Matchmaking');
  };

  const handleBackToLobby = async () => {
    await leaveMatch();
    await disconnect();
    navigation.navigate('Lobby');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.resultBadge, { backgroundColor: resultColor }]}>
          <Text style={styles.resultIcon}>
            {isDraw ? '🤝' : isWinner ? '🏆' : '😔'}
          </Text>
        </View>

        <Text style={[styles.resultTitle, { color: resultColor }]}>
          {resultTitle}
        </Text>
        
        <Text style={styles.resultMessage}>{resultMessage}</Text>

        {/* Game Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Match Summary</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Your Symbol</Text>
            <Text style={styles.statValue}>{mySymbol}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Moves</Text>
            <Text style={styles.statValue}>
              {gameState?.move_history?.length || 0}
            </Text>
          </View>

          {!isDraw && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Winner</Text>
              <Text style={styles.statValue}>
                {isWinner ? 'You' : 'Opponent'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleBackToLobby}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Back to Lobby
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  resultIcon: {
    fontSize: 60,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  button: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#4F46E5',
  },
});
