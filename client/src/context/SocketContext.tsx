import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');

        if (user && token) {
            // Initialize socket
            // Assuming the backend is on port 3000 based on server.js
            const serverUrl = import.meta.env.VITE_API_SOCKET_URL || '';

            const newSocket = io(serverUrl, {
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err: any) => {
                console.error('Socket connection error:', err);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
