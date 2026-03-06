import { useState, useEffect } from "react";
import { Card, ListGroup, Badge, Form, InputGroup, Button, Row, Col, Alert } from "react-bootstrap";
import { Send, Facebook, Instagram, MessageSquare } from "lucide-react";

export function UnifiedInbox() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [platformFilter, setPlatformFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchConversations();
    }, [platformFilter]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const platform = platformFilter === "all" ? "" : `?platform=${platformFilter}`;
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/social-media/messages${platform}`);
            const data = await response.json();
            setConversations(data.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch conversations");
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = async (conversation: any) => {
        setSelectedConversation(conversation);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/social-media/messages/${conversation.id}?platform=${conversation.platform}`
            );
            const data = await response.json();
            setMessages(data.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch messages");
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/social-media/messages/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: selectedConversation.platform,
                    recipient_id: selectedConversation.participants?.[0]?.id,
                    message: newMessage
                })
            });
            setNewMessage("");
            selectConversation(selectedConversation); // Refresh messages
        } catch (err: any) {
            setError(err.message || "Failed to send message");
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case "facebook": return <Facebook size={16} className="text-primary" />;
            case "instagram": return <Instagram size={16} className="text-danger" />;
            case "whatsapp": return <MessageSquare size={16} className="text-success" />;
            default: return null;
        }
    };

    return (
        <div className="p-4">
            <h2 className="mb-4">Unified Inbox</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                    <Row className="g-2">
                        <Col md={6}>
                            <Form.Select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                                <option value="all">All Platforms</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="whatsapp">WhatsApp</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row>
                <Col md={4}>
                    <Card className="border-0 shadow-sm" style={{ height: '600px', overflowY: 'auto' }}>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status" />
                                </div>
                            ) : (
                                <ListGroup variant="flush">
                                    {conversations.map((conv) => (
                                        <ListGroup.Item
                                            key={conv.id}
                                            action
                                            active={selectedConversation?.id === conv.id}
                                            onClick={() => selectConversation(conv)}
                                            className="d-flex justify-content-between align-items-center"
                                        >
                                            <div>
                                                <div className="d-flex align-items-center gap-2">
                                                    {getPlatformIcon(conv.platform)}
                                                    <span className="fw-medium">Conversation {conv.id.slice(0, 8)}</span>
                                                </div>
                                                <small className="text-muted">
                                                    {new Date(conv.updated_time).toLocaleString()}
                                                </small>
                                            </div>
                                            <Badge bg="primary">{conv.message_count || 0}</Badge>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="border-0 shadow-sm" style={{ height: '600px' }}>
                        {selectedConversation ? (
                            <>
                                <Card.Header className="bg-white border-bottom">
                                    <div className="d-flex align-items-center gap-2">
                                        {getPlatformIcon(selectedConversation.platform)}
                                        <strong>{selectedConversation.platform.toUpperCase()}</strong>
                                    </div>
                                </Card.Header>
                                <Card.Body style={{ overflowY: 'auto', flex: 1 }}>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`mb-3 ${msg.from?.id === selectedConversation.participants?.[0]?.id ? 'text-start' : 'text-end'}`}>
                                            <div className={`d-inline-block p-2 rounded ${msg.from?.id === selectedConversation.participants?.[0]?.id ? 'bg-light' : 'bg-primary text-white'}`}>
                                                {msg.message}
                                            </div>
                                            <div className="small text-muted mt-1">
                                                {new Date(msg.created_time).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                                <Card.Footer className="bg-white border-top">
                                    <InputGroup>
                                        <Form.Control
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        />
                                        <Button variant="primary" onClick={sendMessage}>
                                            <Send size={18} />
                                        </Button>
                                    </InputGroup>
                                </Card.Footer>
                            </>
                        ) : (
                            <Card.Body className="d-flex align-items-center justify-content-center">
                                <p className="text-muted">Select a conversation to view messages</p>
                            </Card.Body>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
