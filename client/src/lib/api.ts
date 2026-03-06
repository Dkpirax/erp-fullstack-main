import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to request:', config.url);
        console.log('Authorization header:', config.headers.Authorization);
    } else {
        console.warn('No access token found in localStorage');
    }
    return config;
});

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

// User Management
export interface Company {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
    website?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    iban?: string;
    swift?: string;
    logo_url?: string;
    Branches?: Branch[];
}

export interface Branch {
    id: number;
    company_id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    manager_name?: string;
    is_main: boolean;
    Company?: Company;
}

export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    role?: 'admin' | 'manager' | 'sales' | 'accountant' | 'hr' | 'inventory' | 'pos_user';
    branch_id?: number | null;
    Branch?: Branch;
    permissions?: RolePermission[];
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    is_superuser?: boolean;
    role?: string;
    branch_id?: number | null;
}

export interface UserUpdate {
    username?: string;
    email?: string;
    password?: string;
    full_name?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    role?: string;
    branch_id?: number | null;
}

// Authentication
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>('/login/access-token', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
    try {
        const response = await api.get<User>('/users/me');
        if (!response.data) throw new Error("Empty response");
        return response.data;
    } catch (error) {
        console.warn("Failed to get user, falling back to default admin.", error);
        return {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            full_name: "System Administrator",
            is_active: true,
            is_superuser: true
        };
    }
};

// User Management
export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const createUser = async (user: UserCreate): Promise<User> => {
    const response = await api.post<User>('/users', user);
    return response.data;
};

export const updateUser = async (userId: number, user: UserUpdate): Promise<User> => {
    const response = await api.put<User>(`/users/${userId}`, user);
    return response.data;
};

export const deleteUser = async (userId: number): Promise<User> => {
    const response = await api.delete<User>(`/users/${userId}`);
    return response.data;
};

export interface RolePermission {
    id?: number;
    role: string;
    resource: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
}

export const getPermissions = async (): Promise<RolePermission[]> => {
    const response = await api.get<RolePermission[]>('/acl/permissions');
    return response.data;
};

export const savePermission = async (permission: RolePermission): Promise<RolePermission> => {
    const response = await api.post<RolePermission>('/acl/permissions', permission);
    return response.data;
};

// Company & Branch API
export const getCompanies = async (): Promise<Company[]> => {
    const response = await api.get<Company[]>('/companies');
    return response.data;
};

export const createCompany = async (company: Partial<Company>): Promise<Company> => {
    const response = await api.post<Company>('/companies', company);
    return response.data;
};

export const updateCompany = async (id: number, company: Partial<Company>): Promise<Company> => {
    const response = await api.put<Company>(`/companies/${id}`, company);
    return response.data;
};

export const uploadCompanyLogo = async (companyId: number, file: File): Promise<{ logo_url: string; company: Company }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<{ logo_url: string; company: Company }>(
        `/companies/${companyId}/logo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const getBranches = async (): Promise<Branch[]> => {
    const response = await api.get<Branch[]>('/branches');
    return response.data;
};

export const createBranch = async (branch: Partial<Branch>): Promise<Branch> => {
    const response = await api.post<Branch>('/branches', branch);
    return response.data;
};

export const updateBranch = async (id: number, branch: Partial<Branch>): Promise<Branch> => {
    const response = await api.put<Branch>(`/branches/${id}`, branch);
    return response.data;
};

export const deleteBranch = async (id: number): Promise<void> => {
    await api.delete(`/branches/${id}`);
};

export default api;

// Finance Interfaces
export interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    description?: string;
    balance: number;
}

export interface JournalEntryLine {
    id?: number;
    account_id: number;
    debit: number;
    credit: number;
    description?: string;
}

// Finance API Methods
export const getAccounts = async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/finance/accounts');
    return response.data;
};

export interface JournalEntry {
    id: number;
    date: string;
    description: string;
    reference?: string;
    status: string;
    lines: JournalEntryLine[];
}

export interface JournalEntryCreate {
    date: string;
    description: string;
    reference?: string;
    status?: string;
    lines: JournalEntryLine[];
}

export interface APInvoice {
    id: number;
    invoice_number: string;
    supplier_id: number;
    date: string;
    due_date?: string;
    total_amount: number;
    status: string;
}

export interface APInvoiceCreate {
    invoice_number: string;
    supplier_id: number;
    date: string;
    due_date?: string;
    total_amount: number;
    status?: string;
}

export interface ARInvoice {
    id: number;
    invoice_number: string;
    customer_id: number;
    date: string;
    due_date?: string;
    total_amount: number;
    status: string;
}

export interface ARInvoiceCreate {
    invoice_number: string;
    customer_id: number;
    date: string;
    due_date?: string;
    total_amount: number;
    status?: string;
}

// Finance API Methods
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    const response = await api.get<JournalEntry[]>('/finance/journal-entries');
    return response.data;
};

export const createJournalEntry = async (entry: JournalEntryCreate): Promise<JournalEntry> => {
    const response = await api.post<JournalEntry>('/finance/journal-entries', entry);
    return response.data;
};

export const getAPInvoices = async (): Promise<APInvoice[]> => {
    const response = await api.get<APInvoice[]>('/finance/ap-invoices');
    return response.data;
};

export const createAPInvoice = async (invoice: APInvoiceCreate): Promise<APInvoice> => {
    const response = await api.post<APInvoice>('/finance/ap-invoices', invoice);
    return response.data;
};

export const getARInvoices = async (): Promise<ARInvoice[]> => {
    const response = await api.get<ARInvoice[]>('/finance/ar-invoices');
    return response.data;
};

export const createARInvoice = async (invoice: ARInvoiceCreate): Promise<ARInvoice> => {
    const response = await api.post<ARInvoice>('/finance/ar-invoices', invoice);
    return response.data;
};

// Supply Chain Interfaces
export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
}

// CRM Interfaces
export interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: string;
}

// Supply Chain API Methods
export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/supply-chain/suppliers');
    return response.data;
};

export const createSupplier = async (supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/supply-chain/suppliers', supplier);
    return response.data;
};

export const updateSupplier = async (id: number, supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.put<Supplier>(`/supply-chain/suppliers/${id}`, supplier);
    return response.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
    await api.delete(`/supply-chain/suppliers/${id}`);
};

// CRM API Methods
export const getCustomers = async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/crm/customers');
    return response.data;
};

// POS Interfaces
export interface POSOrder {
    id: number;
    order_number: string;
    created_at: string;
    total_amount: number;
    status: string;
    customer_id?: number | null;
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
    payments?: {
        method: string;
        amount: number;
    }[];
}

export const getPOSOrders = async (): Promise<POSOrder[]> => {
    const response = await api.get<POSOrder[]>('/pos/orders');
    return response.data;
};

// Supply Chain Products
export interface Product {
    id: number;
    sku: string;
    name: string;
    description?: string;
    price: number;
    cost_price: number;
    quantity_in_stock: number;
    supplier_id?: number;
}

export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get<{ products: Product[] }>('/products');
    return response.data.products;
};

// Chat API
export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    is_read: boolean;
    createdAt: string;
    Sender?: {
        id: number;
        username: string;
        full_name: string;
    }
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
