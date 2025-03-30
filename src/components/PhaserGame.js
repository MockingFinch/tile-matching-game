"use client"; // This component runs only on the client

import { useEffect, useRef, useState } from "react";

// We'll dynamically import Phaser and the Scene to ensure they run client-side
let Phaser;
let GameScene;
let gameInstance = null; // Keep track of the game instance

const PhaserGame = () => {
  const gameContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 2560, height: window.innerHeight });
  const [gameLoaded, setGameLoaded] = useState(false);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (gameInstance) {
        // IMPORTANT: Use full window width instead of limiting to 90%
        const width = window.innerWidth;
        gameInstance.scale.resize(width, window.innerHeight);
        setDimensions({ width, height: window.innerHeight });
      }
    };

    window.addEventListener('resize', handleResize);

    // Dynamically import Phaser and Scene inside useEffect
    import("phaser").then((phaserModule) => {
      Phaser = phaserModule.default;
      import("@/game/scenes/GameScene").then((sceneModule) => {
        GameScene = sceneModule.GameScene;

        // Only create the game if it doesn't exist and container is ready
        if (!gameInstance && gameContainerRef.current) {
          // IMPORTANT: Use full window width
          const width = window.innerWidth; 
          const height = window.innerHeight;
          
          setDimensions({ width, height });
          
          console.log(`Using dimensions: ${width}x${height}`);
          
          const config = {
            type: Phaser.CANVAS,
            parent: gameContainerRef.current,
            width: width,
            height: height,
            backgroundColor: "#f8e1ea", 
            scene: [GameScene],
            render: {
              pixelArt: false,
              antialias: true,
              roundPixels: true
            },
            scale: {
              mode: Phaser.Scale.RESIZE,
              width: width,
              height: height,
              // IMPORTANT: Add these to ensure full screen
              autoCenter: Phaser.Scale.CENTER_BOTH,
              expandParent: true,
              orientation: Phaser.Scale.PORTRAIT // Force portrait orientation
            },
            textures: {
              crossOrigin: 'anonymous',
              premultiplyAlpha: false
            }
          };

          console.log("Initializing Phaser game...");
          try {
            // Create a loading indicator
            const loadingElement = document.createElement('div');
            loadingElement.style.position = 'absolute';
            loadingElement.style.top = '50%';
            loadingElement.style.left = '50%';
            loadingElement.style.transform = 'translate(-50%, -50%)';
            loadingElement.style.color = '#ff6b81';
            loadingElement.style.fontSize = '24px';
            loadingElement.style.fontWeight = 'bold';
            loadingElement.textContent = '载入中...'; // "Loading..." in Chinese
            gameContainerRef.current.appendChild(loadingElement);
            
            // Initialize the game
            gameInstance = new Phaser.Game(config);
            
            // Listen for the first scene to be created
            gameInstance.events.once('ready', () => {
              console.log("Phaser game ready");
              // Remove loading indicator after a brief delay
              setTimeout(() => {
                if (loadingElement.parentNode) {
                  loadingElement.parentNode.removeChild(loadingElement);
                }
                setGameLoaded(true);
              }, 500);
            });
            
            console.log("Phaser game initialized successfully");
          } catch (err) {
            console.error("Error initializing Phaser:", err);
          }
        }
      });
    });

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameInstance) {
        console.log("Destroying Phaser game...");
        gameInstance.destroy(true);
        gameInstance = null;
        Phaser = null;
        GameScene = null;
      }
    };
  }, []); 

  // Update the container styling to ensure it fills the entire viewport
  return (
    <div 
      ref={gameContainerRef} 
      id="phaser-game-container" 
      style={{ 
        width: '100vw', // IMPORTANT: Use 100vw instead of pixel width
        height: '100vh', // Use 100vh to ensure full height
        maxWidth: '100vw',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f8e1ea',
        margin: 0,
        padding: 0
      }} 
    />
  );
};

export default PhaserGame; 