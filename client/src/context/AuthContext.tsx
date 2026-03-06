import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { login as apiLogin, getCurrentUser, type User } from '../lib/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
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
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('access_token');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check for stored token and fetch user on mount
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await apiLogin({ username, password });
            localStorage.setItem('access_token', response.access_token);
            await fetchCurrentUser();
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('access_token');
    };

    const checkPermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
        if (!user) return false;
        if (user.is_superuser || user.role === 'admin') return true;

        const perm = user.permissions?.find(p => p.resource === resource);
        if (!perm) return false; // Default strict: if not explicit, then false. Or maybe true? No, secure by default.

        switch (action) {
            case 'create': return perm.can_create;
            case 'read': return perm.can_read;
            case 'update': return perm.can_update;
            case 'delete': return perm.can_delete;
            default: return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading, checkPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
