import { createContext, useState } from "react";
export const LobbyCodeContext = createContext();

function LobbyCode({children}) {
    // Try to load from localStorage first
    const [joinCode, setJoinCodeState] = useState(() => localStorage.getItem('lobbyCode') || null);

    const setJoinCode = (code) => {
      setJoinCodeState(code);
      localStorage.setItem('lobbyCode', code);
    };

    return (
        <LobbyCodeContext.Provider value={{joinCode, setJoinCode}}>
            {children}
        </LobbyCodeContext.Provider>
    );
}
export default LobbyCode;