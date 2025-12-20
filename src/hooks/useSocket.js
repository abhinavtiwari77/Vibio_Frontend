import { useState, useEffect } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export const useSocket = (eventName, callback) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const socketInstance = getSocket();
    if (!socketInstance) {
      setSocket(null);
      return;
    }

    setSocket(socketInstance);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    if (eventName && callback) {
      socketInstance.on(eventName, callback);
    }

    setIsConnected(socketInstance.connected);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      if (eventName && callback) {
        socketInstance.off(eventName, callback);
      }
    };
  }, [user, eventName, callback]);

  return socket;
};
