import './App.css'
import { useState } from 'react'
import Home from './Home'
import Enquetes from './Enquetes'
import Jogo from './Jogo'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [dbUser, setDbUser] = useState(null)

  return (
    <>
      {currentPage === 'home' && (
        <Home 
          onNavigate={setCurrentPage} 
          dbUser={dbUser} 
          setDbUser={setDbUser} 
        />
      )}
      {currentPage === 'enquetes' && (
        <Enquetes 
          onNavigate={setCurrentPage} 
          dbUser={dbUser} 
        />
      )}
      {currentPage === 'jogo' && (
        <Jogo 
          onNavigate={setCurrentPage} 
          dbUser={dbUser} 
          setDbUser={setDbUser} 
        />
      )}
    </>
  )
}

export default App
