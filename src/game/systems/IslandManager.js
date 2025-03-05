export default class IslandManager {
  constructor(scene) {
    this.scene = scene
    this.island = null
    this.terrainFeatures = []
  }
  
  createIsland() {
    // Create the base island sprite
    this.island = this.scene.add.image(400, 300, 'island')
    this.island.setScale(0.8)
    
    // Add terrain features group for additional elements
    this.terrainFeaturesGroup = this.scene.add.group()
    
    console.log('Island created')
  }
  
  pulseIsland() {
    // Visual effect for when the island is activated
    this.scene.tweens.add({
      targets: this.island,
      scaleX: this.island.scaleX * 1.05,
      scaleY: this.island.scaleY * 1.05,
      duration: 300,
      yoyo: true,
      ease: 'Sine.easeInOut'
    })
  }
  
  modifyTerrain(type) {
    console.log(`Modifying terrain: ${type}`)
    
    // Different terrain modifications based on type
    switch(type) {
      case 'mountain':
        this.createMountain()
        break
      case 'forest':
        this.createForest()
        break
      case 'volcano':
        this.createVolcano()
        break
      case 'barrier':
        this.createBarrier()
        break
      default:
        console.warn(`Unknown terrain type: ${type}`)
    }
    
    // Emit event for UI notification
    this.scene.game.events.emit('terrain-modified', { type })
  }
  
  createMountain() {
    // For now, we'll just create a simple triangle for a mountain
    const x = Phaser.Math.Between(200, 600)
    const y = Phaser.Math.Between(150, 450)
    
    const mountain = this.scene.add.triangle(
      x, y, 
      0, 30, 
      15, 0, 
      30, 30, 
      0x808080
    )
    
    this.terrainFeaturesGroup.add(mountain)
    this.terrainFeatures.push({ type: 'mountain', object: mountain })
    
    return mountain
  }
  
  createForest() {
    // Create a cluster of trees
    const x = Phaser.Math.Between(200, 600)
    const y = Phaser.Math.Between(150, 450)
    
    const forest = this.scene.add.group()
    
    // Add several tree-like shapes
    for (let i = 0; i < 5; i++) {
      const offsetX = Phaser.Math.Between(-20, 20)
      const offsetY = Phaser.Math.Between(-20, 20)
      
      // Create a tree (circle on a rectangle)
      const trunk = this.scene.add.rectangle(x + offsetX, y + offsetY + 10, 5, 15, 0x8B4513)
      const leaves = this.scene.add.circle(x + offsetX, y + offsetY, 10, 0x228B22)
      
      forest.add(trunk)
      forest.add(leaves)
    }
    
    this.terrainFeatures.push({ type: 'forest', object: forest })
    
    return forest
  }
  
  createVolcano() {
    // Create a volcano shape
    const x = Phaser.Math.Between(200, 600)
    const y = Phaser.Math.Between(150, 450)
    
    // Create the volcano shape (trapezoid)
    const volcano = this.scene.add.polygon(
      x, y,
      [
        -30, 30, // bottom left
        -15, -20, // top left
        15, -20, // top right
        30, 30 // bottom right
      ],
      0x8B0000
    )
    
    // Add a red circle on top for lava
    const lava = this.scene.add.circle(x, y - 15, 8, 0xFF4500)
    
    // Group the volcano parts
    const volcanoGroup = this.scene.add.group([volcano, lava])
    
    this.terrainFeaturesGroup.add(volcanoGroup)
    this.terrainFeatures.push({ type: 'volcano', object: volcanoGroup })
    
    return volcanoGroup
  }
  
  createBarrier() {
    // Create a barrier around part of the island
    const x = Phaser.Math.Between(200, 600)
    const y = Phaser.Math.Between(150, 450)
    
    // Create a semi-circle barrier
    const barrier = this.scene.add.arc(x, y, 40, 0, 180, false, 0x1E90FF, 0.6)
    
    this.terrainFeaturesGroup.add(barrier)
    this.terrainFeatures.push({ type: 'barrier', object: barrier })
    
    return barrier
  }
  
  // Method to sink part of the land (for combat)
  sinkLand(x, y) {
    // Visual effect for sinking land
    const sinkHole = this.scene.add.circle(x, y, 25, 0x0000FF, 0.5)
    
    // Animation to show the sinking effect
    this.scene.tweens.add({
      targets: sinkHole,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      onComplete: () => {
        sinkHole.destroy()
      }
    })
    
    return sinkHole
  }
  
  // Create a temporary weather effect
  createWeatherEffect(type, x, y) {
    let effect
    
    switch(type) {
      case 'lightning':
        // Create a lightning bolt
        effect = this.scene.add.line(
          x, y - 100, 
          0, 0, 
          0, 200, 
          0xFFFF00
        )
        effect.setLineWidth(5)
        
        // Lightning flash
        this.scene.cameras.main.flash(100, 255, 255, 200)
        
        // Destroy after a short time
        this.scene.time.delayedCall(300, () => {
          effect.destroy()
        })
        break
        
      case 'rain':
        // Create a particle emitter for rain
        const particles = this.scene.add.particles('drop') // This would need a rain drop asset
        
        effect = particles.createEmitter({
          x: { min: x - 100, max: x + 100 },
          y: y - 150,
          speedY: { min: 200, max: 300 },
          scale: { start: 0.5, end: 0.2 },
          quantity: 5,
          lifespan: 2000,
          alpha: { start: 0.8, end: 0 }
        })
        
        // Stop after a few seconds
        this.scene.time.delayedCall(5000, () => {
          particles.destroy()
        })
        break
        
      case 'hurricane':
        // Create a spinning visual effect
        effect = this.scene.add.circle(x, y, 50, 0xCCCCCC, 0.6)
        
        // Spin animation
        this.scene.tweens.add({
          targets: effect,
          angle: 360,
          duration: 2000,
          repeat: 2,
          onComplete: () => {
            effect.destroy()
          }
        })
        break
    }
    
    return effect
  }
  
  update(dt) {
    // Handle any ongoing terrain effects or animations
    // For now, we'll just use this to slightly move the island for a "breathing" effect
    if (this.island) {
      this.island.y += Math.sin(this.scene.time.now / 1000) * 0.05
    }
    
    // Update terrain features if needed
    this.terrainFeatures.forEach(feature => {
      // Custom update logic for specific terrain types
      if (feature.type === 'volcano') {
        // Make volcanoes pulse occasionally
        if (Math.random() < 0.01) {
          this.scene.tweens.add({
            targets: feature.object.getChildren(),
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true
          })
        }
      }
    })
  }
}