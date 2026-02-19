import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, getCurrentUser, type User } from '../lib/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
        } catch (error) {
            await AsyncStorage.removeItem('access_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
                await fetchCurrentUser();
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await apiLogin(username, password);
        await AsyncStorage.setItem('access_token', response.access_token);
        await fetchCurrentUser();
    };

    const logout = async () => {
        await AsyncStorage.removeItem('access_token');
        setUser(null);
    };

    const checkPermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
        if (!user) return false;
        if (user.is_superuser || user.role === 'admin') return true;
        const perm = user.permissions?.find(p => p.resource === resource);
        if (!perm) return false;
        switch (action) {
            case 'create': return perm.can_create;
            case 'read': return perm.can_read;
            case 'update': return perm.can_update;
            case 'delete': return perm.can_delete;
            default: return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, checkPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
