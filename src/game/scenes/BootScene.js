import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Show loading bar
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(240, 270, 320, 50)
    
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    })
    loadingText.setOrigin(0.5, 0.5)
    
    // Update progress bar as assets load
    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0xffffff, 1)
      progressBar.fillRect(250, 280, 300 * value, 30)
    })
    
    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })
    
    // Create placeholder assets in memory if not loaded
    this.load.on('loaderror', (fileObj) => {
      console.warn(`Error loading asset: ${fileObj.key}`)
      
      // Create placeholder graphics for missing assets
      const key = fileObj.key
      
      this.load.on('complete', () => {
        // Create placeholder texture for missing image
        if (key === 'island') {
          const graphics = this.make.graphics({ x: 0, y: 0, add: false })
          graphics.fillStyle(0x4488aa)
          graphics.fillCircle(150, 150, 150)
          graphics.generateTexture('island', 300, 300)
        } else if (key === 'native' || key === 'settler' || key === 'invader' || key === 'button') {
          const graphics = this.make.graphics({ x: 0, y: 0, add: false })
          
          if (key === 'native') {
            graphics.fillStyle(0x00FF00)
          } else if (key === 'settler') {
            graphics.fillStyle(0x0000FF)
          } else if (key === 'invader') {
            graphics.fillStyle(0xFF0000)
          } else {
            graphics.fillStyle(0xAAAAAA)
          }
          
          graphics.fillRect(0, 0, 32, 32)
          graphics.generateTexture(key, 32, 32)
        }
      })
    })
    
    // Create drop particle for rain effect
    const graphics = this.make.graphics({ x: 0, y: 0, add: false })
    graphics.fillStyle(0x0066FF, 0.8)
    graphics.fillRect(0, 0, 4, 8)
    graphics.generateTexture('drop', 4, 8)
    
    // Try to load assets
    try {
      this.load.image('island', '/src/assets/images/island.png')
      this.load.image('native', '/src/assets/images/native.png')
      this.load.image('settler', '/src/assets/images/settler.png')
      this.load.image('invader', '/src/assets/images/invader.png')
      this.load.image('button', '/src/assets/images/button.png')
    } catch (e) {
      console.error('Error loading assets:', e)
    }
  }

  create() {
    console.log('BootScene completed, starting GameScene')
    this.scene.start('GameScene')
  }
}