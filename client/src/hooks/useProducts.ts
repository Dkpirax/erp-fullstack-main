import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    price: number;
    cost_price?: number;
    stock_quantity: number;
    low_stock_threshold?: number;
    stock_status?: string;  // 'instock' | 'outofstock' | 'onbackorder'
    image_url?: string;
    supplier_id?: number;
    // Derived display helpers
    stock: number;          // alias for stock_quantity
    status: string;         // derived from stock_quantity / low_stock_threshold
    image?: string;         // alias for image_url
    category?: string;
    barcode?: string;
}

const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
});

/** Map raw API product to UI-friendly Product */
function normalize(p: any): Product {
    const qty = parseInt(p.stock_quantity ?? p.stock ?? 0);
    const threshold = parseInt(p.low_stock_threshold ?? 10);
    let status = 'In Stock';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= threshold) status = 'Low Stock';

    return {
        ...p,
        price: parseFloat(p.price) || 0,
        cost_price: parseFloat(p.cost_price) || 0,
        stock_quantity: qty,
        stock: qty,
        status,
        image: p.image_url || p.image || '',
        image_url: p.image_url || p.image || '',
        category: p.category || 'General',
        barcode: p.barcode || '',
    };
}

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/products?skip=0&limit=200`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const raw = data.products ?? data ?? [];
            setProducts(raw.map(normalize));
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('useProducts fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const addProduct = async (product: Partial<Product>) => {
        const payload = {
            name: product.name,
            sku: product.sku,
            description: product.description,
            price: product.price ?? 0,
            cost_price: product.cost_price ?? 0,
            stock_quantity: product.stock_quantity ?? product.stock ?? 0,
            low_stock_threshold: product.low_stock_threshold ?? 10,
            category: product.category,
            barcode: product.barcode,
            image_url: product.image_url || product.image,
            supplier_id: product.supplier_id,
        };
        const res = await fetch(`${API}/products`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to add product');
        }
        const newProduct = normalize(await res.json());
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
    };

    const updateProduct = async (id: number, updates: Partial<Product>) => {
        const payload = {
            name: updates.name,
            sku: updates.sku,
            description: updates.description,
            price: updates.price,
            cost_price: updates.cost_price,
            stock_quantity: updates.stock_quantity ?? updates.stock,
            low_stock_threshold: updates.low_stock_threshold,
            category: updates.category,
            barcode: updates.barcode,
            image_url: updates.image_url || updates.image,
            supplier_id: updates.supplier_id,
        };
        const res = await fetch(`${API}/products/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to update product');
        }
        const updated = normalize(await res.json());
        setProducts(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
    };

    const deleteProduct = async (id: number) => {
        const res = await fetch(`${API}/products/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete product');
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    return { products, loading, error, addProduct, updateProduct, deleteProduct, refreshProducts: fetchProducts };
};
