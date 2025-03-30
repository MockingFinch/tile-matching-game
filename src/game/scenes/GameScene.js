import * as Phaser from "phaser";

// --- Constants ---
const GRID_WIDTH = 8; // Number of columns
const GRID_HEIGHT = 8; // Number of rows
const TILE_SIZE = 64; // Pixel size of each tile (adjust based on your assets)
const TILE_PADDING = 4; // Define padding as a constant
const ASSET_KEYS = [
  "food_1",
  "food_2",
  "food_3",
  "food_4",
  "food_5",
  "food_6",
]; // Keys matching the filenames (without extension)

// --- Helper Function --- (Can be moved to a utils file later)
function getRandomTileKey() {
  const randomIndex = Phaser.Math.Between(0, ASSET_KEYS.length - 1);
  return ASSET_KEYS[randomIndex];
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.grid = []; // 2D array to hold tile data
    this.tileSprites = null; // Phaser group for tile sprites
    this.tileBackgrounds = null; // Phaser graphics object for tile backgrounds

    // --- NEW: Selection State ---
    this.selectedTile = null;
    this.canSelect = true; // Flag to prevent input during animations/matching
    
    // New tracking variables
    this.score = 0;
    this.moves = 20; // Starting with 20 moves
    this.isProcessingMatches = false;

    // --- MODIFY: Set sound disabled by default ---
    this.soundEnabled = false; // Default to OFF since files don't exist yet
    this.soundsLoaded = false; // Track if sounds were loaded
  }

  preload() {
    console.log("Preloading assets...");
    // Load all the food sticker images with the correct .webp extension
    ASSET_KEYS.forEach((key) => {
      this.load.image(key, `/assets/${key}.webp`);
      console.log(`Loading asset: ${key}`);
    });

    // Remove the old single logo load if it's still there
    // this.load.image('logo', '/assets/food_1.png'); // DELETE or COMMENT OUT this line

    // --- NEW: Load Special Tile Assets ---
    // TODO: Replace these with actual special tile images if available
    this.load.image('horizontal_line', `/assets/food_1.webp`); // Placeholder
    this.load.image('vertical_line', `/assets/food_2.webp`);   // Placeholder
    this.load.image('bomb', `/assets/food_3.webp`);           // Placeholder
    this.load.image('rainbow', `/assets/food_4.webp`);        // Placeholder

    // --- MODIFY: Skip loading sounds for now ---
    // We'll conditionally load them if the switch is toggled ON
  }

  create() {
    console.log("Creating scene...");

    // --- Calculate Grid Offset & Dimensions ---
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;
    this.gridOffsetX = Math.floor((screenWidth - gridPixelWidth) / 2);
    this.gridOffsetY = Math.floor((screenHeight - gridPixelHeight) / 2) + 50;

    // --- Optional: Set overall canvas background (e.g., light grey) ---
    // this.cameras.main.setBackgroundColor('#f0f0f0'); // Set in config or here

    // --- Create Graphics object for tile backgrounds ---
    // Ensure it's created before sprites if layering matters explicitly
    this.tileBackgrounds = this.add.graphics();
    this.tileBackgrounds.setDepth(0); // Set depth to be behind sprites

    // --- Title Text ---
    this.add
      .text(Math.floor(screenWidth / 2), Math.floor(this.gridOffsetY - 40), "食物消消乐", {
        font: "32px Arial",
        fill: "#333333", // Adjust color if needed
      })
      .setOrigin(0.5)
      .setDepth(10); // Ensure title is above everything else

    // --- NEW: Add score and moves text ---
    this.scoreText = this.add
      .text(20, 20, "分数: 0", {
        font: "24px Arial",
        fill: "#333333",
      })
      .setDepth(10);

    this.movesText = this.add
      .text(screenWidth - 20, 20, "剩余步数: 20", {
        font: "24px Arial",
        fill: "#333333",
      })
      .setOrigin(1, 0)
      .setDepth(10);
    // -----------------------------------

    // --- Initialize Grid Data and Sprites ---
    this.tileSprites = this.add.group(); // Sprites will have default depth (usually 0 or based on add order)
    this.initializeGrid();

    console.log("Grid initialized.");

    // --- Enable Input ---
    // Add input listener *after* tiles are created
    this.input.on("gameobjectdown", this.handleTileClick, this);

    // --- NEW: Initialize empty sounds object ---
    this.sounds = {};
    
    // --- MODIFY: Add sound toggle button with correct initial state ---
    const soundButton = this.add.text(
      this.cameras.main.width - 20, 
      this.cameras.main.height - 20, 
      "🔇", // Start with muted icon since soundEnabled is false
      { 
        font: "24px Arial",
        fill: "#333333",
        backgroundColor: "#dddddd",
        padding: { left: 8, right: 8, top: 5, bottom: 5 },
        borderRadius: 5
      }
    )
    .setOrigin(1, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(20);
    
    soundButton.on('pointerdown', () => {
      this.soundEnabled = !this.soundEnabled;
      soundButton.setText(this.soundEnabled ? "🔊" : "🔇");
      
      // Only try to load sounds if enabled and not already loaded
      if (this.soundEnabled && !this.soundsLoaded) {
        this.loadSounds();
      }
    });
  }

  initializeGrid() {
    console.log("Initializing grid data and sprites...");
    this.tileBackgrounds.clear();
    this.tileBackgrounds.fillStyle(0xffffff, 1); // White background color
    this.tileBackgrounds.lineStyle(1, 0xdddddd, 1); // Add border style once

    this.tileSprites.clear(true, true); // Clear existing sprites if re-initializing
    this.grid = []; // Reset grid data

    for (let row = 0; row < GRID_HEIGHT; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_WIDTH; col++) {
        const tileKey = getRandomTileKey();
        // Calculate center position for the cell
        const worldX = Math.floor(this.gridOffsetX + col * TILE_SIZE + TILE_SIZE / 2);
        const worldY = Math.floor(this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2);

        // 1. Draw the white background square using the Graphics object
        const bgX = Math.floor(this.gridOffsetX + col * TILE_SIZE);
        const bgY = Math.floor(this.gridOffsetY + row * TILE_SIZE);
        this.tileBackgrounds.fillRect(bgX, bgY, TILE_SIZE, TILE_SIZE);
        this.tileBackgrounds.strokeRect(bgX, bgY, TILE_SIZE, TILE_SIZE); // Draw border

        // 2. Create the food sticker sprite ON TOP of the background
        const tileSprite = this.tileSprites.create(worldX, worldY, tileKey);
        tileSprite.setDepth(1); // Ensure sprites are drawn above the graphics layer (depth 0)
        tileSprite.setData("gridRow", row);
        tileSprite.setData("gridCol", col);
        tileSprite.setData("tileKey", tileKey);

        // Set base display size and store it
        const baseWidth = TILE_SIZE - TILE_PADDING * 2;
        const baseHeight = TILE_SIZE - TILE_PADDING * 2;
        tileSprite.setDisplaySize(baseWidth, baseHeight);
        
        // Store the base size as data on the sprite for reference
        tileSprite.setData("baseWidth", baseWidth);
        tileSprite.setData("baseHeight", baseHeight);

        // --- Make the sprite interactive ---
        tileSprite.setInteractive();
        // ---------------------------------

        // Store sprite reference
        this.grid[row][col] = tileSprite;
      }
    }
    console.log("Grid population complete. Tile count:", this.tileSprites.getLength());
    // this.removeInitialMatches();
  }

  // --- MODIFY: checkForMatches to track match patterns ---
  checkForMatches() {
    let matchedTiles = [];
    let matchPatterns = []; // Store match pattern information
    
    // Check for horizontal matches
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH - 2; col++) {
        const tile1 = this.grid[row][col];
        const tile2 = this.grid[row][col + 1];
        const tile3 = this.grid[row][col + 2];
        
        if (tile1 && tile2 && tile3) {
          const key1 = tile1.getData("tileKey");
          const key2 = tile2.getData("tileKey");
          const key3 = tile3.getData("tileKey");
          
          if (key1 === key2 && key2 === key3) {
            // Found horizontal match of 3
            let matchLength = 3;
            let matchTiles = [tile1, tile2, tile3];
            
            // Check for longer matches (4 or 5 in a row)
            if (col + 3 < GRID_WIDTH) {
              const tile4 = this.grid[row][col + 3];
              if (tile4 && tile4.getData("tileKey") === key1) {
                matchTiles.push(tile4);
                matchLength = 4;
                
                // Check for 5 in a row
                if (col + 4 < GRID_WIDTH) {
                  const tile5 = this.grid[row][col + 4];
                  if (tile5 && tile5.getData("tileKey") === key1) {
                    matchTiles.push(tile5);
                    matchLength = 5;
                  }
                }
              }
            }
            
            // Add to matched tiles list
            matchTiles.forEach(tile => {
              if (!matchedTiles.includes(tile)) {
                matchedTiles.push(tile);
              }
            });
            
            // Record match pattern
            matchPatterns.push({
              type: 'horizontal',
              length: matchLength,
              row: row,
              col: col,
              tileKey: key1
            });
            
            // Skip ahead to avoid duplicate detections
            col += matchLength - 1;
          }
        }
      }
    }
    
    // Check for vertical matches
    for (let col = 0; col < GRID_WIDTH; col++) {
      for (let row = 0; row < GRID_HEIGHT - 2; row++) {
        const tile1 = this.grid[row][col];
        const tile2 = this.grid[row + 1][col];
        const tile3 = this.grid[row + 2][col];
        
        if (tile1 && tile2 && tile3) {
          const key1 = tile1.getData("tileKey");
          const key2 = tile2.getData("tileKey");
          const key3 = tile3.getData("tileKey");
          
          if (key1 === key2 && key2 === key3) {
            // Found vertical match of 3
            let matchLength = 3;
            let matchTiles = [tile1, tile2, tile3];
            
            // Check for longer vertical matches
            if (row + 3 < GRID_HEIGHT) {
              const tile4 = this.grid[row + 3][col];
              if (tile4 && tile4.getData("tileKey") === key1) {
                matchTiles.push(tile4);
                matchLength = 4;
                
                // Check for 5 in a row
                if (row + 4 < GRID_HEIGHT) {
                  const tile5 = this.grid[row + 4][col];
                  if (tile5 && tile5.getData("tileKey") === key1) {
                    matchTiles.push(tile5);
                    matchLength = 5;
                  }
                }
              }
            }
            
            // Add to matched tiles list
            matchTiles.forEach(tile => {
              if (!matchedTiles.includes(tile)) {
                matchedTiles.push(tile);
              }
            });
            
            // Record match pattern
            matchPatterns.push({
              type: 'vertical',
              length: matchLength,
              row: row,
              col: col,
              tileKey: key1
            });
            
            // Skip ahead to avoid duplicate detections
            row += matchLength - 1;
          }
        }
      }
    }
    
    // Store match patterns for special tile creation
    this.lastMatchPatterns = matchPatterns;
    
    return matchedTiles;
  }
  
  // --- MODIFY: processMatches to auto-activate special tiles ---
  processMatches(matchedTiles) {
    if (matchedTiles.length === 0) {
      this.canSelect = true;
      return;
    }
    
    this.isProcessingMatches = true;
    
    // 1. Calculate score for the matches
    const matchScore = matchedTiles.length * 10; // 10 points per tile
    this.score += matchScore;
    this.updateScoreText();
    
    console.log(`Found ${matchedTiles.length} matches! +${matchScore} points`);
    
    // --- MODIFY: Determine if we have a special match (4+ tiles) ---
    let specialTileInfo = null;
    
    if (this.lastMatchPatterns && this.lastMatchPatterns.length > 0) {
      for (const pattern of this.lastMatchPatterns) {
        if (pattern.length >= 4) {
          // Found a match that would create a special tile
          specialTileInfo = {
            pattern: pattern,
            row: pattern.type === 'horizontal' 
                ? pattern.row 
                : pattern.row + Math.floor(pattern.length/2),
            col: pattern.type === 'horizontal' 
                ? pattern.col + Math.floor(pattern.length/2) 
                : pattern.col,
            type: pattern.length >= 5 ? 'rainbow' : 
                  pattern.type === 'horizontal' ? 'horizontal_line' : 'vertical_line'
          };
          
          // Prioritize longer matches
          if (pattern.length >= 5) {
            break; // Rainbow powerup takes precedence
          }
        }
      }
    }
    
    // 2. Remove matched tiles from the grid with safety checks
    matchedTiles.forEach(tile => {
      // Skip if this position will be used for a special tile
      if (specialTileInfo && 
          tile.getData('gridRow') === specialTileInfo.row && 
          tile.getData('gridCol') === specialTileInfo.col) {
        return;
      }
      
      // Get the grid position with validation
      const row = tile.getData("gridRow");
      const col = tile.getData("gridCol");
      
      // Validate the grid position before setting to null
      if (row !== undefined && col !== undefined && 
          row >= 0 && row < GRID_HEIGHT && 
          col >= 0 && col < GRID_WIDTH &&
          this.grid[row] !== undefined) {
        this.grid[row][col] = null;
        
        // Animate tile disappearing
        this.tweens.add({
          targets: tile,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            // Remove from scene once animation completes
            tile.destroy();
          }
        });
      } else {
        console.warn(`Invalid grid position: [${row}, ${col}]`);
      }
    });
    
    // 3. Handle special tile creation and immediate activation
    if (specialTileInfo) {
      // --- MODIFY: Now we'll create and then immediately activate the special tile ---
      this.time.delayedCall(350, () => { // Small delay for better visual sequence
        // First briefly create and show the special tile
        const specialTile = this.createSpecialTile(specialTileInfo);
        
        // Then after a brief moment, auto-activate it
        this.time.delayedCall(500, () => {
          // Determine tiles to clear based on special type
          this.autoActivateSpecialTile(specialTile);
        });
      });
    } else {
      // No special tile - proceed directly to grid collapse
      this.time.delayedCall(400, () => {
        this.collapseGrid();
      });
    }
  }
  
  // --- MODIFY: createSpecialTile to return the created tile ---
  createSpecialTile(info) {
    const { row, col, type, pattern } = info;
    
    // Remove the old tile at this position if it exists
    const oldTile = this.grid[row][col];
    if (oldTile) {
      oldTile.destroy();
    }
    
    // Calculate position
    const worldX = Math.floor(this.gridOffsetX + col * TILE_SIZE + TILE_SIZE / 2);
    const worldY = Math.floor(this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2);
    
    // Create the new special tile
    const specialTile = this.add.sprite(worldX, worldY, type);
    specialTile.setDepth(1);
    specialTile.setData("gridRow", row);
    specialTile.setData("gridCol", col);
    specialTile.setData("tileKey", pattern.tileKey); 
    specialTile.setData("specialType", type);
    
    // Set display size
    const baseWidth = TILE_SIZE - TILE_PADDING * 2;
    const baseHeight = TILE_SIZE - TILE_PADDING * 2;
    specialTile.setDisplaySize(baseWidth, baseHeight);
    specialTile.setData("baseWidth", baseWidth);
    specialTile.setData("baseHeight", baseHeight);
    
    // Add visual effect for brief display
    specialTile.setTint(0xffff00); // Yellow tint
    
    // Make it pulse briefly
    this.tweens.add({
      targets: specialTile,
      scale: 1.3,
      duration: 300,
      yoyo: true,
    });
    
    // Update grid data
    this.grid[row][col] = specialTile;
    
    // Play sound
    this.playSound('special');
    
    console.log(`Created special tile of type ${type} at [${row}, ${col}]`);
    
    // Return the created tile so we can reference it later for activation
    return specialTile;
  }
  
  // --- NEW: Method to automatically activate special tile ---
  autoActivateSpecialTile(specialTile) {
    if (!specialTile) return;
    
    const specialType = specialTile.getData("specialType");
    const row = specialTile.getData("gridRow");
    const col = specialTile.getData("gridCol");
    
    console.log(`Auto-activating special tile type: ${specialType}`);
    this.playSound('special');
    
    // Determine which tiles to clear based on special type
    let tilesToClear = [];
    
    switch (specialType) {
      case 'horizontal_line':
        // Clear entire row
        for (let c = 0; c < GRID_WIDTH; c++) {
          if (this.grid[row][c] && this.grid[row][c] !== specialTile) {
            tilesToClear.push(this.grid[row][c]);
          }
        }
        break;
        
      case 'vertical_line':
        // Clear entire column
        for (let r = 0; r < GRID_HEIGHT; r++) {
          if (this.grid[r][col] && this.grid[r][col] !== specialTile) {
            tilesToClear.push(this.grid[r][col]);
          }
        }
        break;
        
      case 'bomb':
        // Clear 3x3 area
        for (let r = Math.max(0, row - 1); r <= Math.min(GRID_HEIGHT - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(GRID_WIDTH - 1, col + 1); c++) {
            if (this.grid[r][c] && this.grid[r][c] !== specialTile) {
              tilesToClear.push(this.grid[r][c]);
            }
          }
        }
        break;
        
      case 'rainbow':
        // For rainbow, clear all tiles of a random type
        const types = ASSET_KEYS.filter(key => key !== specialTile.getData("tileKey"));
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        for (let r = 0; r < GRID_HEIGHT; r++) {
          for (let c = 0; c < GRID_WIDTH; c++) {
            if (this.grid[r][c] && 
                this.grid[r][c] !== specialTile &&
                this.grid[r][c].getData("tileKey") === randomType) {
              tilesToClear.push(this.grid[r][c]);
            }
          }
        }
        break;
    }
    
    // Add bonus score for special tile activation
    this.score += tilesToClear.length * 15; // 15 points per tile for special activations
    this.updateScoreText();
    
    // Clear the special tile itself
    const specialRow = specialTile.getData("gridRow");
    const specialCol = specialTile.getData("gridCol");
    
    if (specialRow !== undefined && specialCol !== undefined &&
        this.grid[specialRow] && this.grid[specialRow][specialCol] === specialTile) {
      this.grid[specialRow][specialCol] = null;
    }
    
    // Animate the activation
    this.tweens.add({
      targets: specialTile,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        specialTile.destroy();
        
        // Process the tiles to clear if any
        if (tilesToClear.length > 0) {
          // We're creating a new match process with these tiles
          this.processMatches(tilesToClear);
        } else {
          // If somehow no tiles to clear, just proceed with grid collapse
          this.collapseGrid();
        }
      }
    });
  }

  // --- MODIFY: handleTileClick to disable special tile swapping ---
  handleTileClick(pointer, gameObject) {
    if (!this.canSelect || !this.tileSprites.contains(gameObject)) {
      return;
    }

    const clickedTile = gameObject;
    const clickedRow = clickedTile.getData("gridRow");
    const clickedCol = clickedTile.getData("gridCol");
    const specialType = clickedTile.getData("specialType");
    
    // Skip special tiles entirely - they can't be selected anymore
    if (specialType) {
      console.log("Special tiles auto-activate and cannot be manually selected");
      return;
    }
    
    // Also skip if the currently selected tile is special
    if (this.selectedTile && this.selectedTile.getData("specialType")) {
      this.deselectTile();
      return;
    }

    // Regular tile handling...
    if (this.selectedTile) {
      const selectedRow = this.selectedTile.getData("gridRow");
      const selectedCol = this.selectedTile.getData("gridCol");

      if (clickedTile === this.selectedTile) {
        this.deselectTile();
        return;
      }

      const dx = Math.abs(clickedCol - selectedCol);
      const dy = Math.abs(clickedRow - selectedRow);

      if (dx + dy === 1) {
        console.log(`Swapping [${selectedRow},${selectedCol}] with [${clickedRow},${clickedCol}]`);
        this.swapTiles(this.selectedTile, clickedTile);
      } else {
        this.deselectTile();
        this.selectTile(clickedTile);
      }
    } else {
      this.selectTile(clickedTile);
    }
  }

  // --- NEW: Swap Tiles ---
  swapTiles(tile1, tile2) {
    if (!tile1 || !tile2) return;

    this.canSelect = false;

    const tile1Row = tile1.getData("gridRow");
    const tile1Col = tile1.getData("gridCol");
    const tile2Row = tile2.getData("gridRow");
    const tile2Col = tile2.getData("gridCol");

    // Update grid data structure
    this.grid[tile1Row][tile1Col] = tile2;
    this.grid[tile2Row][tile2Col] = tile1;

    // Update data stored in sprites
    tile1.setData("gridRow", tile2Row);
    tile1.setData("gridCol", tile2Col);
    tile2.setData("gridRow", tile1Row);
    tile2.setData("gridCol", tile1Col);

    // Animate the visual swap
    const targetX1 = tile2.x;
    const targetY1 = tile2.y;
    const targetX2 = tile1.x;
    const targetY2 = tile1.y;
    const swapDuration = 200;

    // Deselect the visually selected tile before animation
    this.deselectTile();

    this.tweens.add({
      targets: tile1,
      x: targetX1,
      y: targetY1,
      duration: swapDuration,
      ease: "Power2",
    });

    this.tweens.add({
      targets: tile2,
      x: targetX2,
      y: targetY2,
      duration: swapDuration,
      ease: "Power2",
      onComplete: () => {
        console.log("Swap animation complete. Checking for matches...");
        
        // --- CHANGE: Decrement move counter ---
        this.moves--;
        this.updateMovesText();
        // --------------------------------
        
        // --- CHANGE: Check for matches ---
        const matchedTiles = this.checkForMatches();
        
        if (matchedTiles.length > 0) {
          // We found matches - start the match/collapse/refill process
          this.processMatches(matchedTiles);
        } else {
          // No matches - swap back (invalid move)
          console.log("No matches found. Swapping back...");
          this.swapBack(tile1, tile2);
        }
        // --------------------------------

        // --- ADD: Play swap sound ---
        this.playSound('swap');
      },
    });
  }
  
  // --- NEW: Swap tiles back ---
  swapBack(tile1, tile2) {
    // Swap positions back immediately without changing moves
    const tile1Row = tile1.getData("gridRow");
    const tile1Col = tile1.getData("gridCol");
    const tile2Row = tile2.getData("gridRow");
    const tile2Col = tile2.getData("gridCol");

    // Update grid data structure
    this.grid[tile1Row][tile1Col] = tile2;
    this.grid[tile2Row][tile2Col] = tile1;

    // Update data stored in sprites
    tile1.setData("gridRow", tile2Row);
    tile1.setData("gridCol", tile2Col);
    tile2.setData("gridRow", tile1Row);
    tile2.setData("gridCol", tile1Col);

    // Animate the visual swap back
    const targetX1 = tile2.x;
    const targetY1 = tile2.y;
    const targetX2 = tile1.x;
    const targetY2 = tile1.y;
    const swapDuration = 200;

    this.tweens.add({
      targets: tile1,
      x: targetX1,
      y: targetY1,
      duration: swapDuration,
      ease: "Power2",
    });

    this.tweens.add({
      targets: tile2,
      x: targetX2,
      y: targetY2,
      duration: swapDuration,
      ease: "Power2",
      onComplete: () => {
        // Add the move back since it wasn't a valid move
        this.moves++;
        this.updateMovesText();
         this.canSelect = true;

        // --- ADD: Play error sound ---
        this.playSound('error');
      },
    });
  }
  
  // --- FIX: Improve collapseGrid to handle empty spaces better ---
  collapseGrid() {
    console.log("Collapsing grid...");
    let pendingTiles = 0;
    let hasEmptyCells = false;

    // First, move all existing tiles down to fill gaps
    for (let col = 0; col < GRID_WIDTH; col++) {
      // Start from the bottom of each column and work up
      for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        if (this.grid[row][col] === null) {
          hasEmptyCells = true;
          
          // Look for the nearest tile above to move down
          let foundTile = false;
          for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
            if (this.grid[aboveRow][col] !== null) {
              // Found a tile to move down
              const tileToMove = this.grid[aboveRow][col];
              
              // Update the grid data
              this.grid[row][col] = tileToMove;
              this.grid[aboveRow][col] = null;
              
              // Update the tile's data
              tileToMove.setData("gridRow", row);
              
              // Calculate new position
              const newY = this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2;
              
              // Animate the tile moving down
              pendingTiles++;
              this.tweens.add({
                targets: tileToMove,
                y: newY,
                duration: 300,
                ease: 'Bounce.easeOut',
                onComplete: () => {
                  pendingTiles--;
                  if (pendingTiles === 0) {
                    this.refillEmptySpaces();
                  }
                }
              });
              
              foundTile = true;
              break;
            }
          }
          
          // If no tile was found above, this space needs a new tile
          if (!foundTile) {
            // We'll handle this in refillEmptySpaces
          }
        }
      }
    }
    
    // If no animations were started but we have empty cells, manually call refill
    if (pendingTiles === 0 && hasEmptyCells) {
      this.refillEmptySpaces();
    } else if (pendingTiles === 0 && !hasEmptyCells) {
      // No empty spaces at all
      this.isProcessingMatches = false;
      this.canSelect = true;
    }
  }

  // --- NEW: Create a dedicated method for refilling empty spaces ---
  refillEmptySpaces() {
    console.log("Refilling empty spaces...");
    let pendingTiles = 0;
    
    // Scan entire grid for null spaces and fill them
    for (let col = 0; col < GRID_WIDTH; col++) {
      for (let row = 0; row < GRID_HEIGHT; row++) {
        if (this.grid[row][col] === null) {
          // Create a new tile
          const tileKey = getRandomTileKey();
          
          // Calculate position (start above the grid)
          const worldX = Math.floor(this.gridOffsetX + col * TILE_SIZE + TILE_SIZE / 2);
          const startY = Math.floor(this.gridOffsetY - TILE_SIZE); // Start one tile height above grid
          const finalY = Math.floor(this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2);
          
          // Create the sprite
          const tileSprite = this.add.sprite(worldX, startY, tileKey);
          tileSprite.setDepth(1);
          tileSprite.setData("gridRow", row);
          tileSprite.setData("gridCol", col);
          tileSprite.setData("tileKey", tileKey);
          
          // Set display size
          const baseWidth = TILE_SIZE - TILE_PADDING * 2;
          const baseHeight = TILE_SIZE - TILE_PADDING * 2;
          tileSprite.setDisplaySize(baseWidth, baseHeight);
          tileSprite.setData("baseWidth", baseWidth);
          tileSprite.setData("baseHeight", baseHeight);
          
          // Make interactive
          tileSprite.setInteractive();
          this.tileSprites.add(tileSprite);
          
          // Update grid data
          this.grid[row][col] = tileSprite;
          
          // Animate falling
          pendingTiles++;
          this.tweens.add({
            targets: tileSprite,
            y: finalY,
            duration: 500,
            ease: 'Bounce.easeOut',
            delay: row * 50, // Stagger the drops slightly
            onComplete: () => {
              pendingTiles--;
              if (pendingTiles === 0) {
                // After all new tiles are in place, check for new matches
                this.checkAfterRefill();
              }
            }
          });
        }
      }
    }
    
    // If no new tiles were needed, still check for matches
    if (pendingTiles === 0) {
      this.checkAfterRefill();
    }
  }

  // --- NEW: Check for matches after refilling ---
  checkAfterRefill() {
    const newMatches = this.checkForMatches();
    
    if (newMatches.length > 0) {
      console.log(`Cascade! Found ${newMatches.length} more matches after refill`);
      // Play sound if enabled
      this.playSound('combo');
      this.processMatches(newMatches);
    } else {
      // No more matches, end the chain
      console.log("No more cascading matches");
      this.isProcessingMatches = false;
      this.canSelect = true;
      
      // Check if game is over
      if (this.moves <= 0) {
        this.gameOver();
      }
    }
  }
  
  // --- NEW: Game over ---
  gameOver() {
    // Basic game over message
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setDepth(20);
    
    // Create game over text
    const gameOverText = this.add.text(
      screenWidth / 2,
      screenHeight / 2 - 50,
      "游戏结束!",
      {
        font: "48px Arial",
        fill: "#ffffff"
      }
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(21);
    
    // Display final score
    const scoreText = this.add.text(
      screenWidth / 2,
      screenHeight / 2 + 20,
      `最终分数: ${this.score}`,
      {
        font: "32px Arial",
        fill: "#ffffff"
      }
    );
    scoreText.setOrigin(0.5);
    scoreText.setDepth(21);
    
    // Add restart button
    const restartButton = this.add.text(
      screenWidth / 2,
      screenHeight / 2 + 100,
      "再玩一次",
      {
        font: "26px Arial",
        fill: "#ffffff",
        backgroundColor: "#1a65ac",
        padding: { left: 15, right: 15, top: 10, bottom: 10 }
      }
    );
    restartButton.setOrigin(0.5);
    restartButton.setDepth(21);
    restartButton.setInteractive({ useHandCursor: true });
    
    restartButton.on("pointerdown", () => {
      // Restart the game
      this.scene.restart();
    });
  }
  
  // --- NEW: Update score text ---
  updateScoreText() {
    if (this.scoreText) {
      this.scoreText.setText(`分数: ${this.score}`);
    }
  }
  
  // --- NEW: Update moves text ---
  updateMovesText() {
    if (this.movesText) {
      this.movesText.setText(`剩余步数: ${this.moves}`);
    }
  }

  // --- NEW: Method to load sounds on demand ---
  loadSounds() {
    try {
      console.log("Attempting to load sound effects...");
      
      // Try to load the sound files
      this.load.audio('match', '/assets/sounds/match.mp3');
      this.load.audio('combo', '/assets/sounds/combo.mp3');
      this.load.audio('swap', '/assets/sounds/swap.mp3');
      this.load.audio('error', '/assets/sounds/error.mp3');
      this.load.audio('special', '/assets/sounds/special.mp3');
      
      // Start the load
      this.load.once('complete', () => {
        // Successfully loaded sounds
        this.sounds = {
          match: this.sound.add('match'),
          combo: this.sound.add('combo'),
          swap: this.sound.add('swap'),
          error: this.sound.add('error'),
          special: this.sound.add('special')
        };
        this.soundsLoaded = true;
        console.log("Sound effects loaded successfully");
      });
      
      this.load.once('loaderror', (fileObj) => {
        console.warn("Error loading sounds:", fileObj.src);
        this.soundEnabled = false;
        // Update button text to show sounds are disabled
        const soundButton = this.children.list.find(
          child => child.type === 'Text' && (child.text === "🔊" || child.text === "🔇")
        );
        if (soundButton) soundButton.setText("🔇");
      });
      
      this.load.start();
      
    } catch (error) {
      console.error("Failed to load sounds:", error);
      this.soundEnabled = false;
    }
  }
  
  // --- MODIFY: Helper method to play sounds ---
  playSound(key) {
    if (this.soundEnabled && this.soundsLoaded && this.sounds[key]) {
      this.sounds[key].play();
    }
  }

  update(time, delta) {
    // Game loop logic
  }

  // --- MISSING: Select Tile ---
  selectTile(tile) {
    if (!tile) return;
    this.selectedTile = tile;
    
    // Get the base dimensions from the sprite's data
    const baseWidth = tile.getData("baseWidth");
    const baseHeight = tile.getData("baseHeight");
    
    // Calculate slightly larger dimensions (e.g., 10% larger)
    const selectedWidth = baseWidth * 1.1;
    const selectedHeight = baseHeight * 1.1;
    
    // Tween the displayWidth and displayHeight
    this.tweens.add({
      targets: tile,
      displayWidth: selectedWidth,
      displayHeight: selectedHeight,
      duration: 100,
      ease: "Linear",
    });
    
    console.log(`Selected tile at [${tile.getData("gridRow")}, ${tile.getData("gridCol")}]`);
  }

  // --- MISSING: Deselect Tile ---
  deselectTile() {
    if (!this.selectedTile) return;
    
    // Get the base dimensions from the sprite's data
    const baseWidth = this.selectedTile.getData("baseWidth");
    const baseHeight = this.selectedTile.getData("baseHeight");
    
    // Tween back to the base dimensions
    this.tweens.add({
      targets: this.selectedTile,
      displayWidth: baseWidth,
      displayHeight: baseHeight,
      duration: 100,
      ease: "Linear",
    });
    
    console.log(
      `Deselected tile at [${this.selectedTile.getData("gridRow")}, ${this.selectedTile.getData("gridCol")}]`
    );
    this.selectedTile = null;
  }
} 