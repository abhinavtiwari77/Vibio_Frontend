import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

export const initSocket = (token, userId) => {
  const normalizedUserId = userId ? String(userId) : undefined;

  if (socket) {
    const currentUserId = String(socket.io?.opts?.query?.userId || '');
    if (!normalizedUserId || currentUserId === normalizedUserId) {
      if (token) socket.auth = { token };
      return socket;
    }

    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    query: { userId: normalizedUserId },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
