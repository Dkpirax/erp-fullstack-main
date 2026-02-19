import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

export function LoginScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }
        setLoading(true);
        try {
            await login(username.trim(), password);
        } catch (error: any) {
            Alert.alert('Login Failed', error?.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo Area */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>ERP</Text>
                    </View>
                    <Text style={styles.appName}>ERP Fullstack</Text>
                    <Text style={styles.tagline}>Enterprise Resource Planning</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter your username"
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textMuted}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.loginBtnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.hint}>
                        <Text style={styles.hintText}>Default: admin / admin</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
        shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
    },
    logoText: { color: Colors.white, fontSize: 24, fontWeight: '900' },
    appName: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
    tagline: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    title: { color: Colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    subtitle: { color: Colors.textSecondary, fontSize: 14, marginBottom: 28 },
    inputGroup: { marginBottom: 16 },
    label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        color: Colors.text,
        fontSize: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBtn: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    eyeText: { fontSize: 16 },
    loginBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    loginBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    hint: { alignItems: 'center', marginTop: 16 },
    hintText: { color: Colors.textMuted, fontSize: 12 },
});
