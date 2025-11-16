import { getClient, getSession } from './api';

let socket = null;
let matchId = null;
let eventHandlers = {};

/**
 * Create realtime socket connection
 */
export const createSocket = async () => {
  const client = getClient();
  const session = getSession();

  if (!client || !session) {
    throw new Error('Not authenticated');
  }

  if (socket) {
    return socket;
  }

  socket = client.createSocket(false, false);
  
  // Connect socket
  await socket.connect(session);
  
  console.log('Socket connected');
  
  // Setup socket event listeners
  setupSocketListeners();
  
  return socket;
};

/**
 * Setup socket event listeners
 */
const setupSocketListeners = () => {
  if (!socket) return;

  // Handle matchmaker matched
  socket.onmatchmakermatched = (matched) => {
    console.log('Match found:', matched);
    matchId = matched.match_id;
    
    if (eventHandlers.matchFound) {
      eventHandlers.matchFound(matched);
    }
  };

  // Handle match data
  socket.onmatchdata = (matchData) => {
    console.log('Match data received:', matchData);
    
    try {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(matchData.data));
      
      handleMatchMessage(data);
    } catch (error) {
      console.error('Failed to parse match data:', error);
    }
  };

  // Handle match presence changes
  socket.onmatchpresence = (presence) => {
    console.log('Match presence:', presence);
    
    if (eventHandlers.presenceChange) {
      eventHandlers.presenceChange(presence);
    }
  };

  // Handle disconnection
  socket.ondisconnect = () => {
    console.log('Socket disconnected');
    socket = null;
    
    if (eventHandlers.disconnect) {
      eventHandlers.disconnect();
    }
  };

  // Handle errors
  socket.onerror = (error) => {
    console.error('Socket error:', error);
    
    if (eventHandlers.error) {
      eventHandlers.error(error);
    }
  };
};

/**
 * Handle different types of match messages
 */
const handleMatchMessage = (data) => {
  const { type } = data;

  switch (type) {
    case 'match_joined':
      if (eventHandlers.matchJoined) {
        eventHandlers.matchJoined(data);
      }
      break;

    case 'game_update':
      if (eventHandlers.gameUpdate) {
        eventHandlers.gameUpdate(data);
      }
      break;

    case 'game_over':
      if (eventHandlers.gameOver) {
        eventHandlers.gameOver(data);
      }
      break;

    case 'opponent_disconnected':
      if (eventHandlers.opponentDisconnected) {
        eventHandlers.opponentDisconnected(data);
      }
      break;

    case 'player_reconnected':
      if (eventHandlers.playerReconnected) {
        eventHandlers.playerReconnected(data);
      }
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

/**
 * Join a match
 */
export const joinMatch = async (matchIdToJoin) => {
  if (!socket) {
    await createSocket();
  }

  try {
    matchId = matchIdToJoin;
    const match = await socket.joinMatch(matchId);
    console.log('Joined match:', match);
    return match;
  } catch (error) {
    console.error('Failed to join match:', error);
    throw error;
  }
};

/**
 * Leave current match
 */
export const leaveMatch = async () => {
  if (!socket || !matchId) {
    return;
  }

  try {
    await socket.leaveMatch(matchId);
    console.log('Left match');
    matchId = null;
  } catch (error) {
    console.error('Failed to leave match:', error);
  }
};

/**
 * Register event handler
 */
export const on = (event, handler) => {
  eventHandlers[event] = handler;
};

/**
 * Unregister event handler
 */
export const off = (event) => {
  delete eventHandlers[event];
};

/**
 * Unregister all event handlers
 */
export const offAll = () => {
  eventHandlers = {};
};

/**
 * Disconnect socket
 */
export const disconnect = async () => {
  if (socket) {
    await leaveMatch();
    socket.disconnect();
    socket = null;
  }
  
  offAll();
};

/**
 * Get current match ID
 */
export const getCurrentMatchId = () => matchId;

/**
 * Check if socket is connected
 */
export const isConnected = () => {
  return socket !== null;
};
