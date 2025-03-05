import React, { useEffect, useState } from 'react'
import GameComponent from './components/GameComponent'
import UI from './components/UI'

function App() {
  const [gameInstance, setGameInstance] = useState(null)
  const [gameState, setGameState] = useState({
    faith: 50,
    mana: 30,
    hearts: 0,
    natives: 10,
    settlers: 0,
    invaders: 0
  })

  // The UI can update the game state
  const updateGameState = (newState) => {
    setGameState(prevState => ({
      ...prevState,
      ...newState
    }))
  }

  return (
    <div className="app-container">
      <h1>Island God</h1>
      <div className="game-container">
        <GameComponent 
          setGameInstance={setGameInstance}
          gameState={gameState}
          updateGameState={updateGameState}
        />
        {gameInstance && (
          <UI 
            gameState={gameState}
            updateGameState={updateGameState}
            game={gameInstance}
          />
        )}
      </div>
    </div>
  )
}

export default App