import Phaser from 'phaser'
import IslandManager from '../systems/IslandManager'
import PopulationManager from '../systems/PopulationManager'
import FaithSystem from '../systems/FaithSystem'
import CombatSystem from '../systems/CombatSystem'
import EventSystem from '../systems/EventSystem'
import DebugSystem from '../systems/DebugSystem' // Added for test branch

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    
    // Systems references
    this.islandManager = null
    this.populationManager = null
    this.faithSystem = null
    this.combatSystem = null
    this.eventSystem = null
    this.debugSystem = null // Added for test branch
    
    // Game state tracking
    this.gameSpeed = 1
    this.paused = false
    this.dayNightCycle = 0
    this.lastUpdate = 0
  }

  create() {
    // Get initial game state from registry
    const gameState = this.registry.get('gameState')
    
    // Initialize systems
    this.islandManager = new IslandManager(this)
    this.populationManager = new PopulationManager(this)
    this.faithSystem = new FaithSystem(this)
    this.combatSystem = new CombatSystem(this)
    this.eventSystem = new EventSystem(this)
    this.debugSystem = new DebugSystem(this) // Added for test branch
    
    // Create the island
    this.islandManager.createIsland()
    
    // Initialize populations
    this.populationManager.initializeNatives(gameState.natives)
    
    // Set up listeners for events from UI
    this.setupEventListeners()
    
    // Start the UIScene on top
    this.scene.launch('UIScene')
    
    // Set up the game loop timer
    this.time.addEvent({
      delay: 1000,
      callback: this.gameLoop,
      callbackScope: this,
      loop: true
    })
  }
  
  setupEventListeners() {
    // Listen for ritual requests
    this.game.events.on('ritual-requested', (data) => {
      console.log('Ritual requested:', data)
      const { type, cost } = data
      
      // Check if there's enough mana
      const gameState = this.registry.get('gameState')
      if (gameState.mana >= cost) {
        // Perform the ritual
        this.faithSystem.performRitual(type)
        
        // Update mana in the game state
        const updateGameState = this.registry.get('updateGameState')
        updateGameState({ mana: gameState.mana - cost })
        
        // Visual feedback
        this.islandManager.pulseIsland()
      }
    })
    
    // Listen for summon requests
    this.game.events.on('summon-requested', (data) => {
      console.log('Summon requested:', data)
      const { type, cost } = data
      
      const gameState = this.registry.get('gameState')
      if (gameState.mana >= cost) {
        // Summon the entity
        this.faithSystem.summonEntity(type)
        
        // Update mana in the game state
        const updateGameState = this.registry.get('updateGameState')
        updateGameState({ mana: gameState.mana - cost })
      }
    })
    
    // Listen for terrain modification requests
    this.game.events.on('terrain-modification-requested', (data) => {
      console.log('Terrain modification requested:', data)
      const { type, cost } = data
      
      const gameState = this.registry.get('gameState')
      if (gameState.mana >= cost) {
        // Modify the terrain
        this.islandManager.modifyTerrain(type)
        
        // Update mana in the game state
        const updateGameState = this.registry.get('updateGameState')
        updateGameState({ mana: gameState.mana - cost })
      }
    })
    
    // Debug mode toggle (for test branch)
    this.input.keyboard.on('keydown-D', () => {
      if (this.debugSystem) {
        this.debugSystem.toggleDebug()
      }
    })
  }
  
  gameLoop() {
    if (this.paused) return
    
    // Get current timestamp
    const now = this.time.now
    const dt = (now - this.lastUpdate) / 1000 * this.gameSpeed
    this.lastUpdate = now
    
    // Advance day/night cycle
    this.dayNightCycle += dt / 60 // one full cycle per minute of real time
    if (this.dayNightCycle >= 1) {
      this.dayNightCycle = 0
      this.onDayCycle()
    }
    
    // Update all systems
    this.islandManager.update(dt)
    this.populationManager.update(dt)
    this.faithSystem.update(dt)
    this.combatSystem.update(dt)
    this.eventSystem.update(dt)
    
    // Update debug system (added for test branch)
    if (this.debugSystem) {
      this.debugSystem.update(dt)
    }
    
    // Check win/loss conditions
    this.checkGameEndConditions()
  }
  
  onDayCycle() {
    console.log('New day cycle')
    
    // Generate resources
    const gameState = this.registry.get('gameState')
    const manaGain = this.faithSystem.calculateManaGain()
    const faithChange = this.faithSystem.calculateFaithChange()
    
    // Update game state with new resources
    const updateGameState = this.registry.get('updateGameState')
    updateGameState({
      mana: gameState.mana + manaGain,
      faith: Math.max(0, Math.min(100, gameState.faith + faithChange))
    })
    
    // Possibly spawn new invaders based on game state
    if (Math.random() < 0.3) { // 30% chance per day
      const invaderCount = Math.floor(Math.random() * 3) + 1
      this.populationManager.spawnInvaders(invaderCount)
      
      // Update invader count in game state
      updateGameState({
        invaders: gameState.invaders + invaderCount
      })
    }
    
    // Trigger random events
    this.eventSystem.triggerRandomEvent()
  }
  
  checkGameEndConditions() {
    // In test mode, don't trigger game end automatically
    if (this.debugSystem && this.debugSystem.enabled) return
    
    const gameState = this.registry.get('gameState')
    
    // Victory condition: High faith and all invaders defeated
    if (gameState.faith >= 90 && gameState.invaders === 0 && gameState.natives >= 10) {
      console.log('Victory condition met!')
      this.triggerVictory()
    }
    
    // Defeat condition: Faith reaches zero or all natives are gone
    if (gameState.faith <= 0 || gameState.natives <= 0) {
      console.log('Defeat condition met!')
      this.triggerDefeat()
    }
  }
  
  triggerVictory() {
    // Show victory screen
    this.scene.pause()
    
    // In test mode, just log victory instead of alert
    if (this.debugSystem && this.debugSystem.enabled) {
      console.log('DEBUG: Victory condition triggered - game would normally end here')
    } else {
      alert('Victory! The island has grown strong with the power of its believers!')
    }
    // In a real game, we'd show a proper victory screen and options to continue or restart
  }
  
  triggerDefeat() {
    // Show defeat screen
    this.scene.pause()
    
    // In test mode, just log defeat instead of alert
    if (this.debugSystem && this.debugSystem.enabled) {
      console.log('DEBUG: Defeat condition triggered - game would normally end here')
    } else {
      alert('Defeat! The island has lost its power as faith has waned...')
    }
    // In a real game, we'd show a proper defeat screen and options to restart
  }
  
  update() {
    // This runs every frame - keep light
    // Heavy processing should be in the gameLoop method which runs less frequently
  }
}