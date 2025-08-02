import { createContext, useState } from "react";
export const DisplayNameContext = createContext();

function DisplayNameProvider({children}) {
    // Try to load from localStorage first
    const [displayName, setDisplayName] = useState(() => localStorage.getItem('displayName') || '');

    return (
        <DisplayNameContext.Provider value={{displayName, setDisplayName}}>
            {children}
        </DisplayNameContext.Provider>
    );
}
export default DisplayNameProvider;