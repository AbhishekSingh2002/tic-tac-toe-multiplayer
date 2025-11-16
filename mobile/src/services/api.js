import { Client } from '@heroiclabs/nakama-js';
import Constants from 'expo-constants';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

let client = null;
let session = null;

// Get config from app.json extra
const config = Constants.expoConfig?.extra || {};
const NAKAMA_HOST = config.nakamaHost || 'localhost';
const NAKAMA_PORT = config.nakamaPort || '7350';
const NAKAMA_USE_SSL = config.nakamaUseSSL || false;
const SERVER_KEY = config.serverKey || 'defaultkey';

/**
 * Initialize Nakama client
 */
export const initializeNakama = async () => {
  if (client) return client;

  client = new Client(SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT, NAKAMA_USE_SSL);
  return client;
};

/**
 * Get or create device ID
 */
const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = uuid.v4();
    await AsyncStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

/**
 * Authenticate with device ID
 */
export const authenticateDevice = async () => {
  if (!client) {
    await initializeNakama();
  }

  const deviceId = await getDeviceId();
  
  try {
    session = await client.authenticateDevice(deviceId, true);
    return session;
  } catch (error) {
    console.error('Device authentication failed:', error);
    throw error;
  }
};

/**
 * Get current session
 */
export const getSession = () => session;

/**
 * Set session (for restored sessions)
 */
export const setSession = (newSession) => {
  session = newSession;
};

/**
 * Get client instance
 */
export const getClient = () => client;

/**
 * Call RPC to find a match
 */
export const findMatch = async () => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await client.rpc(session, 'find_match', {});
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('Find match failed:', error);
    throw error;
  }
};

/**
 * Cancel matchmaking
 */
export const cancelMatchmaking = async (ticket) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await client.rpc(session, 'cancel_matchmaking', JSON.stringify({ ticket }));
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('Cancel matchmaking failed:', error);
    throw error;
  }
};

/**
 * Make a move in the game (Enhanced with error handling)
 */
export const makeMove = async (matchId, cellIndex) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const payload = JSON.stringify({
      match_id: matchId,
      cell_index: cellIndex,
    });
    
    const response = await client.rpc(session, 'make_move', payload);
    const result = JSON.parse(response.payload);
    
    return result;
  } catch (error) {
    // Enhanced error handling
    if (error.message) {
      const errorData = JSON.parse(error.message);
      throw new Error(errorData.message || 'Failed to make move');
    }
    throw error;
  }
};

/**
 * Request a rematch
 */
export const requestRematch = async (matchId) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const payload = JSON.stringify({ match_id: matchId });
    const response = await client.rpc(session, 'request_rematch', payload);
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('Request rematch failed:', error);
    throw error;
  }
};

/**
 * Get enhanced player statistics
 */
export const getPlayerStats = async () => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await client.rpc(session, 'get_player_stats', {});
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('Get player stats failed:', error);
    throw error;
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (limit = 50) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await client.rpc(session, 'get_leaderboard', JSON.stringify({ limit }));
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('Get leaderboard failed:', error);
    throw error;
  }
};

/**
 * Get analytics (admin only)
 */
export const getAnalytics = async () => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await client.rpc(session, 'get_analytics', {});
    return JSON.parse(response.payload);
  } catch (error) {
    console.error('Get analytics failed:', error);
    throw error;
  }
};

/**
 * Join match as spectator
 */
export const joinAsSpectator = async (matchId) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const socket = client.createSocket();
    await socket.connect(session);
    
    const match = await socket.joinMatch(matchId, { spectator: true });
    return { socket, match };
  } catch (error) {
    console.error('Join as spectator failed:', error);
    throw error;
  }
};

/**
 * List available matches to spectate
 */
export const listMatches = async () => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const matches = await client.listMatches(session, 0, 20, 2, true, '', '');
    return matches.matches || [];
  } catch (error) {
    console.error('List matches failed:', error);
    throw error;
  }
};

/**
 * Get account info
 */
export const getAccount = async () => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    return await client.getAccount(session);
  } catch (error) {
    console.error('Get account failed:', error);
    throw error;
  }
};

/**
 * Update display name
 */
export const updateDisplayName = async (displayName) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    await client.updateAccount(session, { display_name: displayName });
  } catch (error) {
    console.error('Update display name failed:', error);
    throw error;
  }
};

/**
 * Send chat message in match
 */
export const sendChatMessage = async (socket, matchId, message) => {
  if (!socket) {
    throw new Error('Socket not connected');
  }

  try {
    await socket.sendMatchState(
      matchId,
      1, // op_code for chat
      JSON.stringify({
        type: 'chat',
        message: message,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.error('Send chat message failed:', error);
    throw error;
  }
};

/**
 * Get match history
 */
export const getMatchHistory = async (limit = 10) => {
  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  try {
    const userId = session.user_id;
    const result = await client.readStorageObjects(session, {
      object_ids: [{
        collection: 'match_history',
        key: userId,
        user_id: userId
      }]
    });
    
    if (result.objects && result.objects.length > 0) {
      return JSON.parse(result.objects[0].value);
    }
    
    return [];
  } catch (error) {
    console.error('Get match history failed:', error);
    return [];
  }
};