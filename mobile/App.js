import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import MatchmakingScreen from './src/screens/MatchmakingScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import { initializeNakama, authenticateDevice } from './src/services/api';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Initialize Nakama client
      await initializeNakama();

      // Check for existing session
      const storedSession = await AsyncStorage.getItem('nakama_session');
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (sessionData.token && new Date(sessionData.expires_at) > new Date()) {
          setSession(sessionData);
          setIsAuthenticated(true);
        } else {
          // Session expired, try to refresh or re-authenticate
          await handleAuthentication();
        }
      } else {
        // No session, need to authenticate
        await handleAuthentication();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthentication = async () => {
    try {
      const sessionData = await authenticateDevice();
      await AsyncStorage.setItem('nakama_session', JSON.stringify(sessionData));
      setSession(sessionData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication failed:', error);
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('nakama_session');
    setSession(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // Or a loading screen component
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
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
                  onAuthenticated={(sessionData) => {
                    setSession(sessionData);
                    setIsAuthenticated(true);
                  }}
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
                    onLogout={handleLogout}
                  />
                )}
              </Stack.Screen>
              
              <Stack.Screen 
                name="Matchmaking"
                options={{ title: 'Finding Match...' }}
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
      </NavigationContainer>
    </>
  );
}
