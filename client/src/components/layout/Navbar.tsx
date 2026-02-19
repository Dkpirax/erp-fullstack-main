import { Bell, User, Menu } from "lucide-react";
import { Navbar as BSNavbar, Container, Nav, Dropdown, Button, Badge } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, type Notification } from "../../lib/api";

interface NavbarProps {
    onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            getNotifications().then(data => {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }).catch(console.error);
        }
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('notification', () => {
            getNotifications().then(data => {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            });
        });

        return () => {
            socket.off('notification');
        };
    }, [socket]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.is_read) {
            await markNotificationRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        // If the notification is a message, navigate to chat? 
        // For now, simpler to just mark read.
        // If we want to open chat, we need to pass that state to ChatWidget via context or URL.
        // But ChatWidget is global.
    };

    return (
        <BSNavbar bg="white" variant="light" className="border-bottom shadow-sm py-2">
            <Container fluid>
                <div className="d-flex align-items-center gap-3">
                    <Button
                        variant="link"
                        className="p-0 text-dark d-lg-none"
                        onClick={onToggleSidebar}
                    >
                        <Menu size={24} />
                    </Button>
                    <BSNavbar.Brand className="d-none d-md-block m-0">Dashboard</BSNavbar.Brand>
                </div>

                <BSNavbar.Toggle />

                <Nav className="ms-auto align-items-center gap-3 flex-row">
                    <Dropdown align="end">
                        <Dropdown.Toggle as="a" className="nav-link position-relative" style={{ cursor: 'pointer' }}>
                            <Bell size={20} className="text-secondary" />
                            {unreadCount > 0 && (
                                <Badge
                                    bg="danger"
                                    pill
                                    className="position-absolute top-0 start-100 translate-middle"
                                    style={{ fontSize: '0.6rem' }}
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ width: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                            <Dropdown.Header>Notifications</Dropdown.Header>
                            {notifications.length === 0 ? (
                                <Dropdown.Item disabled>No notifications</Dropdown.Item>
                            ) : (
                                notifications.map(notif => (
                                    <Dropdown.Item
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={!notif.is_read ? 'bg-light fw-bold' : ''}
                                        style={{ whiteSpace: 'normal' }}
                                    >
                                        <div className="d-flex flex-column">
                                            <span>{notif.content}</span>
                                            <small className="text-muted" style={{ fontSize: '0.7em' }}>
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </small>
                                        </div>
                                    </Dropdown.Item>
                                ))
                            )}
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown align="end">
                        <Dropdown.Toggle variant="link" id="dropdown-user" className="text-decoration-none p-0 d-flex align-items-center">
                            <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white me-2" style={{ width: 32, height: 32 }}>
                                <User size={16} />
                            </div>
                            <span className="text-dark d-none d-md-inline">{user?.full_name || user?.username || 'User'}</span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
                            <Dropdown.Item onClick={() => navigate('/settings')}>Settings</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="text-danger">Sign out</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Nav>
            </Container>
        </BSNavbar>
    );
}
