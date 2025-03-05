export default class NativeAI {
  constructor(scene, sprite, sacredAreas) {
    this.scene = scene
    this.sprite = sprite
    this.sacredAreas = sacredAreas || []
    
    // AI states
    this.states = {
      IDLE: 'idle',
      WORSHIPPING: 'worshipping',
      WANDERING: 'wandering',
      FLEEING: 'fleeing',
      BUILDING: 'building'
    }
    
    // Current state
    this.currentState = this.states.IDLE
    
    // State timers
    this.stateTimer = 0
    this.stateDuration = 5 // seconds before potentially changing state
    
    // Movement variables
    this.moveSpeed = 30 // pixels per second
    this.targetX = null
    this.targetY = null
    
    // Debug visual for current state
    this.debugText = scene.add.text(0, 0, '', { 
      fontSize: '8px', 
      fill: '#ffffff',
      backgroundColor: '#00000080'
    })
    this.debugText.setOrigin(0.5, 1)
    this.updateDebugText()
    
    // Start in idle state
    this.transitionToState(this.states.IDLE)
  }
  
  update(dt) {
    // Update state timer
    this.stateTimer += dt
    
    // Update based on current state
    switch (this.currentState) {
      case this.states.IDLE:
        this.updateIdleState(dt)
        break
      case this.states.WORSHIPPING:
        this.updateWorshippingState(dt)
        break
      case this.states.WANDERING:
        this.updateWanderingState(dt)
        break
      case this.states.FLEEING:
        this.updateFleeingState(dt)
        break
      case this.states.BUILDING:
        this.updateBuildingState(dt)
        break
    }
    
    // Update debug text position
    this.debugText.x = this.sprite.x
    this.debugText.y = this.sprite.y - 10
  }
  
  updateIdleState(dt) {
    // In idle state, the native just stands around for a while
    if (this.stateTimer >= this.stateDuration) {
      // Decide on next state
      const nextStateRoll = Math.random()
      
      if (this.sacredAreas.length > 0 && nextStateRoll < 0.6) {
        // 60% chance to go worship if sacred areas exist
        this.transitionToState(this.states.WORSHIPPING)
      } else if (nextStateRoll < 0.9) {
        // 30% chance to wander
        this.transitionToState(this.states.WANDERING)
      } else {
        // 10% chance to build
        this.transitionToState(this.states.BUILDING)
      }
    }
  }
  
  updateWorshippingState(dt) {
    // Choose a sacred area to worship at if we haven't already
    if (this.targetX === null && this.sacredAreas.length > 0) {
      const sacredArea = Phaser.Utils.Array.GetRandom(this.sacredAreas)
      
      // Set target to the sacred area
      this.targetX = sacredArea.x
      this.targetY = sacredArea.y
    }
    
    if (this.targetX !== null) {
      // Move toward the sacred area
      this.moveToward(this.targetX, this.targetY, dt)
      
      // If we've reached the sacred area
      const dx = this.targetX - this.sprite.x
      const dy = this.targetY - this.sprite.y
      const distanceSquared = dx * dx + dy * dy
      
      if (distanceSquared < 100) { // Within 10 pixels
        // Stay and worship
        
        // Visual worship effect (subtle pulse)
        if (Math.random() < 0.02) {
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true
          })
        }
        
        // End worship after a while
        if (this.stateTimer > 10) { // Worship for 10 seconds
          this.transitionToState(this.states.IDLE)
        }
      }
    } else {
      // No sacred areas, just go back to idle
      this.transitionToState(this.states.IDLE)
    }
  }
  
  updateWanderingState(dt) {
    // Set a random destination if we don't have one
    if (this.targetX === null) {
      this.chooseRandomDestination()
    }
    
    // Move toward the destination
    this.moveToward(this.targetX, this.targetY, dt)
    
    // Check if we've reached the destination
    const dx = this.targetX - this.sprite.x
    const dy = this.targetY - this.sprite.y
    const distanceSquared = dx * dx + dy * dy
    
    if (distanceSquared < 25) { // Within 5 pixels
      // Either choose a new destination or change state
      if (this.stateTimer < 10 && Math.random() < 0.7) {
        // 70% chance to pick a new destination if we haven't been wandering too long
        this.chooseRandomDestination()
      } else {
        // Go back to idle
        this.transitionToState(this.states.IDLE)
      }
    }
    
    // Check for nearby invaders to potentially trigger fleeing
    const invaders = this.scene.populationManager.invaders
    for (let i = 0; i < invaders.length; i++) {
      const invader = invaders[i]
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        invader.sprite.x, invader.sprite.y
      )
      
      if (distance < 50) {
        // Run away from invaders if they get close
        this.transitionToState(this.states.FLEEING, { threat: invader })
        break
      }
    }
  }
  
  updateFleeingState(dt) {
    // Run away from the threat
    const threat = this.stateData.threat
    
    if (threat && threat.sprite) {
      // Calculate direction away from threat
      const dx = this.sprite.x - threat.sprite.x
      const dy = this.sprite.y - threat.sprite.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 200) { // Keep fleeing if still close to threat
        // Normalize and set fleeing target position (away from threat)
        const dirX = dx / dist
        const dirY = dy / dist
        
        this.targetX = this.sprite.x + dirX * 100
        this.targetY = this.sprite.y + dirY * 100
        
        // Keep within island bounds
        this.targetX = Phaser.Math.Clamp(this.targetX, 200, 600)
        this.targetY = Phaser.Math.Clamp(this.targetY, 150, 450)
        
        // Move faster when fleeing
        this.moveToward(this.targetX, this.targetY, dt, this.moveSpeed * 1.5)
      } else {
        // Far enough away, go back to idle
        this.transitionToState(this.states.IDLE)
      }
    } else {
      // No threat or threat has been destroyed, return to idle
      this.transitionToState(this.states.IDLE)
    }
    
    // Maximum flee time - don't flee forever
    if (this.stateTimer > 7) {
      this.transitionToState(this.states.IDLE)
    }
  }
  
  updateBuildingState(dt) {
    // If no target, choose a place to build
    if (this.targetX === null) {
      // Find a spot away from other sacred areas
      let found = false
      let attempts = 0
      let candidateX, candidateY
      
      while (!found && attempts < 10) {
        // Try to find a good spot
        candidateX = Phaser.Math.Between(300, 500)
        candidateY = Phaser.Math.Between(200, 400)
        
        // Check if it's far enough from existing areas
        let tooClose = false
        for (const area of this.sacredAreas) {
          const dx = candidateX - area.x
          const dy = candidateY - area.y
          if (dx * dx + dy * dy < 10000) { // 100 pixels min distance
            tooClose = true
            break
          }
        }
        
        if (!tooClose) {
          found = true
          this.targetX = candidateX
          this.targetY = candidateY
        }
        
        attempts++
      }
      
      // If we couldn't find a good spot, just go back to idle
      if (!found) {
        this.transitionToState(this.states.IDLE)
        return
      }
    }
    
    // Move toward the building spot
    this.moveToward(this.targetX, this.targetY, dt)
    
    // Check if we've reached the spot
    const dx = this.targetX - this.sprite.x
    const dy = this.targetY - this.sprite.y
    const distanceSquared = dx * dx + dy * dy
    
    if (distanceSquared < 25) { // Within 5 pixels
      // Start building (visual effect)
      if (!this.buildingStarted) {
        this.buildingStarted = true
        
        // Visual effect for building
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.3,
          scaleY: 0.7,
          duration: 300,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            // Finish building after animation
            if (this.currentState === this.states.BUILDING) {
              // Create a new sacred area
              if (this.scene.populationManager && typeof this.scene.populationManager.createSacredArea === 'function') {
                this.scene.populationManager.createSacredArea(this.targetX, this.targetY)
                
                // Add to our local list too
                if (this.sacredAreas) {
                  this.sacredAreas.push({
                    x: this.targetX,
                    y: this.targetY,
                    radius: 20
                  })
                }
                
                // Return to idle
                this.transitionToState(this.states.IDLE)
              }
            }
          }
        })
      }
    }
    
    // Maximum building time
    if (this.stateTimer > 15) {
      this.transitionToState(this.states.IDLE)
    }
  }
  
  moveToward(x, y, dt, speed) {
    // Use provided speed or default
    const moveSpeed = speed || this.moveSpeed
    
    // Calculate direction to target
    const dx = x - this.sprite.x
    const dy = y - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist > 3) { // Only move if we're not already at the target
      // Normalize and apply movement
      const dirX = dx / dist
      const dirY = dy / dist
      
      this.sprite.x += dirX * moveSpeed * dt
      this.sprite.y += dirY * moveSpeed * dt
    }
  }
  
  chooseRandomDestination() {
    // Pick a random destination on the island
    this.targetX = Phaser.Math.Between(250, 550)
    this.targetY = Phaser.Math.Between(150, 450)
  }
  
  transitionToState(newState, stateData = {}) {
    // Exit current state
    switch (this.currentState) {
      case this.states.BUILDING:
        this.buildingStarted = false
        break
    }
    
    // Set new state
    this.currentState = newState
    this.stateTimer = 0
    this.stateData = stateData
    
    // Reset target
    this.targetX = null
    this.targetY = null
    
    // Enter new state
    switch (newState) {
      case this.states.IDLE:
        // Random idle duration
        this.stateDuration = Phaser.Math.FloatBetween(2, 6)
        break
      case this.states.WANDERING:
        this.chooseRandomDestination()
        break
    }
    
    this.updateDebugText()
  }
  
  updateDebugText() {
    if (this.debugText) {
      this.debugText.setText(this.currentState)
      
      // Color based on state
      switch (this.currentState) {
        case this.states.IDLE:
          this.debugText.setColor('#FFFFFF')
          break
        case this.states.WORSHIPPING:
          this.debugText.setColor('#FFFF00')
          break
        case this.states.WANDERING:
          this.debugText.setColor('#00FF00')
          break
        case this.states.FLEEING:
          this.debugText.setColor('#FF0000')
          break
        case this.states.BUILDING:
          this.debugText.setColor('#00FFFF')
          break
      }
    }
  }
}