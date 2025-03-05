export default class FaithSystem {
  constructor(scene) {
    this.scene = scene
    
    // Reference to population manager
    this.populationManager = scene.populationManager
    
    // Available rituals and their effects
    this.rituals = {
      basic: {
        name: 'Basic Ritual',
        mana_cost: 10,
        faith_gain: 5,
        duration: 10, // seconds
        description: 'A simple ritual to boost faith'
      },
      sacrifice: {
        name: 'Sacrifice Ritual',
        mana_cost: 25,
        faith_gain: 15,
        duration: 20,
        description: 'A powerful ritual that requires a sacrifice'
      },
      blessing: {
        name: 'Blessing Ritual',
        mana_cost: 15,
        effects: {
          happiness: 10,
          fertility: 5
        },
        duration: 30,
        description: 'Blesses the natives with happiness and increased birth rate'
      }
    }
    
    // Summonable entities
    this.summonables = {
      defender: {
        name: 'Island Defender',
        mana_cost: 15,
        description: 'A spiritual entity that protects the island from invaders'
      },
      shadow: {
        name: 'Shadow',
        mana_cost: 20,
        description: 'A dark entity that spreads fear among invaders'
      },
      demon: {
        name: 'Island Demon',
        mana_cost: 35,
        description: 'A powerful demon that attacks invaders'
      }
    }
    
    // Active blessings
    this.activeBlessings = []
    
    // Active summoned entities
    this.activeSummons = []
    
    // Ritual sites
    this.ritualSites = []
  }
  
  createRitualSite(x, y) {
    // Create a visual representation of a ritual site
    const site = this.scene.add.circle(x, y, 25, 0xAA00FF, 0.4)
    
    this.ritualSites.push({
      x, y,
      object: site,
      active: false,
      ritual: null,
      timeRemaining: 0
    })
    
    return site
  }
  
  performRitual(type) {
    console.log(`Performing ritual: ${type}`)
    
    // Get ritual info
    const ritual = this.rituals[type]
    if (!ritual) {
      console.warn(`Unknown ritual type: ${type}`)
      return false
    }
    
    // Find an available ritual site or create one
    let site = this.ritualSites.find(s => !s.active)
    if (!site) {
      // Create a new site near the center
      const centerX = 400
      const centerY = 300
      const offsetX = Phaser.Math.Between(-50, 50)
      const offsetY = Phaser.Math.Between(-50, 50)
      
      site = this.createRitualSite(centerX + offsetX, centerY + offsetY)
    }
    
    // Activate the ritual
    site.active = true
    site.ritual = type
    site.timeRemaining = ritual.duration
    
    // Visual effect for the ritual
    this.scene.tweens.add({
      targets: site.object,
      scale: 1.5,
      alpha: 0.8,
      duration: 500,
      yoyo: true,
      repeat: 2
    })
    
    // Apply immediate effects
    this.applyRitualEffects(type)
    
    // Emit event for UI notification
    this.scene.game.events.emit('ritual-completed', { type })
    
    return true
  }
  
  applyRitualEffects(type) {
    const ritual = this.rituals[type]
    if (!ritual) return
    
    // Get current game state
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    // Apply different effects based on ritual type
    switch(type) {
      case 'basic':
        // Basic faith gain
        if (updateGameState) {
          updateGameState({
            faith: Math.min(100, gameState.faith + ritual.faith_gain)
          })
        }
        break
      
      case 'sacrifice':
        // Requires a sacrifice (reduce native population by 1)
        if (this.populationManager.natives.length > 0) {
          // Select a random native
          const nativeToSacrifice = this.populationManager.getRandomNative()
          if (nativeToSacrifice) {
            // Remove the native
            this.populationManager.removeEntity(nativeToSacrifice, this.populationManager.natives)
            
            // Big faith gain
            if (updateGameState) {
              updateGameState({
                faith: Math.min(100, gameState.faith + ritual.faith_gain),
                natives: gameState.natives - 1
              })
            }
            
            // If the sacrificed native was a true believer, gain even more
            if (nativeToSacrifice.isTrueBeliever) {
              if (updateGameState) {
                updateGameState({
                  faith: Math.min(100, gameState.faith + 15),
                  hearts: gameState.hearts + 1
                })
              }
            }
          }
        }
        break
      
      case 'blessing':
        // Apply happiness to all natives
        this.populationManager.natives.forEach(native => {
          native.happiness = Math.min(100, native.happiness + ritual.effects.happiness)
        })
        
        // Add an active blessing effect
        this.activeBlessings.push({
          type: 'blessing',
          timeRemaining: ritual.duration,
          effects: ritual.effects
        })
        break
    }
  }
  
  summonEntity(type) {
    console.log(`Summoning entity: ${type}`)
    
    // Get summon info
    const summon = this.summonables[type]
    if (!summon) {
      console.warn(`Unknown summon type: ${type}`)
      return false
    }
    
    // Create the summon visual at a random position on the island
    const x = Phaser.Math.Between(300, 500)
    const y = Phaser.Math.Between(200, 400)
    
    let sprite
    let behaviorUpdate
    
    switch(type) {
      case 'defender':
        sprite = this.scene.add.circle(x, y, 10, 0x00FFFF)
        
        // Defender behavior: patrol and attack invaders
        behaviorUpdate = (entity, dt) => {
          // Simple patrol behavior
          entity.patrolTimer = (entity.patrolTimer || 0) + dt
          
          if (entity.patrolTimer > 2) { // Change direction every 2 seconds
            entity.patrolTimer = 0
            entity.targetX = Phaser.Math.Between(300, 500)
            entity.targetY = Phaser.Math.Between(200, 400)
          }
          
          // Move toward target
          const dx = entity.targetX - entity.sprite.x
          const dy = entity.targetY - entity.sprite.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist > 5) {
            entity.sprite.x += dx * dt * 0.5
            entity.sprite.y += dy * dt * 0.5
          }
          
          // Attack nearby invaders
          const invaders = this.populationManager.invaders
          for (let i = 0; i < invaders.length; i++) {
            const invader = invaders[i]
            const distance = Phaser.Math.Distance.Between(
              entity.sprite.x, entity.sprite.y,
              invader.sprite.x, invader.sprite.y
            )
            
            if (distance < 50) {
              // Attack the invader
              if (invader.health) {
                invader.health -= 5 * dt // Damage over time
                
                // Visual feedback
                this.scene.tweens.add({
                  targets: invader.sprite,
                  alpha: 0.3,
                  duration: 100,
                  yoyo: true
                })
                
                // Check if invader is defeated
                if (invader.health <= 0) {
                  this.populationManager.removeEntity(invader, invaders)
                  
                  // Update game state
                  const gameState = this.scene.registry.get('gameState')
                  const updateGameState = this.scene.registry.get('updateGameState')
                  
                  if (updateGameState) {
                    updateGameState({
                      invaders: Math.max(0, gameState.invaders - 1)
                    })
                  }
                  
                  // Emit combat result event
                  this.scene.game.events.emit('combat-result', {
                    result: 'Invader defeated by Defender'
                  })
                  
                  break // Only attack one invader at a time
                }
              }
            }
          }
        }
        break
      
      case 'shadow':
        sprite = this.scene.add.circle(x, y, 12, 0x800080)
        
        // Shadow behavior: spread fear to slow down invaders
        behaviorUpdate = (entity, dt) => {
          // Move erratically
          entity.moveTimer = (entity.moveTimer || 0) + dt
          
          if (entity.moveTimer > 0.5) { // Change direction frequently
            entity.moveTimer = 0
            entity.dx = Phaser.Math.FloatBetween(-1, 1)
            entity.dy = Phaser.Math.FloatBetween(-1, 1)
          }
          
          // Move
          entity.sprite.x += entity.dx * 30 * dt
          entity.sprite.y += entity.dy * 30 * dt
          
          // Keep within bounds
          if (entity.sprite.x < 200) entity.dx = Math.abs(entity.dx)
          if (entity.sprite.x > 600) entity.dx = -Math.abs(entity.dx)
          if (entity.sprite.y < 100) entity.dy = Math.abs(entity.dy)
          if (entity.sprite.y > 500) entity.dy = -Math.abs(entity.dy)
          
          // Affect nearby invaders
          const invaders = this.populationManager.invaders
          for (let i = 0; i < invaders.length; i++) {
            const invader = invaders[i]
            const distance = Phaser.Math.Distance.Between(
              entity.sprite.x, entity.sprite.y,
              invader.sprite.x, invader.sprite.y
            )
            
            if (distance < 70) {
              // Apply a fear effect that slows the invader
              if (invader.ai) {
                invader.ai.applyFear(0.5, 5) // Slow to 50% speed for 5 seconds
              }
            }
          }
        }
        break
      
      case 'demon':
        sprite = this.scene.add.circle(x, y, 15, 0xFF0000)
        
        // Demon behavior: aggressively attack invaders
        behaviorUpdate = (entity, dt) => {
          // Target nearest invader
          const invaders = this.populationManager.invaders
          let nearestInvader = null
          let nearestDistance = Infinity
          
          for (let i = 0; i < invaders.length; i++) {
            const invader = invaders[i]
            const distance = Phaser.Math.Distance.Between(
              entity.sprite.x, entity.sprite.y,
              invader.sprite.x, invader.sprite.y
            )
            
            if (distance < nearestDistance) {
              nearestDistance = distance
              nearestInvader = invader
            }
          }
          
          // Move toward target or wander
          if (nearestInvader) {
            // Move toward the nearest invader
            const dx = nearestInvader.sprite.x - entity.sprite.x
            const dy = nearestInvader.sprite.y - entity.sprite.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist > 10) {
              entity.sprite.x += dx * dt * 0.7 // Faster than defender
              entity.sprite.y += dy * dt * 0.7
            } else {
              // Attack the invader when close enough
              if (nearestInvader.health) {
                nearestInvader.health -= 15 * dt // More damage than defender
                
                // Visual feedback for attack
                this.scene.tweens.add({
                  targets: nearestInvader.sprite,
                  scale: 0.7,
                  duration: 100,
                  yoyo: true
                })
                
                // Check if invader is defeated
                if (nearestInvader.health <= 0) {
                  this.populationManager.removeEntity(nearestInvader, invaders)
                  
                  // Update game state
                  const gameState = this.scene.registry.get('gameState')
                  const updateGameState = this.scene.registry.get('updateGameState')
                  
                  if (updateGameState) {
                    updateGameState({
                      invaders: Math.max(0, gameState.invaders - 1)
                    })
                  }
                  
                  // Emit combat result event
                  this.scene.game.events.emit('combat-result', {
                    result: 'Invader obliterated by Demon'
                  })
                }
              }
            }
          } else {
            // Wander around if no targets
            entity.wanderTimer = (entity.wanderTimer || 0) + dt
            
            if (entity.wanderTimer > 3) { // Change direction every 3 seconds
              entity.wanderTimer = 0
              entity.targetX = Phaser.Math.Between(300, 500)
              entity.targetY = Phaser.Math.Between(200, 400)
            }
            
            const dx = entity.targetX - entity.sprite.x
            const dy = entity.targetY - entity.sprite.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist > 5) {
              entity.sprite.x += dx * dt * 0.3
              entity.sprite.y += dy * dt * 0.3
            }
          }
        }
        break
        
      default:
        console.warn(`Unknown summon type behavior: ${type}`)
        return false
    }
    
    // Create the summon entity
    const summonEntity = {
      type,
      sprite,
      lifespan: 60, // 60 seconds default
      timeRemaining: 60,
      update: behaviorUpdate,
      targetX: x,
      targetY: y
    }
    
    // Add to active summons
    this.activeSummons.push(summonEntity)
    
    // Visual effect for summoning
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      scale: 2,
      duration: 0,
      onComplete: () => {
        this.scene.tweens.add({
          targets: sprite,
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Bounce.easeOut'
        })
      }
    })
    
    // Emit event for UI notification
    this.scene.game.events.emit('entity-summoned', { type })
    
    return summonEntity
  }
  
  calculateManaGain() {
    // Calculate mana generation based on faith, number of believers, etc.
    const baseGain = 5 // Base mana gain per cycle
    
    // Bonus from natives' faith
    let faithBonus = 0
    this.populationManager.natives.forEach(native => {
      faithBonus += (native.faith / 100) * (native.isTrueBeliever ? 2 : 1)
    })
    
    // Bonus from overall faith level
    const gameState = this.scene.registry.get('gameState')
    const faithLevelBonus = (gameState.faith / 100) * 10
    
    // Bonus from true believer hearts
    const heartBonus = gameState.hearts * 3
    
    return Math.floor(baseGain + faithBonus + faithLevelBonus + heartBonus)
  }
  
  calculateFaithChange() {
    // Calculate how faith changes based on current state
    let faithChange = 0
    
    // Average happiness of natives contributes to faith
    let totalHappiness = 0
    this.populationManager.natives.forEach(native => {
      totalHappiness += native.happiness
    })
    
    const avgHappiness = this.populationManager.natives.length > 0 ? 
      totalHappiness / this.populationManager.natives.length : 0
    
    // Happiness above 50 increases faith, below 50 decreases
    faithChange += (avgHappiness - 50) / 25
    
    // Active rituals and blessings contribute to faith
    this.ritualSites.forEach(site => {
      if (site.active && site.ritual) {
        faithChange += 0.5 // Small boost while ritual is active
      }
    })
    
    // Invader presence decreases faith
    const invaderCount = this.populationManager.invaders.length
    if (invaderCount > 0) {
      faithChange -= invaderCount * 0.5
    }
    
    return faithChange
  }
  
  update(dt) {
    // Update ritual sites
    this.updateRitualSites(dt)
    
    // Update active blessings
    this.updateActiveBlessings(dt)
    
    // Update summoned entities
    this.updateSummonedEntities(dt)
  }
  
  updateRitualSites(dt) {
    this.ritualSites.forEach(site => {
      if (site.active) {
        site.timeRemaining -= dt
        
        // Pulse effect for active sites
        if (Math.random() < 0.05) {
          this.scene.tweens.add({
            targets: site.object,
            alpha: 0.8,
            duration: 200,
            yoyo: true
          })
        }
        
        // End the ritual when time is up
        if (site.timeRemaining <= 0) {
          site.active = false
          site.ritual = null
          
          // Visual effect for ritual ending
          this.scene.tweens.add({
            targets: site.object,
            scale: 1,
            alpha: 0.4,
            duration: 500
          })
        }
      }
    })
  }
  
  updateActiveBlessings(dt) {
    for (let i = this.activeBlessings.length - 1; i >= 0; i--) {
      const blessing = this.activeBlessings[i]
      blessing.timeRemaining -= dt
      
      // Apply ongoing effects
      if (blessing.type === 'blessing') {
        // Periodically increase happiness
        if (Math.random() < 0.1 * dt) {
          this.populationManager.natives.forEach(native => {
            native.happiness = Math.min(100, native.happiness + 1)
          })
        }
        
        // Chance to spawn new natives (fertility effect)
        if (Math.random() < 0.01 * blessing.effects.fertility * dt) {
          this.populationManager.createNative()
        }
      }
      
      // Remove expired blessings
      if (blessing.timeRemaining <= 0) {
        this.activeBlessings.splice(i, 1)
      }
    }
  }
  
  updateSummonedEntities(dt) {
    for (let i = this.activeSummons.length - 1; i >= 0; i--) {
      const entity = this.activeSummons[i]
      
      // Update lifespan
      entity.timeRemaining -= dt
      
      // Run entity's behavior update
      if (entity.update) {
        entity.update(entity, dt)
      }
      
      // Remove expired entities
      if (entity.timeRemaining <= 0) {
        // Visual effect for disappearing
        this.scene.tweens.add({
          targets: entity.sprite,
          alpha: 0,
          scale: 0,
          duration: 500,
          onComplete: () => {
            entity.sprite.destroy()
          }
        })
        
        this.activeSummons.splice(i, 1)
      }
    }
  }
}