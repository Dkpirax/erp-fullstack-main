import React from 'react';
import { type User } from '../../lib/api';

interface UserListProps {
    users: User[];
    onSelect: (user: User) => void;
    activeUserId?: number;
}

export const UserList: React.FC<UserListProps> = ({ users, onSelect, activeUserId }) => {
    return (
        <div className="list-group list-group-flush" style={{ height: '100%', overflowY: 'auto' }}>
            {users.map(user => (
                <button
                    key={user.id}
                    className={`list-group-item list-group-item-action ${user.id === activeUserId ? 'active' : ''}`}
                    onClick={() => onSelect(user)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-bold">{user.full_name || user.username}</div>
                            <small className="text-muted">{user.email}</small>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
