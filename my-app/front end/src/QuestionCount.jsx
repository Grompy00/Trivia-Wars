import { createContext, useState } from "react"
import CreateGame from "./CreateGame"
import Game from "./Game"
export const QuestionContext = createContext()
function QuestionCount({children}){
    const [inputValue, setInputValue] = useState(0)

    return(
        <QuestionContext.Provider value={{inputValue, setInputValue}}> 
        {children}
        </QuestionContext.Provider>

    )
}
export default QuestionCount