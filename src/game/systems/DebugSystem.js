/**
 * Debug System for Island God
 * 
 * This system provides enhanced debugging tools for the test branch.
 * It offers real-time monitoring of game state, performance metrics,
 * and developer commands for testing game features.
 */

export default class DebugSystem {
  constructor(scene) {
    this.scene = scene
    this.enabled = false
    this.showPerformance = false
    this.showGameState = false
    this.performanceMetrics = {
      fps: 0,
      drawCalls: 0,
      entityCount: 0,
      memoryUsage: 0
    }
    
    // Debug visualization elements
    this.debugGraphics = null
    this.debugTexts = []
    
    // Key bindings for debug functions
    this.configureKeyBindings()
    
    console.log('Debug System initialized - press F1 to toggle')
  }
  
  configureKeyBindings() {
    // Main debug toggle (F1)
    this.scene.input.keyboard.on('keydown-F1', () => {
      this.toggleDebug()
    })
    
    // Performance metrics toggle (F2)
    this.scene.input.keyboard.on('keydown-F2', () => {
      if (this.enabled) {
        this.togglePerformance()
      }
    })
    
    // Game state display toggle (F3)
    this.scene.input.keyboard.on('keydown-F3', () => {
      if (this.enabled) {
        this.toggleGameState()
      }
    })
    
    // Spawn test entities (F4)
    this.scene.input.keyboard.on('keydown-F4', () => {
      if (this.enabled) {
        this.spawnTestEntities()
      }
    })
    
    // Trigger test events (F5)
    this.scene.input.keyboard.on('keydown-F5', () => {
      if (this.enabled) {
        this.triggerTestEvent()
      }
    })
  }
  
  toggleDebug() {
    this.enabled = !this.enabled
    console.log(`Debug mode: ${this.enabled ? 'ENABLED' : 'DISABLED'}`)
    
    if (this.enabled) {
      this.createDebugVisuals()
    } else {
      this.clearDebugVisuals()
      this.showPerformance = false
      this.showGameState = false
    }
  }
  
  togglePerformance() {
    this.showPerformance = !this.showPerformance
    console.log(`Performance metrics: ${this.showPerformance ? 'VISIBLE' : 'HIDDEN'}`)
  }
  
  toggleGameState() {
    this.showGameState = !this.showGameState
    console.log(`Game state display: ${this.showGameState ? 'VISIBLE' : 'HIDDEN'}`)
  }
  
  createDebugVisuals() {
    // Create debug graphics if not exists
    if (!this.debugGraphics) {
      this.debugGraphics = this.scene.add.graphics()
    }
    
    // Create FPS counter
    const fpsText = this.scene.add.text(10, 580, 'FPS: 0', {
      font: '12px monospace',
      fill: '#00ff00'
    })
    fpsText.setDepth(1000)
    this.debugTexts.push(fpsText)
    
    // Create entity counter
    const entityText = this.scene.add.text(100, 580, 'Entities: 0', {
      font: '12px monospace',
      fill: '#00ff00'
    })
    entityText.setDepth(1000)
    this.debugTexts.push(entityText)
    
    // Create game state display
    const gameStateText = this.scene.add.text(600, 10, '', {
      font: '12px monospace',
      fill: '#00ff00',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 5 }
    })
    gameStateText.setDepth(1000)
    this.debugTexts.push(gameStateText)
  }
  
  clearDebugVisuals() {
    if (this.debugGraphics) {
      this.debugGraphics.clear()
    }
    
    this.debugTexts.forEach(text => {
      text.destroy()
    })
    this.debugTexts = []
  }
  
  spawnTestEntities() {
    console.log('Spawning test entities')
    
    // Spawn test natives
    if (this.scene.populationManager) {
      for (let i = 0; i < 5; i++) {
        this.scene.populationManager.createNative()
      }
    }
    
    // Spawn test settlers
    if (this.scene.populationManager) {
      for (let i = 0; i < 3; i++) {
        this.scene.populationManager.createSettler()
      }
    }
    
    // Spawn test invaders
    if (this.scene.populationManager) {
      for (let i = 0; i < 2; i++) {
        this.scene.populationManager.createInvader()
      }
    }
  }
  
  triggerTestEvent() {
    console.log('Triggering test event')
    
    // Choose a random event type to trigger
    const eventTypes = ['blessing', 'natualDisaster', 'bountifulHarvest', 'settlerArrival', 'invaderRaid', 'miracle']
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    
    // Try to trigger the event
    if (this.scene.eventSystem) {
      this.scene.eventSystem.applyEventEffects(randomEvent)
    }
  }
  
  update(dt) {
    if (!this.enabled) return
    
    // Clear previous debug visuals
    if (this.debugGraphics) {
      this.debugGraphics.clear()
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics()
    
    // Draw entity boundaries and paths if needed
    if (this.scene.populationManager) {
      this.drawEntityDebug()
    }
    
    // Draw terrain features if needed
    if (this.scene.islandManager) {
      this.drawTerrainDebug()
    }
    
    // Update debug text displays
    this.updateDebugTexts()
  }
  
  updatePerformanceMetrics() {
    // Update FPS
    this.performanceMetrics.fps = Math.round(this.scene.game.loop.actualFps)
    
    // Count entities
    if (this.scene.populationManager) {
      this.performanceMetrics.entityCount = 
        this.scene.populationManager.natives.length +
        this.scene.populationManager.settlers.length +
        this.scene.populationManager.invaders.length
        
      if (this.scene.faithSystem && this.scene.faithSystem.activeSummons) {
        this.performanceMetrics.entityCount += this.scene.faithSystem.activeSummons.length
      }
    }
  }
  
  drawEntityDebug() {
    if (!this.debugGraphics) return
    
    // Skip if not needed
    if (!this.showPerformance) return
    
    this.debugGraphics.lineStyle(1, 0xff0000, 0.5)
    
    // Draw debug boundaries around natives
    this.scene.populationManager.natives.forEach(native => {
      this.debugGraphics.strokeCircle(native.sprite.x, native.sprite.y, 10)
    })
    
    // Draw debug boundaries around settlers
    this.debugGraphics.lineStyle(1, 0x0000ff, 0.5)
    this.scene.populationManager.settlers.forEach(settler => {
      this.debugGraphics.strokeCircle(settler.sprite.x, settler.sprite.y, 10)
    })
    
    // Draw debug boundaries around invaders
    this.debugGraphics.lineStyle(1, 0xff00ff, 0.5)
    this.scene.populationManager.invaders.forEach(invader => {
      this.debugGraphics.strokeCircle(invader.sprite.x, invader.sprite.y, 10)
    })
  }
  
  drawTerrainDebug() {
    if (!this.debugGraphics || !this.scene.islandManager.terrainFeatures) return
    
    // Skip if not needed
    if (!this.showPerformance) return
    
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.5)
    
    // Draw debug boundaries around terrain features
    this.scene.islandManager.terrainFeatures.forEach(feature => {
      if (feature.object && feature.object.x && feature.object.y) {
        this.debugGraphics.strokeCircle(feature.object.x, feature.object.y, 20)
      }
    })
  }
  
  updateDebugTexts() {
    if (this.debugTexts.length < 3) return
    
    // Update FPS counter
    this.debugTexts[0].setText(`FPS: ${this.performanceMetrics.fps}`)
    
    // Update entity counter
    this.debugTexts[1].setText(`Entities: ${this.performanceMetrics.entityCount}`)
    
    // Update game state display
    if (this.showGameState) {
      const gameState = this.scene.registry.get('gameState')
      if (gameState) {
        this.debugTexts[2].setText(
          `Faith: ${gameState.faith}\n` +
          `Mana: ${gameState.mana}\n` +
          `Hearts: ${gameState.hearts}\n` +
          `Natives: ${gameState.natives}\n` +
          `Settlers: ${gameState.settlers}\n` +
          `Invaders: ${gameState.invaders}\n` +
          `Cycle: ${Math.round(this.scene.dayNightCycle * 100) / 100}`
        )
      }
    } else {
      this.debugTexts[2].setText('')
    }
  }
}