import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.4.146:3000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ─── Types ───────────────────────────────────────────
export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    role?: string;
    branch_id?: number | null;
    permissions?: RolePermission[];
}

export interface RolePermission {
    id?: number;
    role: string;
    resource: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
}

export interface Product {
    id: number;
    sku: string;
    name: string;
    description?: string;
    price: number;
    cost_price: number;
    quantity_in_stock: number;
    supplier_id?: number;
    image?: string;
}

// ... (other interfaces)


export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: string;
}

export interface POSOrder {
    id: number;
    order_number: string;
    created_at: string;
    total_amount: number;
    status: string;
    customer_name?: string;
    payment_method?: string;
    items: {
        id: number;
        product_id: number;
        product_name?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }[];
}

export interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: number;
}

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    is_read: boolean;
    createdAt: string;
    Sender?: { id: number; username: string; full_name: string };
}

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    content: string;
    is_read: boolean;
    reference_id?: number;
    link?: string;
    createdAt: string;
}

export interface Company {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
}

export interface Branch {
    id: number;
    company_id: number;
    name: string;
    address?: string;
    phone?: string;
    is_main: boolean;
}

// ─── Auth ─────────────────────────────────────────────
export const login = async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/login/access-token', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { access_token: string; token_type: string };
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
};

// ─── Users ────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const createUser = async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
};

export const updateUser = async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
};

// ─── Products ─────────────────────────────────────────
export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get<any>('/products'); // Use any to avoid TS issues with initial fetch
    const products = response.data.products ?? [];

    // Normalize — backend returns decimals as strings
    return products.map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        supplier_id: p.supplier_id,
        price: parseFloat(p.price) || 0,
        cost_price: parseFloat(p.cost_price) || 0,
        quantity_in_stock: parseInt(p.stock_quantity ?? p.quantity_in_stock ?? 0, 10),
        image: p.image_url || p.image || undefined,
    }));
};

// ─── Suppliers ────────────────────────────────────────
export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/supply-chain/suppliers');
    return response.data;
};

export const createSupplier = async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/supply-chain/suppliers', data);
    return response.data;
};

// ─── Customers ────────────────────────────────────────
export const getCustomers = async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/crm/customers');
    return response.data;
};

// ─── POS ──────────────────────────────────────────────
export const getPOSOrders = async (): Promise<POSOrder[]> => {
    const response = await api.get<POSOrder[]>('/pos/orders');
    const orders = Array.isArray(response.data) ? response.data : [];
    return orders.map(o => ({
        ...o,
        total_amount: parseFloat(o.total_amount as any) || 0,
        items: (o.items || []).map(i => ({
            ...i,
            unit_price: parseFloat(i.unit_price as any) || 0,
            total_price: parseFloat(i.total_price as any) || 0,
        })),
    }));
};


export const createPOSOrder = async (data: {
    total_amount: number;
    status: string;
    source: string;
    payments: { method: string; amount: number }[];
    items: { product_id: number; quantity: number; unit_price: number; total_price: number }[];
    customer_id?: number;
    notes?: string;
}): Promise<POSOrder> => {
    const response = await api.post<POSOrder>('/pos/orders', data);
    return response.data;
};

// ─── Finance ──────────────────────────────────────────
export const getAccounts = async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/finance/accounts');
    const accounts = Array.isArray(response.data) ? response.data : [];
    return accounts.map(a => ({
        ...a,
        balance: parseFloat(a.balance as any) || 0,
    }));
};

// ─── Chat ─────────────────────────────────────────────
export const getChatHistory = async (userId: number): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/chat/history/${userId}`);
    return response.data;
};

export const getConversations = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/chat/conversations');
    return response.data;
};

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/chat/notifications');
    return response.data;
};

export const markNotificationRead = async (id: number): Promise<void> => {
    await api.put(`/chat/notifications/${id}/read`);
};

// ─── Companies & Branches ─────────────────────────────
export const getCompanies = async (): Promise<Company[]> => {
    const response = await api.get<Company[]>('/companies');
    return response.data;
};

export const getBranches = async (): Promise<Branch[]> => {
    const response = await api.get<Branch[]>('/branches');
    return response.data;
};

export const getPermissions = async (): Promise<RolePermission[]> => {
    const response = await api.get<RolePermission[]>('/acl/permissions');
    return response.data;
};

export default api;
