// SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('https://trivia-wars-production.up.railway.app', {
      transports: ['websocket'],
      secure: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      const savedName = localStorage.getItem('displayName');
      const savedLobby = localStorage.getItem('lobbyCode');

      if (savedName && savedLobby) {
        newSocket.emit('join_room', savedLobby, savedName);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
