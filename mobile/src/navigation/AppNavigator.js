import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from '../screens/AuthScreen';
import LobbyScreen from '../screens/LobbyScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createNativeStackNavigator();

/**
 * Main application navigator that handles the navigation flow
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Object} props.session - User session object
 * @param {Function} props.onAuthenticated - Callback when authentication is successful
 * @param {Function} props.onLogout - Callback when user logs out
 */
const AppNavigator = ({ isAuthenticated, session, onAuthenticated, onLogout }) => {
  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Lobby" : "Auth"}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen 
          name="Auth" 
          options={{ headerShown: false }}
        >
          {props => (
            <AuthScreen 
              {...props} 
              onAuthenticated={onAuthenticated}
            />
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen 
            name="Lobby"
            options={{
              title: 'Tic-Tac-Toe',
              headerRight: () => null,
            }}
          >
            {props => (
              <LobbyScreen 
                {...props} 
                session={session}
                onLogout={onLogout}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen 
            name="Matchmaking"
            options={{ 
              title: 'Finding Match...',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          >
            {props => <MatchmakingScreen {...props} session={session} />}
          </Stack.Screen>
          
          <Stack.Screen 
            name="Game"
            options={{ 
              title: 'Game',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          >
            {props => <GameScreen {...props} session={session} />}
          </Stack.Screen>
          
          <Stack.Screen 
            name="Result"
            options={{ 
              title: 'Game Over',
              headerLeft: () => null,
            }}
          >
            {props => <ResultScreen {...props} session={session} />}
          </Stack.Screen>
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
