import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      console.log('🔌 Socket connected:', s.id);
      s.emit('user_online', userId);
    });
    s.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
    s.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export default getSocket;
