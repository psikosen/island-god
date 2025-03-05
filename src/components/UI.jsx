import React, { useState } from 'react'

const UI = ({ gameState, updateGameState, game }) => {
  const [showDebug, setShowDebug] = useState(false)
  
  const performRitual = () => {
    // Dispatch an event to the game
    if (game) {
      game.events.emit('ritual-requested', {
        type: 'basic',
        cost: 10
      })
    }
  }
  
  const summonDefender = () => {
    if (game) {
      game.events.emit('summon-requested', {
        type: 'defender',
        cost: 15
      })
    }
  }
  
  const modifyTerrain = () => {
    if (game) {
      game.events.emit('terrain-modification-requested', {
        type: 'mountain',
        cost: 20
      })
    }
  }
  
  return (
    <div className="game-ui">
      <div className="resource-panel">
        <div>Faith: {gameState.faith}</div>
        <div>Mana: {gameState.mana}</div>
        <div>Hearts: {gameState.hearts}</div>
        <div>Population: {gameState.natives} natives, {gameState.settlers} settlers, {gameState.invaders} invaders</div>
      </div>
      
      <div className="action-panel">
        <button 
          onClick={performRitual}
          disabled={gameState.mana < 10}
        >
          Perform Ritual (10 mana)
        </button>
        
        <button 
          onClick={summonDefender}
          disabled={gameState.mana < 15}
        >
          Summon Defender (15 mana)
        </button>
        
        <button 
          onClick={modifyTerrain}
          disabled={gameState.mana < 20}
        >
          Modify Terrain (20 mana)
        </button>
      </div>
      
      <div className="debug-panel">
        <button onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
        
        {showDebug && (
          <div className="debug-info">
            <pre>{JSON.stringify(gameState, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default UI