import { useState, useEffect } from 'react';

export interface Coupon {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minPurchase: number;
    expiryDate?: string;
    isActive: boolean;
    description?: string;
}

export const useCoupons = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/coupons?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch coupons');

            const data = await response.json();
            const couponsList = Array.isArray(data) ? data : (data.coupons || []);

            // Convert snake_case to camelCase
            const formattedCoupons = couponsList.map((c: any) => ({
                id: c.id,
                code: c.code,
                type: c.type,
                value: typeof c.value === 'string' ? parseFloat(c.value) : c.value,
                minPurchase: c.min_purchase,
                expiryDate: c.expiry_date,
                isActive: c.is_active
            }));
            setCoupons(formattedCoupons);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const addCoupon = async (coupon: Omit<Coupon, 'id'>) => {
        try {
            const token = localStorage.getItem('access_token');
            // Convert camelCase to snake_case for API
            const apiCoupon = {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                min_purchase: coupon.minPurchase,
                expiry_date: coupon.expiryDate,
                is_active: coupon.isActive
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/coupons`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiCoupon)
            });

            if (!response.ok) throw new Error('Failed to add coupon');

            const newCoupon = await response.json();
            const formattedCoupon = {
                id: newCoupon.id,
                code: newCoupon.code,
                type: newCoupon.type,
                value: newCoupon.value,
                minPurchase: newCoupon.min_purchase,
                expiryDate: newCoupon.expiry_date,
                isActive: newCoupon.is_active
            };
            setCoupons([...coupons, formattedCoupon]);
            return formattedCoupon;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const updateCoupon = async (id: number, updates: Partial<Coupon>) => {
        try {
            const token = localStorage.getItem('access_token');
            // Convert camelCase to snake_case for API
            const apiUpdates: any = {};
            if (updates.code !== undefined) apiUpdates.code = updates.code;
            if (updates.type !== undefined) apiUpdates.type = updates.type;
            if (updates.value !== undefined) apiUpdates.value = updates.value;
            if (updates.minPurchase !== undefined) apiUpdates.min_purchase = updates.minPurchase;
            if (updates.expiryDate !== undefined) apiUpdates.expiry_date = updates.expiryDate;
            if (updates.isActive !== undefined) apiUpdates.is_active = updates.isActive;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/coupons/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiUpdates)
            });

            if (!response.ok) throw new Error('Failed to update coupon');

            const updatedCoupon = await response.json();
            const formattedCoupon = {
                id: updatedCoupon.id,
                code: updatedCoupon.code,
                type: updatedCoupon.type,
                value: updatedCoupon.value,
                minPurchase: updatedCoupon.min_purchase,
                expiryDate: updatedCoupon.expiry_date,
                isActive: updatedCoupon.is_active
            };
            setCoupons(coupons.map(c => c.id === id ? formattedCoupon : c));
            return formattedCoupon;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const deleteCoupon = async (id: number) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/coupons/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete coupon');

            setCoupons(coupons.filter(c => c.id !== id));
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        coupons,
        loading,
        error,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        refreshCoupons: fetchCoupons
    };
};
