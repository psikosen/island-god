export default class InvaderAI {
  constructor(scene, sprite, target) {
    this.scene = scene
    this.sprite = sprite
    this.target = target || { x: 400, y: 300 } // Default to center of island
    
    // AI states
    this.states = {
      APPROACHING: 'approaching',
      RAIDING: 'raiding',
      ATTACKING: 'attacking',
      RETREATING: 'retreating',
      SCARED: 'scared'
    }
    
    // Current state
    this.currentState = this.states.APPROACHING
    
    // State timers
    this.stateTimer = 0
    this.stateDuration = 3 // seconds before potentially changing state
    
    // Movement variables
    this.moveSpeed = 40 // faster than natives and settlers
    this.targetX = null
    this.targetY = null
    
    // Effects
    this.fearFactor = 1.0 // Multiplier for movement speed when scared
    this.fearTimer = 0
    
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
    
    // Update fear timer
    if (this.fearTimer > 0) {
      this.fearTimer -= dt
      if (this.fearTimer <= 0) {
        // Reset fear factor when timer expires
        this.fearFactor = 1.0
      }
    }
    
    // Update based on current state
    switch (this.currentState) {
      case this.states.APPROACHING:
        this.updateApproachingState(dt)
        break
      case this.states.RAIDING:
        this.updateRaidingState(dt)
        break
      case this.states.ATTACKING:
        this.updateAttackingState(dt)
        break
      case this.states.RETREATING:
        this.updateRetreatingState(dt)
        break
      case this.states.SCARED:
        this.updateScaredState(dt)
        break
    }
    
    // Update debug text position
    this.debugText.x = this.sprite.x
    this.debugText.y = this.sprite.y - 10
  }
  
  updateApproachingState(dt) {
    // If no target, set target to the island center
    if (this.targetX === null) {
      this.targetX = this.target.x
      this.targetY = this.target.y
    }
    
    // Move toward the island
    this.moveToward(this.targetX, this.targetY, dt)
    
    // Check if we've reached the island
    const dx = this.targetX - this.sprite.x
    const dy = this.targetY - this.sprite.y
    const distanceSquared = dx * dx + dy * dy
    
    if (distanceSquared < 2500) { // Within 50 pixels of center
      // Start raiding the island
      this.transitionToState(this.states.RAIDING)
    }
    
    // Check for nearby defenders to potentially trigger scared state
    this.checkForDefenders(dt)
  }
  
  updateRaidingState(dt) {
    // Find and target natives or settlers
    const target = this.findClosestTarget()
    
    if (target) {
      // Move toward target
      this.targetX = target.sprite.x
      this.targetY = target.sprite.y
      
      this.moveToward(this.targetX, this.targetY, dt)
      
      // If we're close enough to target, switch to attacking
      const dx = this.targetX - this.sprite.x
      const dy = this.targetY - this.sprite.y
      const distanceSquared = dx * dx + dy * dy
      
      if (distanceSquared < 400) { // Within 20 pixels
        this.transitionToState(this.states.ATTACKING, { target })
      }
    } else {
      // No targets, wander around the island
      if (this.targetX === null || this.stateTimer > this.stateDuration) {
        this.chooseRandomDestination()
      }
      
      this.moveToward(this.targetX, this.targetY, dt)
    }
    
    // Check for defenders
    this.checkForDefenders(dt)
    
    // Occasionally retreat if we've been raiding too long
    if (this.stateTimer > 30 && Math.random() < 0.05 * dt) {
      this.transitionToState(this.states.RETREATING)
    }
  }
  
  updateAttackingState(dt) {
    const target = this.stateData.target
    
    if (target && target.sprite) {
      // Follow the target
      this.targetX = target.sprite.x
      this.targetY = target.sprite.y
      
      // Move toward target
      this.moveToward(this.targetX, this.targetY, dt)
      
      // If we're very close, attack animation
      const dx = this.targetX - this.sprite.x
      const dy = this.targetY - this.sprite.y
      const distanceSquared = dx * dx + dy * dy
      
      if (distanceSquared < 100) { // Within 10 pixels
        // Attack animation
        if (!this.attackStarted) {
          this.attackStarted = true
          
          // Visual effect for attack
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true
          })
        }
      } else if (distanceSquared > 2500) { // Target is too far (50 pixels)
        // Go back to raiding
        this.transitionToState(this.states.RAIDING)
      }
    } else {
      // Target is gone, back to raiding
      this.transitionToState(this.states.RAIDING)
    }
    
    // Check for defenders
    this.checkForDefenders(dt)
    
    // Maximum attack time
    if (this.stateTimer > 10) {
      this.transitionToState(this.states.RAIDING)
    }
  }
  
  updateRetreatingState(dt) {
    // If no retreat target, set one at the edge of the screen
    if (this.targetX === null) {
      this.setRetreatTarget()
    }
    
    // Move toward retreat point
    this.moveToward(this.targetX, this.targetY, dt)
    
    // Check if we've reached the edge
    const dx = this.targetX - this.sprite.x
    const dy = this.targetY - this.sprite.y
    const distanceSquared = dx * dx + dy * dy
    
    if (distanceSquared < 100) { // Within 10 pixels of the edge
      // We've reached the edge, remove the invader
      if (this.scene.populationManager) {
        // Find ourselves in the invaders array
        const invader = this.scene.populationManager.invaders.find(
          i => i.sprite === this.sprite
        )
        
        if (invader) {
          this.scene.populationManager.removeEntity(invader, this.scene.populationManager.invaders)
          
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
  }
  
  updateScaredState(dt) {
    // If no retreat target, set one away from the source of fear
    if (this.targetX === null) {
      this.setScaredRetreatTarget()
    }
    
    // Move away from fear source
    this.moveToward(this.targetX, this.targetY, dt, this.moveSpeed * this.fearFactor)
    
    // Check if we're far enough away
    const fearSource = this.stateData.source
    if (fearSource && fearSource.sprite) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        fearSource.sprite.x, fearSource.sprite.y
      )
      
      if (distance > 200) {
        // Far enough away, go back to approaching
        this.transitionToState(this.states.APPROACHING)
      }
    } else {
      // Fear source is gone, go back to approaching
      this.transitionToState(this.states.APPROACHING)
    }
    
    // Maximum scared time
    if (this.stateTimer > 5) {
      this.transitionToState(this.states.APPROACHING)
    }
  }
  
  findClosestTarget() {
    // Find the closest native or settler
    let closestTarget = null
    let closestDistance = Infinity
    
    // Check natives
    for (const native of this.scene.populationManager.natives) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        native.sprite.x, native.sprite.y
      )
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestTarget = native
      }
    }
    
    // Check settlers
    for (const settler of this.scene.populationManager.settlers) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        settler.sprite.x, settler.sprite.y
      )
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestTarget = settler
      }
    }
    
    return closestTarget
  }
  
  checkForDefenders(dt) {
    // Check for summoned defenders
    if (this.scene.faithSystem && this.scene.faithSystem.activeSummons) {
      for (const summon of this.scene.faithSystem.activeSummons) {
        const distance = Phaser.Math.Distance.Between(
          this.sprite.x, this.sprite.y,
          summon.sprite.x, summon.sprite.y
        )
        
        if (distance < 100 && (summon.type === 'defender' || summon.type === 'demon')) {
          // Chance to become scared based on defender type
          const fearChance = summon.type === 'demon' ? 0.7 : 0.3
          
          if (Math.random() < fearChance) {
            this.transitionToState(this.states.SCARED, { source: summon })
            break
          }
        }
      }
    }
  }
  
  setRetreatTarget() {
    // Choose a point at the edge of the screen
    const edges = [
      { x: 0, y: Phaser.Math.Between(100, 500) },      // Left edge
      { x: 800, y: Phaser.Math.Between(100, 500) },    // Right edge
      { x: Phaser.Math.Between(100, 700), y: 0 },      // Top edge
      { x: Phaser.Math.Between(100, 700), y: 600 }     // Bottom edge
    ]
    
    // Choose the closest edge
    let closestEdge = edges[0]
    let closestDistance = Infinity
    
    for (const edge of edges) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        edge.x, edge.y
      )
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestEdge = edge
      }
    }
    
    this.targetX = closestEdge.x
    this.targetY = closestEdge.y
  }
  
  setScaredRetreatTarget() {
    const fearSource = this.stateData.source
    
    if (fearSource && fearSource.sprite) {
      // Calculate direction away from fear source
      const dx = this.sprite.x - fearSource.sprite.x
      const dy = this.sprite.y - fearSource.sprite.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > 0) {
        // Normalize and set target position (away from fear source)
        const dirX = dx / dist
        const dirY = dy / dist
        
        this.targetX = this.sprite.x + dirX * 300
        this.targetY = this.sprite.y + dirY * 300
        
        // Keep within screen bounds
        this.targetX = Phaser.Math.Clamp(this.targetX, 50, 750)
        this.targetY = Phaser.Math.Clamp(this.targetY, 50, 550)
      } else {
        // If somehow at exact same position, just move in a random direction
        this.setRetreatTarget()
      }
    } else {
      // No fear source, just retreat to edge
      this.setRetreatTarget()
    }
  }
  
  moveToward(x, y, dt, speed) {
    // Use provided speed or default
    const moveSpeed = speed !== undefined ? speed : this.moveSpeed
    
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
      case this.states.ATTACKING:
        this.attackStarted = false
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
      case this.states.RAIDING:
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
        case this.states.RAIDING:
          this.debugText.setColor('#FF8000')
          break
        case this.states.ATTACKING:
          this.debugText.setColor('#FF0000')
          break
        case this.states.RETREATING:
          this.debugText.setColor('#00FF00')
          break
        case this.states.SCARED:
          this.debugText.setColor('#FFFF00')
          break
      }
    }
  }
  
  applyFear(factor, duration) {
    // Make the invader scared and slower
    this.fearFactor = factor
    this.fearTimer = duration
    
    // Transition to scared state if not already scared
    if (this.currentState !== this.states.SCARED) {
      // Find a nearby defender as the source of fear
      let fearSource = null
      
      if (this.scene.faithSystem && this.scene.faithSystem.activeSummons) {
        for (const summon of this.scene.faithSystem.activeSummons) {
          if (summon.type === 'shadow' || summon.type === 'defender' || summon.type === 'demon') {
            fearSource = summon
            break
          }
        }
      }
      
      this.transitionToState(this.states.SCARED, { source: fearSource })
    }
  }
  
  applyMovementPenalty(factor, duration) {
    // Slow down the invader temporarily
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