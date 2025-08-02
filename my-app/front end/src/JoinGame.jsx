import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';
import { LobbyCodeContext } from './LobbyCodeContext';
import { DisplayNameContext } from './DisplayNameContext';

function JoinGame() {
  const { joinCode, setJoinCode } = useContext(LobbyCodeContext);
  const { displayName, setDisplayName } = useContext(DisplayNameContext);
  const socket = useSocket();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    if (!displayName.trim()) {
      alert("Please enter a display name.");
      return;
    }

    socket.emit('check_room_exists', joinCode, (exists) => {
      if (exists) {
        socket.emit('join_room', joinCode, displayName); // Optional: send name to server too
        navigate(`/lobby/${joinCode}`);
      } else {
        alert('Lobby does not exist.');
      }
localStorage.setItem('displayName', displayName);
localStorage.setItem('lobbyCode', joinCode);

    });
    
  }

  return (
    <section className='join-game'>
      <form onSubmit={handleSubmit} className="join-form-flex">
        <div className="form-row">
          <label>Lobby Code</label>
          <input
            type='text'
            minLength='4'
            maxLength='4'
            value={joinCode}
            required
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
        </div>
        <div className="form-row">
          <label>Display Name</label>
          <input
            type='text'
            value={displayName}
            required
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <button className='gameButton' type="submit">Join Game</button>
      </form>
    </section>
  );
}

export default JoinGame;
