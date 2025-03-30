"use client"; // This component runs only on the client

import { useEffect, useRef } from "react";

// We'll dynamically import Phaser and the Scene to ensure they run client-side
let Phaser;
let GameScene;
let gameInstance = null; // Keep track of the game instance

const PhaserGame = () => {
  const gameContainerRef = useRef(null);

  useEffect(() => {
    // Dynamically import Phaser and Scene inside useEffect
    import("phaser").then((phaserModule) => {
      Phaser = phaserModule.default;
      import("@/game/scenes/GameScene").then((sceneModule) => {
        GameScene = sceneModule.GameScene;

        // Only create the game if it doesn't exist and container is ready
        if (!gameInstance && gameContainerRef.current) {
          // Force safe dimensions that work reliably
          const width = 800;
          const height = 600;
          
          console.log(`Using fixed dimensions: ${width}x${height}`);
          
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
            // Disable auto-resize which might cause issues
            scale: {
              mode: Phaser.Scale.NONE
            }
          };

          console.log("Initializing Phaser game with fixed dimensions...");
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
      if (gameInstance) {
        console.log("Destroying Phaser game...");
        gameInstance.destroy(true);
        gameInstance = null;
        Phaser = null;
        GameScene = null;
      }
    };
  }, []); 

  // Style with fixed dimensions that match our game config
  return (
    <div 
      ref={gameContainerRef} 
      id="phaser-game-container" 
      style={{ 
        width: '800px', 
        height: '600px',
        border: '1px solid #ccc'
      }} 
    />
  );
};

export default PhaserGame; 