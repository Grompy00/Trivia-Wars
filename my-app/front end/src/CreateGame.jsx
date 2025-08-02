import React, { useState, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionContext } from './QuestionCount';
import { LobbyCodeContext } from './LobbyCodeContext';
import { DisplayNameContext } from './DisplayNameContext';
import { useSocket } from './SocketContext';

function CreateGame() {
  const socket = useSocket()
  const {displayName, setDisplayName} = useContext(DisplayNameContext)
  const {inputValue, setInputValue} = useContext(QuestionContext);
  const {joinCode, setJoinCode} = useContext(LobbyCodeContext);

  const [selectedCategories, setSelectedCategories] = useState(["All"]);
  const [category, setCategory] = useState("All");

  const navigate = useNavigate();

  const handleCategoryChange = (cat) => {
    if (cat === "All") {
      setSelectedCategories(["All"]);
    } else {
      setSelectedCategories(prev => {
        // Remove "All" if any other category is checked
        let withoutAll = prev.filter(c => c !== "All");
        if (prev.includes(cat)) {
          // Remove category
          const updated = withoutAll.filter(c => c !== cat);
          // If none left, default to "All"
          return updated.length === 0 ? ["All"] : updated;
        } else {
          // Add category
          return [...withoutAll, cat];
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseInt(inputValue) > 0) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      setJoinCode(code)
      localStorage.setItem('displayName', displayName);
      localStorage.setItem('lobbyCode', code);

      // Send selectedCategories as array to backend
      socket.emit('create_lobby', code, displayName, inputValue, selectedCategories);
      navigate(`/Lobby/${code}`);
    } else {
      alert('Enter a number greater than 0');
    }
  };

  const categories = ["Geography", "History", "Science", "Sports", "Music", "Film", "Cuisine"];

  return (
    <section className='create-game'>
      <form onSubmit={handleSubmit}>
        <label>Number of Questions</label>
        <input
          id='questionsForm'
          type='number'
          min='1'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <label>Display Name</label>
        <input
          type='text'
          value={displayName}
          required
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <label>Select Categories:</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1em", marginBottom: "1em" }}>
          <label>
            <input
              type="checkbox"
              checked={selectedCategories.includes("All")}
              onChange={() => handleCategoryChange("All")}
            />
            All
          </label>
          {categories.map(cat => (
            <label key={cat}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
        <button className='gameButton' type="submit">Start</button>
      </form>
    </section>
  );
}

export default CreateGame;
