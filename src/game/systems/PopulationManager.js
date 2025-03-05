import NativeAI from '../ai/NativeAI'
import SettlerAI from '../ai/SettlerAI'
import InvaderAI from '../ai/InvaderAI'

export default class PopulationManager {
  constructor(scene) {
    this.scene = scene
    
    // Population containers
    this.natives = []
    this.settlers = []
    this.invaders = []
    
    // Groups for visual entities
    this.nativeGroup = this.scene.add.group()
    this.settlerGroup = this.scene.add.group()
    this.invaderGroup = this.scene.add.group()
    
    // Sacred areas for natives to gather
    this.sacredAreas = []
  }
  
  initializeNatives(count) {
    // Create initial native population
    for (let i = 0; i < count; i++) {
      this.createNative()
    }
    
    // Create a couple of sacred areas
    this.createSacredArea(300, 250)
    this.createSacredArea(500, 350)
    
    console.log(`Initialized ${count} natives`)
  }
  
  createNative() {
    // Create a visual representation of a native
    const x = Phaser.Math.Between(300, 500)
    const y = Phaser.Math.Between(200, 400)
    
    const sprite = this.scene.add.circle(x, y, 5, 0x00FF00)
    this.nativeGroup.add(sprite)
    
    // Create AI controller
    const ai = new NativeAI(this.scene, sprite, this.sacredAreas)
    
    // Store native data
    const native = {
      sprite,
      ai,
      happiness: 50,
      faith: Phaser.Math.Between(30, 70),
      isTrueBeliever: Math.random() < 0.2 // 20% chance to be a "true believer"
    }
    
    this.natives.push(native)
    
    // Update game state
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    if (updateGameState) {
      updateGameState({
        natives: (gameState.natives || 0) + 1
      })
    }
    
    return native
  }
  
  createSettler() {
    // Create a visual representation of a settler
    const edgePositions = [
      { x: 0, y: Phaser.Math.Between(150, 450) },         // Left edge
      { x: 800, y: Phaser.Math.Between(150, 450) },       // Right edge
      { x: Phaser.Math.Between(200, 600), y: 0 },         // Top edge
      { x: Phaser.Math.Between(200, 600), y: 600 }        // Bottom edge
    ]
    
    const pos = Phaser.Utils.Array.GetRandom(edgePositions)
    
    const sprite = this.scene.add.circle(pos.x, pos.y, 5, 0x0000FF)
    this.settlerGroup.add(sprite)
    
    // Create AI controller
    const ai = new SettlerAI(this.scene, sprite)
    
    // Store settler data
    const settler = {
      sprite,
      ai,
      happiness: 20,
      faith: Phaser.Math.Between(10, 30)
    }
    
    this.settlers.push(settler)
    
    // Update game state
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    if (updateGameState) {
      updateGameState({
        settlers: (gameState.settlers || 0) + 1
      })
    }
    
    return settler
  }
  
  spawnInvaders(count) {
    // Create invaders that will try to attack the island
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    // Show an alert
    this.scene.game.events.emit('invaders-approaching', { count })
    
    // Spawn at the edges of the screen
    for (let i = 0; i < count; i++) {
      this.createInvader()
    }
    
    console.log(`Spawned ${count} invaders`)
  }
  
  createInvader() {
    // Determine spawn location (edge of the screen)
    const edgePositions = [
      { x: 0, y: Phaser.Math.Between(150, 450) },         // Left edge
      { x: 800, y: Phaser.Math.Between(150, 450) },       // Right edge
      { x: Phaser.Math.Between(200, 600), y: 0 },         // Top edge
      { x: Phaser.Math.Between(200, 600), y: 600 }        // Bottom edge
    ]
    
    const pos = Phaser.Utils.Array.GetRandom(edgePositions)
    
    const sprite = this.scene.add.circle(pos.x, pos.y, 5, 0xFF0000)
    this.invaderGroup.add(sprite)
    
    // Create AI controller targeting the center of the island
    const ai = new InvaderAI(this.scene, sprite, { x: 400, y: 300 })
    
    // Store invader data
    const invader = {
      sprite,
      ai,
      health: 100,
      damage: 10
    }
    
    this.invaders.push(invader)
    
    return invader
  }
  
  createSacredArea(x, y) {
    // Create a visual representation of a sacred area where natives will worship
    const area = this.scene.add.circle(x, y, 20, 0xFFFF00, 0.3)
    
    this.sacredAreas.push({
      x, y,
      radius: 20,
      object: area
    })
    
    return area
  }
  
  removeEntity(entity, group) {
    // Remove an entity from the specified group
    const index = group.indexOf(entity)
    if (index !== -1) {
      // Remove from array
      group.splice(index, 1)
      
      // Remove visual representation
      if (entity.sprite) {
        entity.sprite.destroy()
      }
      
      return true
    }
    
    return false
  }
  
  convertSettlerToNative(settler) {
    // Convert a settler into a native when they've been convinced
    this.removeEntity(settler, this.settlers)
    
    // Create a new native at the settler's position
    const pos = settler.sprite.getCenter()
    const sprite = this.scene.add.circle(pos.x, pos.y, 5, 0x00FF00)
    this.nativeGroup.add(sprite)
    
    // Create AI controller
    const ai = new NativeAI(this.scene, sprite, this.sacredAreas)
    
    // Store native data with higher initial faith (they're converts)
    const native = {
      sprite,
      ai,
      happiness: 70,
      faith: 60,
      isTrueBeliever: Math.random() < 0.5 // 50% chance for converts to be true believers
    }
    
    this.natives.push(native)
    
    // Update game state
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    if (updateGameState) {
      updateGameState({
        natives: (gameState.natives || 0) + 1,
        settlers: (gameState.settlers || 0) - 1
      })
    }
    
    return native
  }
  
  getRandomNative() {
    if (this.natives.length === 0) return null
    return Phaser.Utils.Array.GetRandom(this.natives)
  }
  
  getRandomSettler() {
    if (this.settlers.length === 0) return null
    return Phaser.Utils.Array.GetRandom(this.settlers)
  }
  
  getRandomInvader() {
    if (this.invaders.length === 0) return null
    return Phaser.Utils.Array.GetRandom(this.invaders)
  }
  
  update(dt) {
    // Update all population entities
    this.updateGroup(this.natives, dt)
    this.updateGroup(this.settlers, dt)
    this.updateGroup(this.invaders, dt)
    
    // Check for interactions between groups
    this.checkInteractions()
  }
  
  updateGroup(group, dt) {
    for (let i = 0; i < group.length; i++) {
      const entity = group[i]
      if (entity.ai) {
        entity.ai.update(dt)
      }
    }
  }
  
  checkInteractions() {
    // Check for proximity between different groups
    
    // Invaders attack natives
    this.invaders.forEach(invader => {
      this.natives.forEach(native => {
        if (this.checkProximity(invader.sprite, native.sprite, 20)) {
          // Invader attacks native
          this.combat(invader, native)
        }
      })
    })
    
    // Natives can convert settlers
    this.natives.forEach(native => {
      if (native.isTrueBeliever) {
        this.settlers.forEach(settler => {
          if (this.checkProximity(native.sprite, settler.sprite, 30)) {
            // Chance to convert based on native's faith
            if (Math.random() < native.faith / 200) { // Max 50% chance per update
              this.convertSettlerToNative(settler)
            }
          }
        })
      }
    })
  }
  
  checkProximity(sprite1, sprite2, distance) {
    const p1 = sprite1.getCenter()
    const p2 = sprite2.getCenter()
    
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    
    return Math.sqrt(dx * dx + dy * dy) < distance
  }
  
  combat(attacker, defender) {
    // Simple combat resolution
    if (defender.health) {
      defender.health -= attacker.damage
      
      // Visual feedback
      this.scene.tweens.add({
        targets: defender.sprite,
        alpha: 0.3,
        duration: 100,
        yoyo: true
      })
      
      // Check if defender is defeated
      if (defender.health <= 0) {
        if (defender === this.natives) {
          this.removeEntity(defender, this.natives)
          
          // Update game state
          const gameState = this.scene.registry.get('gameState')
          const updateGameState = this.scene.registry.get('updateGameState')
          
          if (updateGameState) {
            updateGameState({
              natives: Math.max(0, (gameState.natives || 0) - 1)
            })
          }
          
          // If it's a true believer, big impact on faith
          if (defender.isTrueBeliever) {
            if (updateGameState) {
              updateGameState({
                faith: Math.max(0, gameState.faith - 15),
                hearts: Math.max(0, gameState.hearts - 1)
              })
            }
          }
        }
      }
    }
  }
}