import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { getConversations, getChatHistory, type User, type Message } from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export function ChatScreen() {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        getConversations().then(data => {
            setUsers(Array.isArray(data) ? data : []);
        }).finally(() => setLoadingUsers(false));
    }, []);

    useEffect(() => {
        if (!selectedUser) return;
        setLoadingMsgs(true);
        getChatHistory(selectedUser.id).then(msgs => {
            setMessages(msgs);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
        }).finally(() => setLoadingMsgs(false));
        if (socket) socket.emit('mark_read', { senderId: selectedUser.id });
    }, [selectedUser, socket]);

    useEffect(() => {
        if (!socket) return;
        socket.on('receive_message', (msg: Message) => {
            if (selectedUser && msg.sender_id === selectedUser.id) {
                setMessages(prev => [...prev, msg]);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                socket.emit('mark_read', { senderId: msg.sender_id });
            }
        });
        socket.on('message_sent', (msg: Message) => {
            if (msg.receiver_id === selectedUser?.id) {
                setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        });
        return () => { socket.off('receive_message'); socket.off('message_sent'); };
    }, [socket, selectedUser]);

    const sendMessage = () => {
        if (!newMessage.trim() || !selectedUser || !socket) return;
        socket.emit('send_message', { receiverId: selectedUser.id, content: newMessage.trim(), type: 'TEXT' });
        setNewMessage('');
    };

    if (!selectedUser) {
        // User list view
        if (loadingUsers) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
        return (
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>Conversations</Text>
                <FlatList
                    data={users}
                    keyExtractor={u => u.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.userRow} onPress={() => setSelectedUser(item)}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{(item.full_name || item.username).charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userName}>{item.full_name || item.username}</Text>
                                <Text style={styles.userEmail}>{item.email}</Text>
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No conversations yet</Text></View>}
                />
            </View>
        );
    }

    // Chat view
    const renderMsg = ({ item }: { item: Message }) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>{item.content}</Text>
                    <Text style={[styles.msgTime, isMe ? { color: 'rgba(255,255,255,0.6)' } : { color: Colors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
            {/* Header */}
            <View style={styles.chatHeader}>
                <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
                    <Text style={styles.backText}>‹ Back</Text>
                </TouchableOpacity>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(selectedUser.full_name || selectedUser.username).charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.chatHeaderName}>{selectedUser.full_name || selectedUser.username}</Text>
            </View>

            {loadingMsgs ? (
                <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderMsg}
                    contentContainerStyle={{ padding: 16 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <Text style={styles.emptyChatIcon}>💬</Text>
                            <Text style={styles.emptyChatText}>No messages yet. Say hi!</Text>
                        </View>
                    }
                />
            )}

            {/* Input */}
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.msgInput}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!newMessage.trim()}>
                    <Text style={styles.sendIcon}>➤</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    sectionTitle: { color: Colors.text, fontSize: 20, fontWeight: '800', marginHorizontal: 16, marginVertical: 12 },
    userRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: Colors.card, borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
    userName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
    userEmail: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
    arrow: { color: Colors.textMuted, fontSize: 22 },
    chatHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    backBtn: { padding: 4 },
    backText: { color: Colors.primary, fontSize: 18, fontWeight: '600' },
    chatHeaderName: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
    msgRow: { marginBottom: 8, flexDirection: 'row' },
    msgRowMe: { justifyContent: 'flex-end' },
    msgRowOther: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '75%', borderRadius: 18, padding: 12 },
    bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.cardBorder },
    msgText: { fontSize: 15 },
    msgTextMe: { color: Colors.white },
    msgTextOther: { color: Colors.text },
    msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
    inputRow: {
        flexDirection: 'row', padding: 12, gap: 10,
        borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface,
        alignItems: 'flex-end',
    },
    msgInput: {
        flex: 1, backgroundColor: Colors.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
        color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border, maxHeight: 100,
    },
    sendBtn: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
        shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    sendIcon: { color: Colors.white, fontSize: 18, marginLeft: 2 },
    emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyChatIcon: { fontSize: 48, marginBottom: 16 },
    emptyChatText: { color: Colors.textSecondary, fontSize: 16 },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },
});
