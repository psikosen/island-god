import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import BootScene from '../game/scenes/BootScene'
import GameScene from '../game/scenes/GameScene'
import UIScene from '../game/scenes/UIScene'

const GameComponent = ({ setGameInstance, gameState, updateGameState }) => {
  const gameRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      const config = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 800,
        height: 600,
        backgroundColor: '#4488aa',
        scene: [BootScene, GameScene, UIScene],
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: process.env.NODE_ENV === 'development'
          }
        },
        callbacks: {
          postBoot: (game) => {
            // Store the game instance in React state for other components to access
            setGameInstance(game)
          }
        }
      }

      // Initialize Phaser game
      gameRef.current = new Phaser.Game(config)

      // Set up global game data
      gameRef.current.registry.set('gameState', gameState)
      gameRef.current.registry.set('updateGameState', updateGameState)

      // Clean up on unmount
      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true)
          gameRef.current = null
        }
      }
    }
  }, [])

  // Update game registry when gameState changes
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set('gameState', gameState)
    }
  }, [gameState])

  return (
    <div className="phaser-container" ref={containerRef}></div>
  )
}

export default GameComponent