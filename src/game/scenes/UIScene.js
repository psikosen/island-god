import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' })
    
    // UI elements
    this.faithBar = null
    this.manaBar = null
    this.alertText = null
    this.alertTimer = null
  }

  create() {
    // This scene overlays the game scene
    this.scene.bringToTop()
    
    // Create UI elements that will be updated directly in Phaser
    this.createBars()
    this.createAlertSystem()
    
    // Listen for events that should trigger alerts
    this.setupEventListeners()
  }
  
  createBars() {
    // Faith bar
    this.add.text(10, 10, 'Faith:', { fontSize: '16px', fill: '#ffffff' })
    const faithBarBg = this.add.rectangle(120, 20, 200, 20, 0x000000)
    this.faithBar = this.add.rectangle(120, 20, 200, 20, 0xffff00)
    this.faithBar.setOrigin(0, 0.5)
    faithBarBg.setOrigin(0, 0.5)
    
    // Mana bar
    this.add.text(10, 40, 'Mana:', { fontSize: '16px', fill: '#ffffff' })
    const manaBarBg = this.add.rectangle(120, 50, 200, 20, 0x000000)
    this.manaBar = this.add.rectangle(120, 50, 200, 20, 0x00ffff)
    this.manaBar.setOrigin(0, 0.5)
    manaBarBg.setOrigin(0, 0.5)
     
    // Update the UI with initial values
    this.updateUI()
  }
  
  createAlertSystem() {
    // Text for alerts that will appear and fade out
    this.alertText = this.add.text(400, 100, '', {
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    this.alertText.setOrigin(0.5)
    this.alertText.setAlpha(0)
  }
  
  setupEventListeners() {
    // Listen for events that should trigger alerts
    this.game.events.on('ritual-completed', (data) => {
      this.showAlert(`Ritual completed: ${data.type}`, 0xffff00)
    })
    
    this.game.events.on('entity-summoned', (data) => {
      this.showAlert(`Summoned: ${data.type}`, 0x00ffff)
    })
    
    this.game.events.on('terrain-modified', (data) => {
      this.showAlert(`Terrain changed: ${data.type}`, 0x00ff00)
    })
    
    this.game.events.on('invaders-approaching', (data) => {
      this.showAlert(`DANGER: ${data.count} invaders approaching!`, 0xff0000)
    })
    
    this.game.events.on('combat-result', (data) => {
      this.showAlert(`Combat result: ${data.result}`, 0xff00ff)
    })
  }
  
  showAlert(message, color = 0xffffff) {
    // Clear any existing alert timer
    if (this.alertTimer) {
      this.alertTimer.remove()
    }
    
    // Set the alert text and make it visible
    this.alertText.setText(message)
    this.alertText.setTint(color)
    this.alertText.setAlpha(1)
    
    // Create a tween to fade out the alert
    this.tweens.add({
      targets: this.alertText,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      delay: 1500
    })
  }
  
  updateUI() {
    // Get current game state
    const gameState = this.registry.get('gameState')
    if (!gameState) return
    
    // Update the faith bar
    const faithWidth = (gameState.faith / 100) * 200
    this.faithBar.width = faithWidth
    
    // Update the mana bar
    const manaWidth = (gameState.mana / 100) * 200 // Assuming 100 is max mana
    this.manaBar.width = manaWidth
  }
  
  update() {
    // Update the UI every frame
    this.updateUI()
  }
}