export default class EventSystem {
  constructor(scene) {
    this.scene = scene
    
    // Available random events
    this.events = {
      blessing: {
        name: 'Divine Blessing',
        probability: 0.2,
        description: 'A blessing from the heavens increases faith and happiness',
        minFaith: 30 // Minimum faith level required for this event
      },
      natualDisaster: {
        name: 'Natural Disaster',
        probability: 0.15,
        description: 'A natural disaster tests the faith of the natives',
        maxFaith: 70 // Only happens when faith is below this level
      },
      bountifulHarvest: {
        name: 'Bountiful Harvest',
        probability: 0.25,
        description: 'Food is plentiful, increasing native happiness',
        minFaith: 20
      },
      settlerArrival: {
        name: 'Settler Arrival',
        probability: 0.3,
        description: 'New settlers arrive on the island shores',
        minFaith: 0, // Can happen at any faith level
        cooldown: 120 // Minimum seconds between occurrences
      },
      invaderRaid: {
        name: 'Invader Raid',
        probability: 0.4,
        description: 'A group of invaders attempts to raid the island',
        maxFaith: 90, // Less likely at high faith
        cooldown: 180
      },
      miracle: {
        name: 'Island Miracle',
        probability: 0.1,
        description: 'A miraculous event dramatically increases faith',
        minFaith: 50,
        cooldown: 300
      }
    }
    
    // Track event cooldowns
    this.cooldowns = {}
    for (const event in this.events) {
      this.cooldowns[event] = 0
    }
    
    // Event history
    this.eventHistory = []
  }
  
  triggerRandomEvent() {
    console.log('Attempting to trigger random event')
    
    // Get current game state
    const gameState = this.scene.registry.get('gameState')
    
    // List of possible events based on current state
    const possibleEvents = []
    
    for (const eventKey in this.events) {
      const event = this.events[eventKey]
      
      // Check cooldown
      if (this.cooldowns[eventKey] > 0) continue
      
      // Check faith requirements
      if (event.minFaith !== undefined && gameState.faith < event.minFaith) continue
      if (event.maxFaith !== undefined && gameState.faith > event.maxFaith) continue
      
      // Add to possible events with its probability weight
      possibleEvents.push({
        key: eventKey,
        event: event,
        weight: event.probability
      })
    }
    
    // If no events are possible, return
    if (possibleEvents.length === 0) {
      console.log('No possible events at this time')
      return false
    }
    
    // Select a random event based on weights
    const totalWeight = possibleEvents.reduce((sum, event) => sum + event.weight, 0)
    let random = Math.random() * totalWeight
    let selectedEvent = null
    
    for (const event of possibleEvents) {
      random -= event.weight
      if (random <= 0) {
        selectedEvent = event
        break
      }
    }
    
    // If we selected an event, trigger it
    if (selectedEvent) {
      console.log(`Random event triggered: ${selectedEvent.event.name}`)
      
      // Set cooldown
      if (selectedEvent.event.cooldown) {
        this.cooldowns[selectedEvent.key] = selectedEvent.event.cooldown
      }
      
      // Add to history
      this.eventHistory.push({
        key: selectedEvent.key,
        name: selectedEvent.event.name,
        time: this.scene.time.now
      })
      
      // Apply event effects
      this.applyEventEffects(selectedEvent.key)
      
      return true
    }
    
    return false
  }
  
  applyEventEffects(eventKey) {
    const event = this.events[eventKey]
    
    // Get current game state
    const gameState = this.scene.registry.get('gameState')
    const updateGameState = this.scene.registry.get('updateGameState')
    
    // Apply different effects based on event type
    switch(eventKey) {
      case 'blessing':
        // Increase faith and happiness
        if (updateGameState) {
          updateGameState({
            faith: Math.min(100, gameState.faith + 15)
          })
        }
        
        // Apply happiness to all natives
        this.scene.populationManager.natives.forEach(native => {
          native.happiness = Math.min(100, native.happiness + 20)
        })
        
        // Visual effect
        this.createVisualEvent('blessing')
        
        // Notification
        this.scene.game.events.emit('event-occurred', {
          type: 'blessing',
          message: 'A divine blessing has increased faith and happiness!'
        })
        break
      
      case 'natualDisaster':
        // Decrease happiness but potentially increase faith for survivors
        this.scene.populationManager.natives.forEach(native => {
          native.happiness = Math.max(0, native.happiness - 30)
          
          // Potential faith increase for some (testing of faith)
          if (Math.random() < 0.3) {
            native.faith = Math.min(100, native.faith + 10)
          }
        })
        
        // Visual effect
        this.createVisualEvent('disaster')
        
        // Notification
        this.scene.game.events.emit('event-occurred', {
          type: 'disaster',
          message: 'A natural disaster has tested the natives\' faith!'
        })
        break
      
      case 'bountifulHarvest':
        // Increase happiness
        this.scene.populationManager.natives.forEach(native => {
          native.happiness = Math.min(100, native.happiness + 15)
        })
        
        // Visual effect
        this.createVisualEvent('harvest')
        
        // Notification
        this.scene.game.events.emit('event-occurred', {
          type: 'harvest',
          message: 'A bountiful harvest has increased native happiness!'
        })
        break
      
      case 'settlerArrival':
        // Spawn new settlers
        const settlerCount = Math.floor(Math.random() * 3) + 2 // 2-4 settlers
        
        for (let i = 0; i < settlerCount; i++) {
          this.scene.populationManager.createSettler()
        }
        
        // Update game state
        if (updateGameState) {
          updateGameState({
            settlers: gameState.settlers + settlerCount
          })
        }
        
        // Notification
        this.scene.game.events.emit('event-occurred', {
          type: 'settlers',
          message: `${settlerCount} new settlers have arrived on the island!`
        })
        break
      
      case 'invaderRaid':
        // Spawn a group of invaders
        const invaderCount = Math.floor(Math.random() * 4) + 3 // 3-6 invaders
        this.scene.populationManager.spawnInvaders(invaderCount)
        
        // Update game state
        if (updateGameState) {
          updateGameState({
            invaders: gameState.invaders + invaderCount
          })
        }
        
        // Notification
        this.scene.game.events.emit('event-occurred', {
          type: 'raid',
          message: `Warning: ${invaderCount} invaders are raiding the island!`
        })
        break
      
      case 'miracle':
        // Big faith boost
        if (updateGameState) {
          updateGameState({
            faith: Math.min(100, gameState.faith + 25),
            mana: Math.min(100, gameState.mana + 30)
          })
        }
        
        // Convert a random settler to a true believer native
        if (this.scene.populationManager.settlers.length > 0) {
          const settler = this.scene.populationManager.getRandomSettler()
          if (settler) {
            const native = this.scene.populationManager.convertSettlerToNative(settler)
            native.isTrueBeliever = true
            
            // Update hearts count
            if (updateGameState) {
              updateGameState({
                hearts: gameState.hearts + 1
              })
            }
          }
        }
        
        // Visual effect
        this.createVisualEvent('miracle')
        
        // Notification
        this.scene.game.events.emit('event-occurred', {
          type: 'miracle',
          message: 'A miracle has occurred! Faith is strengthened and a new true believer emerges!'
        })
        break
    }
  }
  
  createVisualEvent(type) {
    // Create visual effects for events
    const centerX = 400
    const centerY = 300
    
    switch(type) {
      case 'blessing':
        // Golden light from above
        const light = this.scene.add.circle(centerX, centerY, 100, 0xFFD700, 0.5)
        
        // Animation
        this.scene.tweens.add({
          targets: light,
          alpha: 0,
          scale: 2,
          duration: 2000,
          onComplete: () => {
            light.destroy()
          }
        })
        break
      
      case 'disaster':
        // Dark clouds and shake
        const clouds = this.scene.add.circle(centerX, centerY, 150, 0x333333, 0.7)
        
        // Screen shake
        this.scene.cameras.main.shake(1000, 0.01)
        
        // Animation
        this.scene.tweens.add({
          targets: clouds,
          alpha: 0,
          scale: 1.5,
          duration: 3000,
          onComplete: () => {
            clouds.destroy()
          }
        })
        break
      
      case 'harvest':
        // Green flourish
        const flourish = this.scene.add.circle(centerX, centerY, 120, 0x00AA00, 0.4)
        
        // Animation
        this.scene.tweens.add({
          targets: flourish,
          alpha: 0,
          scale: 1.7,
          duration: 2500,
          onComplete: () => {
            flourish.destroy()
          }
        })
        break
      
      case 'miracle':
        // Bright flash and radiating light
        this.scene.cameras.main.flash(500, 255, 255, 255)
        
        const miracle = this.scene.add.circle(centerX, centerY, 200, 0xFFFFFF, 0.8)
        
        // Animation
        this.scene.tweens.add({
          targets: miracle,
          alpha: 0,
          scale: 2.5,
          duration: 3000,
          onComplete: () => {
            miracle.destroy()
          }
        })
        break
    }
  }
  
  update(dt) {
    // Update cooldowns
    for (const event in this.cooldowns) {
      if (this.cooldowns[event] > 0) {
        this.cooldowns[event] = Math.max(0, this.cooldowns[event] - dt)
      }
    }
  }
}