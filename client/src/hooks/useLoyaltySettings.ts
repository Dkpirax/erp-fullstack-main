import { useState, useEffect } from 'react';

export interface LoyaltySettings {
    pointsPerDollar: number;
    redemptionRate: number;
    minSpending: number;
    isEnabled: boolean;
}

export const useLoyaltySettings = () => {
    const [settings, setSettings] = useState<LoyaltySettings>({
        pointsPerDollar: 1,
        redemptionRate: 0.01,
        minSpending: 0,
        isEnabled: true
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/loyalty/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch loyalty settings');

            const data = await response.json();
            // Convert snake_case to camelCase
            setSettings({
                pointsPerDollar: data.points_per_dollar,
                redemptionRate: data.redemption_rate,
                minSpending: data.min_spending,
                isEnabled: data.is_enabled
            });
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching loyalty settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (newSettings: LoyaltySettings) => {
        try {
            const token = localStorage.getItem('access_token');
            // Convert camelCase to snake_case for API
            const apiSettings = {
                points_per_dollar: newSettings.pointsPerDollar,
                redemption_rate: newSettings.redemptionRate,
                min_spending: newSettings.minSpending,
                is_enabled: newSettings.isEnabled
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/loyalty/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiSettings)
            });

            if (!response.ok) throw new Error('Failed to update loyalty settings');

            const updatedData = await response.json();
            const formattedSettings = {
                pointsPerDollar: updatedData.points_per_dollar,
                redemptionRate: updatedData.redemption_rate,
                minSpending: updatedData.min_spending,
                isEnabled: updatedData.is_enabled
            };
            setSettings(formattedSettings);
            return formattedSettings;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        settings,
        loading,
        error,
        updateSettings,
        refreshSettings: fetchSettings
    };
};
