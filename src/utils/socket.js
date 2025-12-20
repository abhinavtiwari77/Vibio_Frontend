import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

export const initSocket = (token, userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      query: { userId },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
