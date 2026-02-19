import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../lib/api';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let newSocket: Socket | null = null;

        const initSocket = async () => {
            const token = await AsyncStorage.getItem('access_token');
            if (user && token) {
                newSocket = io(API_BASE_URL, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                });

                newSocket.on('connect', () => {
                    console.log('Socket connected:', newSocket?.id);
                    setIsConnected(true);
                });

                newSocket.on('disconnect', () => {
                    setIsConnected(false);
                });

                newSocket.on('connect_error', (err) => {
                    console.error('Socket error:', err.message);
                });

                setSocket(newSocket);
            }
        };

        initSocket();

        return () => {
            newSocket?.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
