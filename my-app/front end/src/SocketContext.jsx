// SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('https://trivia-wars-production.up.railway.app');
    setSocket(newSocket);

    // Rejoin lobby on reconnect
    newSocket.on('connect', () => {
      const savedName = localStorage.getItem('displayName');
      const savedLobby = localStorage.getItem('lobbyCode');

      if (savedName && savedLobby) {
        newSocket.emit('join_room', savedLobby, savedName);
      }
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
