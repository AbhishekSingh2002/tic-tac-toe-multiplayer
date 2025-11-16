import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { findMatch, cancelMatchmaking } from '../services/api';
import { createSocket, on, off, joinMatch } from '../services/socket';

export default function MatchmakingScreen({ navigation, session }) {
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState('Searching for opponents...');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    startMatchmaking();
    setupRealtimeListeners();

    return () => {
      cleanup();
    };
  }, []);

  const startMatchmaking = async () => {
    try {
      // Create socket connection
      await createSocket();

      // Request matchmaking
      const response = await findMatch();
      setTicket(response.ticket);
      setStatus('Finding a worthy opponent...');
    } catch (error) {
      console.error('Matchmaking failed:', error);
      Alert.alert(
        'Error',
        'Failed to start matchmaking. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for match found
    on('matchFound', async (matched) => {
      console.log('Match found!', matched);
      setStatus('Match found! Joining game...');

      try {
        // Join the match
        await joinMatch(matched.match_id);
        
        // Navigate to game screen
        setTimeout(() => {
          navigation.replace('Game', {
            matchId: matched.match_id,
            token: matched.token,
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to join match:', error);
        Alert.alert(
          'Error',
          'Failed to join the match. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    });

    // Listen for errors
    on('error', (error) => {
      console.error('Socket error:', error);
      Alert.alert(
        'Connection Error',
        'Lost connection to server. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    });
  };

  const cleanup = () => {
    off('matchFound');
    off('error');
  };

  const handleCancel = async () => {
    if (!ticket || isCancelling) return;

    setIsCancelling(true);

    try {
      await cancelMatchmaking(ticket);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to cancel matchmaking:', error);
      // Go back anyway
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#4F46E5" />
        
        <Text style={styles.statusText}>{status}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            We're finding you the best opponent based on your skill level.
            This usually takes less than a minute.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
          onPress={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel</Text>
          )}
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
  statusText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 32,
    width: '100%',
    maxWidth: 400,
  },
  infoText: {
    fontSize: 16,
    color: '#4F46E5',
    textAlign: 'center',
    lineHeight: 24,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
