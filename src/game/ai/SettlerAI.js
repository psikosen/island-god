export default class SettlerAI {
  constructor(scene, sprite) {
    this.scene = scene
    this.sprite = sprite
    
    // AI states
    this.states = {
      APPROACHING: 'approaching',
      EXPLORING: 'exploring',
      SETTLING: 'settling',
      FLEEING: 'fleeing',
      RECEIVING: 'receiving'
    }
    
    // Current state
    this.currentState = this.states.APPROACHING
    
    // State timers
    this.stateTimer = 0
    this.stateDuration = 5 // seconds before potentially changing state
    
    // Movement variables
    this.moveSpeed = 25 // slightly slower than natives
    this.targetX = null
    this.targetY = null
    
    // Conversion tracking
    this.giftsReceived = 0
    this.conversionThreshold = 3
    
    // Debug visual for current state
    this.debugText = scene.add.text(0, 0, '', { 
      fontSize: '8px', 
      fill: '#ffffff',
      backgroundColor: '#00000080'
    })
    this.debugText.setOrigin(0.5, 1)
    this.updateDebugText()
    
    // Start in approaching state
    this.transitionToState(this.states.APPROACHING)
  }
  
  update(dt) {
    // Update state timer
    this.stateTimer += dt
    
    // Update based on current state
    switch (this.currentState) {
      case this.states.APPROACHING:
        this.updateApproachingState(dt)
        break
      case this.states.EXPLORING:
        this.updateExploringState(dt)
        break
      case this.states.SETTLING:
        this.updateSettlingState(dt)
        break
      case this.states.FLEEING:
        this.updateFleeingState(dt)
        break
      case this.states.RECEIVING:
        this.updateReceivingState(dt)
        break
    }
    
    // Update debug text position
    this.debugText.x = this.sprite.x
    this.debugText.y = this.sprite.y - 10
  }
  
  updateApproachingState(dt) {
    // If no target, set target to the center of the island
    if (this.targetX === null) {
      this.targetX = 400
      this.targetY = 300
    }
    
    // Move toward the island
    this.moveToward(this.targetX, this.targetY, dt)
    
    // Check if we've reached the island
    const dx = this.targetX - this.sprite.x
    const dy = this.targetY - this.sprite.y
    const distanceSquared = dx * dx + dy * dy
    
    if (distanceSquared < 2500) { // Within 50 pixels of center
      // Start exploring the island
      this.transitionToState(this.states.EXPLORING)
    }
    
    // Check for nearby invaders to potentially trigger fleeing
    this.checkForThreats(dt)
  }
  
  updateExploringState(dt) {
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
      // Choose a new destination or potentially settle
      if (this.stateTimer < 30 && Math.random() < 0.7) {
        // 70% chance to keep exploring if we haven't been at it too long
        this.chooseRandomDestination()
      } else {
        // Decide whether to settle or keep exploring
        if (Math.random() < 0.3) {
          this.transitionToState(this.states.SETTLING)
        } else {
          this.chooseRandomDestination()
        }
      }
    }
    
    // Check for nearby invaders
    this.checkForThreats(dt)
    
    // Check for blessings or gifts near sacred areas
    this.checkForBlessings(dt)
  }
  
  updateSettlingState(dt) {
    // If no target, find a good place to settle
    if (this.targetX === null) {
      // Find a spot away from both natives and other settlers
      const goodSpot = this.findSettlementSpot()
      
      if (goodSpot) {
        this.targetX = goodSpot.x
        this.targetY = goodSpot.y
      } else {
        // If we couldn't find a good spot, go back to exploring
        this.transitionToState(this.states.EXPLORING)
        return
      }
    }
    
    // Move toward the settlement spot
    this.moveToward(this.targetX, this.targetY, dt)
    
    // Check if we've reached the spot
    const dx = this.targetX - this.sprite.x
    const dy = this.targetY - this.sprite.y
    const distanceSquared = dx * dx + dy * dy
    
    if (distanceSquared < 25) { // Within 5 pixels
      // Start settling (visual effect)
      if (!this.settlementStarted) {
        this.settlementStarted = true
        
        // Visual effect for settling
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
          repeat: 3
        })
      }
      
      // Settled long enough to establish
      if (this.stateTimer > 10) {
        // Return to exploring after settling
        this.transitionToState(this.states.EXPLORING)
      }
    }
    
    // Check for threats while settling
    this.checkForThreats(dt)
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
        
        // Keep within reasonable bounds
        this.targetX = Phaser.Math.Clamp(this.targetX, 50, 750)
        this.targetY = Phaser.Math.Clamp(this.targetY, 50, 550)
        
        // Move faster when fleeing
        this.moveToward(this.targetX, this.targetY, dt, this.moveSpeed * 1.5)
      } else {
        // Far enough away, go back to exploring
        this.transitionToState(this.states.EXPLORING)
      }
    } else {
      // No threat or threat has been destroyed, return to exploring
      this.transitionToState(this.states.EXPLORING)
    }
    
    // Maximum flee time - don't flee forever
    if (this.stateTimer > 7) {
      this.transitionToState(this.states.EXPLORING)
    }
  }
  
  updateReceivingState(dt) {
    // In this state, the settler is receiving a blessing or gift
    
    // Visual effect of receiving
    if (!this.receivingStarted) {
      this.receivingStarted = true
      
      // Visual effect
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.7,
        scale: 1.3,
        duration: 500,
        yoyo: true,
        onComplete: () => {
          // Increment gifts received
          this.giftsReceived++
          
          // Check if we should convert
          if (this.giftsReceived >= this.conversionThreshold) {
            // Convert to native
            if (this.scene.populationManager) {
              this.scene.populationManager.convertSettlerToNative(
                this.scene.populationManager.settlers.find(s => s.sprite === this.sprite)
              )
            }
          } else {
            // Go back to exploring
            this.transitionToState(this.states.EXPLORING)
          }
        }
      })
    }
    
    // Maximum receiving time
    if (this.stateTimer > 3) {
      this.transitionToState(this.states.EXPLORING)
    }
  }
  
  checkForThreats(dt) {
    // Check for nearby invaders to potentially trigger fleeing
    const invaders = this.scene.populationManager.invaders
    for (let i = 0; i < invaders.length; i++) {
      const invader = invaders[i]
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        invader.sprite.x, invader.sprite.y
      )
      
      if (distance < 70) { // Settlers detect threats from further away than natives
        // Run away from invaders if they get close
        this.transitionToState(this.states.FLEEING, { threat: invader })
        break
      }
    }
  }
  
  checkForBlessings(dt) {
    // Check if we're near active rituals or blessings
    if (this.scene.faithSystem && this.scene.faithSystem.ritualSites) {
      for (const site of this.scene.faithSystem.ritualSites) {
        if (site.active) {
          const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            site.x, site.y
          )
          
          if (distance < 50) {
            // Enter receiving state when near active rituals
            this.transitionToState(this.states.RECEIVING, { site })
            break
          }
        }
      }
    }
    
    // Check for active blessings
    if (this.scene.faithSystem && this.scene.faithSystem.activeBlessings) {
      if (this.scene.faithSystem.activeBlessings.length > 0) {
        // If there are active blessings, small chance to receive
        if (Math.random() < 0.01 * dt) {
          this.transitionToState(this.states.RECEIVING)
        }
      }
    }
  }
  
  findSettlementSpot() {
    // Try to find a good spot away from others
    let found = false
    let attempts = 0
    let candidateX, candidateY
    
    while (!attempts < 10) {
      // Try to find a good spot
      candidateX = Phaser.Math.Between(200, 600)
      candidateY = Phaser.Math.Between(150, 450)
      
      // Check if it's far enough from natives and other settlers
      let tooClose = false
      
      // Check natives
      for (const native of this.scene.populationManager.natives) {
        const dx = candidateX - native.sprite.x
        const dy = candidateY - native.sprite.y
        if (dx * dx + dy * dy < 2500) { // 50 pixels min distance
          tooClose = true
          break
        }
      }
      
      // Check other settlers
      if (!tooClose) {
        for (const settler of this.scene.populationManager.settlers) {
          if (settler.sprite !== this.sprite) {
            const dx = candidateX - settler.sprite.x
            const dy = candidateY - settler.sprite.y
            if (dx * dx + dy * dy < 2500) { // 50 pixels min distance
              tooClose = true
              break
            }
          }
        }
      }
      
      if (!tooClose) {
        found = true
        break
      }
      
      attempts++
    }
    
    if (found) {
      return { x: candidateX, y: candidateY }
    }
    
    return null
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
    this.targetX = Phaser.Math.Between(200, 600)
    this.targetY = Phaser.Math.Between(150, 450)
  }
  
  transitionToState(newState, stateData = {}) {
    // Exit current state
    switch (this.currentState) {
      case this.states.SETTLING:
        this.settlementStarted = false
        break
      case this.states.RECEIVING:
        this.receivingStarted = false
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
      case this.states.EXPLORING:
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
        case this.states.APPROACHING:
          this.debugText.setColor('#FFFFFF')
          break
        case this.states.EXPLORING:
          this.debugText.setColor('#00FF00')
          break
        case this.states.SETTLING:
          this.debugText.setColor('#00FFFF')
          break
        case this.states.FLEEING:
          this.debugText.setColor('#FF0000')
          break
        case this.states.RECEIVING:
          this.debugText.setColor('#FFFF00')
          break
      }
    }
  }
  
  applyMovementPenalty(factor, duration) {
    // Slow down the settler temporarily
    this.originalMoveSpeed = this.moveSpeed
    this.moveSpeed *= factor
    
    // Reset after duration
    this.scene.time.delayedCall(duration * 1000, () => {
      if (this.originalMoveSpeed) {
        this.moveSpeed = this.originalMoveSpeed
        this.originalMoveSpeed = null
      }
    })
  }
}