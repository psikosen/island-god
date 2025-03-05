export default class CombatSystem {
  constructor(scene) {
    this.scene = scene
    
    // References to other systems
    this.populationManager = scene.populationManager
    this.islandManager = scene.islandManager
    
    // Available combat abilities
    this.abilities = {
      sinkLand: {
        name: 'Sink Land',
        mana_cost: 20,
        cooldown: 15, // seconds
        description: 'Causes the land to sink beneath invaders, slowing and damaging them'
      },
      lightning: {
        name: 'Lightning Strike',
        mana_cost: 30,
        cooldown: 20,
        description: 'Calls down lightning to damage invaders in an area'
      },
      earthquake: {
        name: 'Earthquake',
        mana_cost: 45,
        cooldown: 30,
        description: 'Creates a powerful earthquake that damages all invaders on the island'
      }
    }
    
    // Track ability cooldowns
    this.cooldowns = {
      sinkLand: 0,
      lightning: 0,
      earthquake: 0
    }
    
    // Active combat effects
    this.activeEffects = []
  }
  
  useAbility(type, targetX, targetY) {
    console.log(`Using combat ability: ${type} at ${targetX},${targetY}`)
    
    // Check if ability exists
    const ability = this.abilities[type]
    if (!ability) {
      console.warn(`Unknown ability type: ${type}`)
      return false
    }
    
    // Check cooldown
    if (this.cooldowns[type] > 0) {
      console.warn(`Ability ${type} is on cooldown for ${this.cooldowns[type]} more seconds`)
      return false
    }
    
    // Check mana cost
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    if (gameState.mana < ability.mana_cost) {
      console.warn(`Not enough mana to use ${type}`)
      return false
    }
    
    // Apply mana cost
    if (updateGameState) {
      updateGameState({
        mana: gameState.mana - ability.mana_cost
      })
    }
    
    // Set cooldown
    this.cooldowns[type] = ability.cooldown
    
    // Apply ability effects
    let effectSuccess = false
    
    switch(type) {
      case 'sinkLand':
        effectSuccess = this.applySinkLandEffect(targetX, targetY)
        break
      case 'lightning':
        effectSuccess = this.applyLightningEffect(targetX, targetY)
        break
      case 'earthquake':
        effectSuccess = this.applyEarthquakeEffect()
        break
      default:
        console.warn(`Unknown ability effect: ${type}`)
        return false
    }
    
    // Emit event for UI notification
    if (effectSuccess) {
      this.scene.game.events.emit('combat-ability-used', { 
        type,
        targetX,
        targetY
      })
    }
    
    return effectSuccess
  }
  
  applySinkLandEffect(targetX, targetY) {
    // Create the sinking land effect
    const sinkEffect = this.islandManager.sinkLand(targetX, targetY)
    
    // Find invaders in the area
    const radius = 50
    let invadersAffected = 0
    
    this.populationManager.invaders.forEach(invader => {
      const distance = Phaser.Math.Distance.Between(
        targetX, targetY,
        invader.sprite.x, invader.sprite.y
      )
      
      if (distance < radius) {
        // Damage and slow the invader
        if (invader.health) {
          invader.health -= 20
          invadersAffected++
          
          // Visual feedback
          this.scene.tweens.add({
            targets: invader.sprite,
            y: invader.sprite.y + 10,
            duration: 300,
            yoyo: true
          })
          
          // Apply slowing effect to AI
          if (invader.ai) {
            invader.ai.applyMovementPenalty(0.5, 5) // 50% speed for 5 seconds
          }
          
          // Check if invader is defeated
          if (invader.health <= 0) {
            this.populationManager.removeEntity(invader, this.populationManager.invaders)
            
            // Update game state
            const gameState = this.scene.registry.get('gameState')
            const updateGameState = this.scene.registry.get('updateGameState')
            
            if (updateGameState) {
              updateGameState({
                invaders: Math.max(0, gameState.invaders - 1)
              })
            }
          }
        }
      }
    })
    
    // Add to active effects
    this.activeEffects.push({
      type: 'sinkLand',
      object: sinkEffect,
      x: targetX,
      y: targetY,
      radius: radius,
      timeRemaining: 5 // Effect lasts for 5 seconds
    })
    
    // Emit combat result event
    this.scene.game.events.emit('combat-result', {
      result: `Sink Land affected ${invadersAffected} invaders`
    })
    
    return true
  }
  
  applyLightningEffect(targetX, targetY) {
    // Create visual lightning effect
    const lightningEffect = this.islandManager.createWeatherEffect('lightning', targetX, targetY)
    
    // Find invaders in the area
    const radius = 70
    let invadersAffected = 0
    
    this.populationManager.invaders.forEach(invader => {
      const distance = Phaser.Math.Distance.Between(
        targetX, targetY,
        invader.sprite.x, invader.sprite.y
      )
      
      if (distance < radius) {
        // Damage the invader
        if (invader.health) {
          invader.health -= 40 // High damage but targeted
          invadersAffected++
          
          // Visual feedback
          this.scene.tweens.add({
            targets: invader.sprite,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 3
          })
          
          // Check if invader is defeated
          if (invader.health <= 0) {
            this.populationManager.removeEntity(invader, this.populationManager.invaders)
            
            // Update game state
            const gameState = this.scene.registry.get('gameState')
            const updateGameState = this.scene.registry.get('updateGameState')
            
            if (updateGameState) {
              updateGameState({
                invaders: Math.max(0, gameState.invaders - 1)
              })
            }
          }
        }
      }
    })
    
    // Emit combat result event
    this.scene.game.events.emit('combat-result', {
      result: `Lightning Strike hit ${invadersAffected} invaders`
    })
    
    return true
  }
  
  applyEarthquakeEffect() {
    // Create visual earthquake effect across the island
    const centerX = 400
    const centerY = 300
    
    // Screen shake effect
    this.scene.cameras.main.shake(500, 0.01)
    
    // Damage all invaders on the island
    let invadersAffected = 0
    
    this.populationManager.invaders.forEach(invader => {
      // Only affect invaders actually on the island (near the center)
      const distance = Phaser.Math.Distance.Between(
        centerX, centerY,
        invader.sprite.x, invader.sprite.y
      )
      
      if (distance < 250) { // Island radius
        // Damage the invader
        if (invader.health) {
          invader.health -= 30 // Moderate damage but affects all
          invadersAffected++
          
          // Visual feedback
          this.scene.tweens.add({
            targets: invader.sprite,
            x: invader.sprite.x + Phaser.Math.Between(-10, 10),
            y: invader.sprite.y + Phaser.Math.Between(-10, 10),
            duration: 300,
            repeat: 2,
            yoyo: true
          })
          
          // Apply slowing effect to AI
          if (invader.ai) {
            invader.ai.applyMovementPenalty(0.7, 3) // 70% speed for 3 seconds
          }
          
          // Check if invader is defeated
          if (invader.health <= 0) {
            this.populationManager.removeEntity(invader, this.populationManager.invaders)
            
            // Update game state
            const gameState = this.scene.registry.get('gameState')
            const updateGameState = this.scene.registry.get('updateGameState')
            
            if (updateGameState) {
              updateGameState({
                invaders: Math.max(0, gameState.invaders - 1)
              })
            }
          }
        }
      }
    })
    
    // Also affect natives and settlers (less severely)
    this.populationManager.natives.forEach(native => {
      // Reduce happiness slightly
      native.happiness = Math.max(0, native.happiness - 5)
      
      // Visual feedback
      this.scene.tweens.add({
        targets: native.sprite,
        x: native.sprite.x + Phaser.Math.Between(-5, 5),
        y: native.sprite.y + Phaser.Math.Between(-5, 5),
        duration: 300,
        repeat: 1,
        yoyo: true
      })
    })
    
    this.populationManager.settlers.forEach(settler => {
      // Visual feedback
      this.scene.tweens.add({
        targets: settler.sprite,
        x: settler.sprite.x + Phaser.Math.Between(-5, 5),
        y: settler.sprite.y + Phaser.Math.Between(-5, 5),
        duration: 300,
        repeat: 1,
        yoyo: true
      })
    })
    
    // Emit combat result event
    this.scene.game.events.emit('combat-result', {
      result: `Earthquake affected ${invadersAffected} invaders`
    })
    
    return true
  }
  
  processInvaderAttacks() {
    // Have invaders damage natives they're close to
    const natives = this.populationManager.natives
    const invaders = this.populationManager.invaders
    
    invaders.forEach(invader => {
      // Find nearby natives
      natives.forEach(native => {
        const distance = Phaser.Math.Distance.Between(
          invader.sprite.x, invader.sprite.y,
          native.sprite.x, native.sprite.y
        )
        
        if (distance < 20) { // Close enough to attack
          // Reduce native happiness and potentially remove them
          native.happiness = Math.max(0, native.happiness - 10)
          
          // Visual feedback for attack
          this.scene.tweens.add({
            targets: native.sprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true
          })
          
          // If happiness drops to 0, native flees or dies
          if (native.happiness <= 0) {
            this.populationManager.removeEntity(native, natives)
            
            // Update game state
            const gameState = this.scene.registry.get('gameState')
            const updateGameState = this.scene.registry.get('updateGameState')
            
            if (updateGameState) {
              updateGameState({
                natives: Math.max(0, gameState.natives - 1)
              })
            }
            
            // If it was a true believer, big impact on faith
            if (native.isTrueBeliever) {
              if (updateGameState) {
                updateGameState({
                  faith: Math.max(0, gameState.faith - 10),
                  hearts: Math.max(0, gameState.hearts - 1)
                })
              }
            }
          }
        }
      })
    })
  }
  
  update(dt) {
    // Update ability cooldowns
    for (const ability in this.cooldowns) {
      if (this.cooldowns[ability] > 0) {
        this.cooldowns[ability] = Math.max(0, this.cooldowns[ability] - dt)
      }
    }
    
    // Update active combat effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i]
      effect.timeRemaining -= dt
      
      // Remove expired effects
      if (effect.timeRemaining <= 0) {
        if (effect.object && effect.object.destroy) {
          effect.object.destroy()
        }
        this.activeEffects.splice(i, 1)
      }
    }
    
    // Process invader attacks
    this.processInvaderAttacks()
  }
}