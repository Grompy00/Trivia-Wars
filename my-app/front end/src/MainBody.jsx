import { useNavigate } from 'react-router-dom';



function MainBody(){
const navigate = useNavigate();
  const handleCreateGame = () => {
    navigate('/CreateGame');
  };
  const handleJoinGame = () => {
    navigate('/JoinGame')

  }
    return(
        <main> <h1> Test your knowledge across multiple subjects</h1>
        <br></br>
                <h2> Over 1000 Questions!</h2>
                <button onClick = {handleCreateGame}> Create Lobby</button>
                <button onClick = {handleJoinGame}> Join Lobby</button>

        </main>
    )
}
export default MainBody