const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

module.exports = (io) => {
    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            const decoded = verifyToken(token);
            if (!decoded) {
                return next(new Error('Authentication error: Invalid token'));
            }

            const user = await User.findOne({ where: { username: decoded.sub } });
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            // Attach user to socket
            socket.user = user;
            next();
        } catch (error) {
            console.error("Socket Auth Error:", error);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.id})`);

        // Join a personal room for direct messages and notifications
        socket.join(`user_${socket.user.id}`);

        // Set online status (optional: can be stored in Redis or DB)
        // For simple presence, we can emit to everyone that this user is online
        socket.broadcast.emit('user_online', { userId: socket.user.id });

        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`User ${socket.user.username} joined room: ${room}`);
        });

        socket.on('leave_room', (room) => {
            socket.leave(room);
            console.log(`User ${socket.user.username} left room: ${room}`);
        });

        socket.on('send_message', async (data) => {
            try {
                const { receiverId, content, type } = data;

                if (!receiverId || !content) return;

                // Save message to DB
                const message = await Message.create({
                    sender_id: socket.user.id,
                    receiver_id: receiverId,
                    content,
                    type: type || 'TEXT',
                    is_read: false
                });

                const messageData = {
                    id: message.id,
                    sender_id: socket.user.id,
                    receiver_id: receiverId,
                    content,
                    type: message.type,
                    createdAt: message.createdAt,
                    Sender: {
                        id: socket.user.id,
                        username: socket.user.username,
                        full_name: socket.user.full_name
                    }
                };

                // Emit to receiver's personal room
                io.to(`user_${receiverId}`).emit('receive_message', messageData);

                // Emit back to sender (for confirmation/UI update if needed, though frontend usually handles optimistic UI)
                socket.emit('message_sent', messageData);

                // Create Notification if receiver is not in the chat focus (handled by frontend mostly, but we can store persisted notification)
                // Check if receiver is connected? Hard to know if they are looking at the specific chat. 
                // We'll just create a notification record. Frontend can decide to show toaster or not based on current view.

                await Notification.create({
                    user_id: receiverId,
                    type: 'MESSAGE',
                    content: `New message from ${socket.user.username}`,
                    is_read: false,
                    reference_id: message.id,
                    link: `/chat/${socket.user.id}`
                });

                // Emit notification event
                io.to(`user_${receiverId}`).emit('notification', {
                    type: 'MESSAGE',
                    content: `New message from ${socket.user.username}`,
                    senderId: socket.user.id
                });

            } catch (error) {
                console.error("Send Message Error:", error);
                socket.emit('error', { message: "Failed to send message" });
            }
        });

        socket.on('mark_read', async (data) => {
            try {
                const { senderId } = data; // The person who sent the messages I am now reading
                await Message.update({ is_read: true }, {
                    where: {
                        sender_id: senderId,
                        receiver_id: socket.user.id,
                        is_read: false
                    }
                });

                // Notify the sender that messages were read
                io.to(`user_${senderId}`).emit('messages_read', { receiverId: socket.user.id });
            } catch (error) {
                console.error("Mark Read Error:", error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);
            socket.broadcast.emit('user_offline', { userId: socket.user.id });
        });
    });
};
