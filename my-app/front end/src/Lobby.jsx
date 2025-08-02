import { useEffect, useState, useContext } from 'react';
import { useSocket } from './SocketContext';
import { useNavigate } from 'react-router-dom';
import { LobbyCodeContext } from './LobbyCodeContext';

function Lobby() {
  const { joinCode } = useContext(LobbyCodeContext);
  const socket = useSocket();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const displayName = localStorage.getItem('displayName'); // Assuming displayName is stored in localStorage

  // Emit "start_game" to server
  const handleStartGame = () => {
    socket.emit('start_game', joinCode);
  };

  useEffect(() => {
    if (!socket || !socket.connected || !joinCode) return;
    socket.emit('join_room', joinCode, displayName);

    socket.on('update_players', (playerList) => {
      setPlayers(playerList);
    });

    socket.on('redirect_to_game', () => {
      navigate('/Game');
    });

    socket.emit('get_players');

    return () => {
      socket.off('update_players');
      socket.off('redirect_to_game');
    };
  }, [socket, joinCode, navigate]);

  return (
    <div className="lobby-container">
      <h2>Lobby Code: {joinCode}</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
      <button className="playNowButton" onClick={handleStartGame}>Play Now</button>
    </div>
  );
}

export default Lobby;
