import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <SocketProvider>
          <StatusBar style="light" backgroundColor="#0F0F1A" />
          <RootNavigator />
        </SocketProvider>
      </NavigationContainer>
    </AuthProvider>
  );
}
