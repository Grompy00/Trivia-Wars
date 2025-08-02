import { useState, useEffect } from 'react'
import Heading from './Heading'
import MainBody from './MainBody'
import './App.css'
import CreateGame from './CreateGame'
import Game from './Game'
import QuestionCount from './QuestionCount'
import LobbyCode from './LobbyCodeContext'
import { Routes,Route } from 'react-router-dom'
import { SocketProvider } from "./SocketContext";
import JoinGame from './JoinGame'
import DisplayNameProvider  from './DisplayNameContext'
import Lobby from './Lobby'


function App() {
 


  return (
    <>
    <SocketProvider> 
    <Heading></Heading>
    <QuestionCount>
    <LobbyCode>
    <DisplayNameProvider> 
    <Routes>
    <Route path ='/' element={<MainBody/>}> </Route>
    <Route path ='/CreateGame' element={<CreateGame/>}> </Route>
    <Route path ='/Game' element={<Game/>}> </Route>
    <Route path ='/JoinGame' element={<JoinGame/>}> </Route>
    <Route path='/Lobby/:lobbyCode' element={<Lobby />} />
    

    </Routes>
    </DisplayNameProvider>
    </LobbyCode>
    </QuestionCount>
    </SocketProvider>

    </>
  )
}

export default App
