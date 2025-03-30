"use client"; // This component runs only on the client

import { useEffect, useRef, useState } from "react";

// We'll dynamically import Phaser and the Scene to ensure they run client-side
let Phaser;
let GameScene;
let gameInstance = null; // Keep track of the game instance

const PhaserGame = () => {
  const gameContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 2560, height: window.innerHeight });

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (gameInstance) {
        gameInstance.scale.resize(2560, window.innerHeight);
        setDimensions({ width: 2560, height: window.innerHeight });
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
          // Use full viewport height and 2560 width (2K)
          const width = 2560;
          const height = window.innerHeight;
          
          setDimensions({ width, height });
          
          console.log(`Using 2K dimensions: ${width}x${height}`);
          
          const config = {
            type: Phaser.CANVAS, // Use CANVAS renderer explicitly to avoid WebGL issues
            parent: gameContainerRef.current,
            width: width,
            height: height,
            backgroundColor: "#f0f0f0",
            scene: [GameScene],
            // Explicitly disable WebGL
            render: {
              pixelArt: false,
              antialias: true
            },
            // Enable responsive scaling
            scale: {
              mode: Phaser.Scale.RESIZE,
              width: width,
              height: height
            }
          };

          console.log("Initializing Phaser game with 2K dimensions...");
          try {
            gameInstance = new Phaser.Game(config);
            console.log("Phaser game initialized successfully");
          } catch (err) {
            console.error("Error initializing Phaser:", err);
          }
        }
      });
    });

    // Cleanup function to destroy the game instance when the component unmounts
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

  // Use dynamic dimensions from state
  return (
    <div 
      ref={gameContainerRef} 
      id="phaser-game-container" 
      style={{ 
        width: `${dimensions.width}px`, 
        height: `${dimensions.height}px`,
        border: '1px solid #ccc',
        maxWidth: '100vw',
        overflow: 'hidden'
      }} 
    />
  );
};

export default PhaserGame; 