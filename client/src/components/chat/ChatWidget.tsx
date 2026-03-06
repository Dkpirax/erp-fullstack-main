import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getConversations, getChatHistory, type User, type Message } from '../../lib/api';
import { UserList } from './UserList';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button, Card, Form, Badge } from 'react-bootstrap';

export const ChatWidget: React.FC = () => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            getConversations().then(data => {
                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    console.error("Invalid users data:", data);
                }
            }).catch(err => console.error("Failed to load conversations", err));
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedUser) {
            getChatHistory(selectedUser.id).then(msgs => {
                setMessages(msgs);
                scrollToBottom();
            });
            // Mark as read immediately when opening chat is handled by backend event 'mark_read' if we emit it,
            // or just by virtue of this effect running and us potentially hitting an endpoint.
            // But we will use socket for RT.
            if (socket) {
                socket.emit('mark_read', { senderId: selectedUser.id });
                setUnreadCount(0); // Reset unread count locally if we assume they are from this user
            }
        }
    }, [selectedUser, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', (message: Message) => {
            if (selectedUser && message.sender_id === selectedUser.id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
                socket.emit('mark_read', { senderId: message.sender_id });
            } else {
                setUnreadCount(prev => prev + 1);
            }
        });

        socket.on('message_sent', (message: Message) => {
            if (message.receiver_id === selectedUser?.id) {
                setMessages(prev => {
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        });

        return () => {
            socket.off('receive_message');
            socket.off('message_sent');
        };
    }, [socket, selectedUser]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedUser || !user || !socket) return;

        const content = newMessage;
        setNewMessage('');

        socket.emit('send_message', {
            receiverId: selectedUser.id,
            content: content,
            type: 'TEXT'
        });
    };

    if (!user) return null;

    return (
        <div className="position-fixed bottom-0 end-0 m-4" style={{ zIndex: 1050 }}>
            {isOpen ? (
                <Card style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column' }} className="shadow border-0">
                    <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                        {selectedUser ? (
                            <div className="d-flex align-items-center">
                                <Button
                                    variant="link"
                                    className="text-white p-0 me-2 text-decoration-none fw-bold"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    &lt; Back
                                </Button>
                                <span>{selectedUser.full_name || selectedUser.username}</span>
                            </div>
                        ) : (
                            <span className="fw-bold">Messages</span>
                        )}
                        <Button variant="link" className="text-white p-0" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </Button>
                    </Card.Header>

                    <Card.Body className="p-0 flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                        {selectedUser ? (
                            <>
                                <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <div key={idx} className={`d-flex mb-2 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                                <div
                                                    className={`p-2 rounded ${isMe ? 'bg-primary text-white' : 'bg-white border text-dark'}`}
                                                    style={{ maxWidth: '75%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                                                >
                                                    <div>{msg.content}</div>
                                                    <small className={`d-block mt-1 ${isMe ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.7em', textAlign: 'right' }}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-2 border-top bg-white">
                                    <Form onSubmit={handleSendMessage} className="d-flex">
                                        <Form.Control
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            autoFocus
                                            className="rounded-pill"
                                        />
                                        <Button type="submit" variant="primary" className="ms-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                                            <Send size={18} />
                                        </Button>
                                    </Form>
                                </div>
                            </>
                        ) : (
                            <UserList
                                users={users}
                                onSelect={setSelectedUser}
                            />
                        )}
                    </Card.Body>
                </Card>
            ) : (
                <Button
                    variant="primary"
                    className="rounded-circle d-flex align-items-center justify-content-center p-0 shadow-lg"
                    style={{ width: '60px', height: '60px' }}
                    onClick={() => { setIsOpen(true); setUnreadCount(0); }}
                >
                    <MessageCircle size={30} />
                    {unreadCount > 0 && (
                        <Badge
                            bg="danger"
                            className="position-absolute top-0 start-100 translate-middle rounded-pill"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            )}
        </div>
    );
};
