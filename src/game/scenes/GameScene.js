import * as Phaser from "phaser";

// --- Constants ---
const GRID_WIDTH = 8; // Number of columns
const GRID_HEIGHT = 8; // Number of rows
const TILE_SIZE = 64; // Original tile size (we'll use this as default)
const TILE_PADDING = 4; // Define padding as a constant
const ASSET_KEYS = ["food_1", "food_2", "food_3", "food_4", "food_5", "food_6"]; // Keys matching the filenames (without extension)

// Add these new constants for our cute UI
const COLORS = {
  PASTEL_PINK: 0xffb6c1,
  PASTEL_BLUE: 0xadd8e6,
  PASTEL_YELLOW: 0xfffacd,
  PASTEL_GREEN: 0x98fb98,
  PASTEL_PURPLE: 0xdda0dd,
  SOFT_WHITE: 0xfcfcfc,
  TEXT_DARK: 0x5c3d46,
};

const FONTS = {
  TITLE: { font: "bold 32px Arial", fill: "#ff6b81" },
  SCORE: { font: "bold 24px Arial", fill: "#5c3d46" },
  MOVES: { font: "bold 24px Arial", fill: "#5c3d46" },
  GAME_OVER: { font: "bold 48px Arial", fill: "#ff6b81" },
  BUTTON: { font: "bold 26px Arial", fill: "#ffffff" },
};

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
    this.tileSize = TILE_SIZE; // Initialize with default but can be changed

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

    // Make sure texture loading is properly controlled
    this.textures.addBase64(
      "pixel",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
    );

    // Load all the food sticker images
    ASSET_KEYS.forEach((key) => {
      this.load.image(key, `/assets/${key}.webp`);
      console.log(`Loading asset: ${key}`);
    });

    // Load other assets as before
    this.load.image("horizontal_line", `/assets/food_1.webp`);
    this.load.image("vertical_line", `/assets/food_2.webp`);
    this.load.image("bomb", `/assets/food_3.webp`);
    this.load.image("rainbow", `/assets/food_4.webp`);
  }

  create() {
    console.log("Creating scene...");

    // --- Calculate dimensions first ---
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Fix the tile size calculation
    const maxGridHeight = screenHeight * 0.85;
    this.tileSize = Math.floor(maxGridHeight / GRID_HEIGHT);
    this.tileSize = Math.min(this.tileSize, 83); // Maximum tile size

    const gridPixelWidth = GRID_WIDTH * this.tileSize;
    const gridPixelHeight = GRID_HEIGHT * this.tileSize;
    this.gridOffsetX = Math.floor((screenWidth - gridPixelWidth) / 2);
    this.gridOffsetY = Math.floor((screenHeight - gridPixelHeight) / 2);

    // Create background and UI elements
    this.createCuteBackground();
    this.createGridFrame();
    this.tileBackgrounds = this.add.graphics();
    this.tileBackgrounds.setDepth(1);
    this.createCuteTitle();
    this.createScoreDisplay();
    this.createMovesDisplay();

    // --- CRITICAL FIX: Always initialize the grid images with correct sizing ---
    // Setup the tile sprites group before initializing
    this.tileSprites = this.add.group();

    // This tile will never be seen but ensures textures are loaded and sized correctly
    const hiddenTile = this.add.sprite(-100, -100, ASSET_KEYS[0]);
    hiddenTile.setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.7);
    hiddenTile.visible = false;

    // Initialize grid without any grow animations that could cause scaling issues
    this.initializeGridWithoutAnimations();

    // Setup input handlers
    this.input.on("gameobjectdown", this.onTilePointerDown, this);
    this.input.on("pointerup", this.onPointerUp, this);

    // Initialize sounds
    this.sounds = {};
    this.createSoundButton();
    this.createMascot();
  }

  // NEW: Create a cute pastel background
  createCuteBackground() {
    // Create a gradient background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // IMPORTANT: Add extra width to ensure complete coverage
    const extraWidth = 100; // Add extra pixels to prevent any gaps

    // Create gradient background using multiple rectangles
    const gradientSteps = 10;
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps;
      const colorTop = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(COLORS.PASTEL_PINK),
        Phaser.Display.Color.ValueToColor(COLORS.PASTEL_BLUE),
        gradientSteps,
        i
      );
      const fillColor = Phaser.Display.Color.GetColor(
        colorTop.r,
        colorTop.g,
        colorTop.b
      );

      const rectHeight = height / gradientSteps;
      const rectY = height * (i / gradientSteps);

      // Create rectangle wider than the screen to ensure full coverage
      const rect = this.add.rectangle(
        width / 2,
        rectY + rectHeight / 2,
        width + extraWidth,
        rectHeight + 1,
        fillColor
      );
      rect.setDepth(0);
    }

    // Add some cute decorative elements
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(10, 30);
      const circle = this.add.circle(x, y, size, COLORS.PASTEL_YELLOW, 0.3);
      circle.setDepth(0.1);
    }
  }

  // NEW: Create a decorative frame around the grid
  createGridFrame() {
    const gridWidth = GRID_WIDTH * this.tileSize;
    const gridHeight = GRID_HEIGHT * this.tileSize;
    const frameThickness = 20;

    // Create the main frame
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.PASTEL_PURPLE, 1);
    frame.fillRoundedRect(
      this.gridOffsetX - frameThickness,
      this.gridOffsetY - frameThickness,
      gridWidth + frameThickness * 2,
      gridHeight + frameThickness * 2,
      15 // corner radius
    );

    // Add inner frame with different color
    frame.fillStyle(COLORS.PASTEL_YELLOW, 1);
    frame.fillRoundedRect(
      this.gridOffsetX - frameThickness / 2,
      this.gridOffsetY - frameThickness / 2,
      gridWidth + frameThickness,
      gridHeight + frameThickness,
      10 // corner radius
    );

    frame.setDepth(0.5);
  }

  // NEW: Create a cute title with decorations
  createCuteTitle() {
    const screenWidth = this.cameras.main.width;

    // Create title background
    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.PASTEL_PINK, 0.7);
    titleBg.fillRoundedRect(
      screenWidth / 2 - 150,
      this.gridOffsetY - 90,
      300,
      60,
      20
    );
    titleBg.setDepth(5);

    // Add title text
    const title = this.add.text(
      screenWidth / 2,
      this.gridOffsetY - 60,
      "食物消消乐",
      FONTS.TITLE
    );
    title.setOrigin(0.5);
    title.setDepth(6);

    // Add decorative elements
    const leftStar = this.add.star(
      screenWidth / 2 - 170,
      this.gridOffsetY - 60,
      5,
      10,
      20,
      COLORS.PASTEL_YELLOW
    );
    leftStar.setDepth(6);

    const rightStar = this.add.star(
      screenWidth / 2 + 170,
      this.gridOffsetY - 60,
      5,
      10,
      20,
      COLORS.PASTEL_YELLOW
    );
    rightStar.setDepth(6);

    // Add animation to stars
    this.tweens.add({
      targets: [leftStar, rightStar],
      angle: 360,
      duration: 3000,
      repeat: -1,
    });
  }

  // NEW: Create cute score display
  createScoreDisplay() {
    const scoreX = 100;
    const scoreY = 50;

    // Create score badge background
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(COLORS.PASTEL_GREEN, 0.9);
    scoreBg.fillRoundedRect(scoreX - 80, scoreY - 25, 160, 50, 25);
    scoreBg.setDepth(5);

    // Add score text with shadow
    this.scoreText = this.add.text(scoreX, scoreY, "分数: 0", FONTS.SCORE);
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(6);
    this.scoreText.setShadow(2, 2, "rgba(0,0,0,0.2)", 2);
  }

  // NEW: Create cute moves display
  createMovesDisplay() {
    const screenWidth = this.cameras.main.width;
    const movesX = screenWidth - 100;
    const movesY = 50;

    // Create moves badge background
    const movesBg = this.add.graphics();
    movesBg.fillStyle(COLORS.PASTEL_BLUE, 0.9);
    movesBg.fillRoundedRect(movesX - 100, movesY - 25, 200, 50, 25);
    movesBg.setDepth(5);

    // Add moves text with shadow
    this.movesText = this.add.text(movesX, movesY, "剩余步数: 20", FONTS.MOVES);
    this.movesText.setOrigin(0.5);
    this.movesText.setDepth(6);
    this.movesText.setShadow(2, 2, "rgba(0,0,0,0.2)", 2);
  }

  // NEW: Create sound button with cute styling
  createSoundButton() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Create button background
    const buttonBg = this.add.circle(
      screenWidth - 50,
      screenHeight - 50,
      30,
      COLORS.PASTEL_YELLOW
    );
    buttonBg.setDepth(5);

    // Add sound icon
    const soundButton = this.add.text(
      screenWidth - 50,
      screenHeight - 50,
      this.soundEnabled ? "🔊" : "🔇",
      {
        font: "24px Arial",
        fill: "#5c3d46",
      }
    );
    soundButton.setOrigin(0.5);
    soundButton.setInteractive({ useHandCursor: true });
    soundButton.setDepth(6);

    // Add hover effect
    soundButton.on("pointerover", () => {
      buttonBg.setFillStyle(COLORS.PASTEL_PINK);
    });
    soundButton.on("pointerout", () => {
      buttonBg.setFillStyle(COLORS.PASTEL_YELLOW);
    });

    // Add click handler
    soundButton.on("pointerdown", () => {
      this.soundEnabled = !this.soundEnabled;
      soundButton.setText(this.soundEnabled ? "🔊" : "🔇");

      if (this.soundEnabled && !this.soundsLoaded) {
        this.loadSounds();
      }

      // Add cute animation when clicked
      this.tweens.add({
        targets: buttonBg,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
      });
    });
  }

  // NEW: Create mascot character
  createMascot() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Create mascot using one of the food images initially
    this.mascot = this.add.sprite(150, screenHeight - 100, "food_1");

    // IMPORTANT FIX: Set a fixed size for the mascot to avoid sizing issues
    this.mascot.setDisplaySize(80, 80); // Smaller, fixed size
    this.mascot.setDepth(10);

    // Add speech bubble with proper positioning
    this.speechBubble = this.add.graphics();
    this.speechBubble.fillStyle(COLORS.SOFT_WHITE, 0.9);
    this.speechBubble.fillRoundedRect(200, screenHeight - 140, 160, 60, 20); // Smaller bubble
    this.speechBubble.fillTriangle(
      200,
      screenHeight - 115,
      180,
      screenHeight - 100,
      200,
      screenHeight - 90
    );
    this.speechBubble.setDepth(9);

    // Add text to speech bubble with proper sizing
    this.mascotText = this.add.text(
      280, // Centered in the smaller bubble
      screenHeight - 110,
      "加油!",
      { font: "18px Arial", fill: "#5c3d46" } // Slightly smaller font
    );
    this.mascotText.setOrigin(0.5);
    this.mascotText.setDepth(10);

    // Add idle animation with smaller range to prevent overlapping
    this.tweens.add({
      targets: this.mascot,
      y: screenHeight - 110, // Smaller movement range
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Hide speech bubble initially
    this.speechBubble.setAlpha(0);
    this.mascotText.setAlpha(0);
  }

  // NEW: Create a separate method that initializes the grid without any animations
  initializeGridWithoutAnimations() {
    console.log("Initializing grid with correct sizing...");
    this.tileBackgrounds.clear();
    this.tileBackgrounds.fillStyle(COLORS.SOFT_WHITE, 1);
    this.tileBackgrounds.lineStyle(2, 0xffe0e0, 1);

    this.tileSprites.clear(true, true);
    this.grid = [];

    // Calculate proper tile size - slightly smaller to ensure images fit correctly
    const properTileSize = Math.min(
      Math.floor(this.tileSize * 1),
      this.tileSize - TILE_PADDING * 2
    );

    const imageSize = properTileSize * 0.9; // 70% of proper tile size

    for (let row = 0; row < GRID_HEIGHT; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_WIDTH; col++) {
        const tileKey = getRandomTileKey();
        const worldX = Math.floor(
          this.gridOffsetX + col * this.tileSize + this.tileSize / 2
        );
        const worldY = Math.floor(
          this.gridOffsetY + row * this.tileSize + this.tileSize / 2
        );

        // Draw tile background
        const bgX = Math.floor(this.gridOffsetX + col * this.tileSize);
        const bgY = Math.floor(this.gridOffsetY + row * this.tileSize);

        this.tileBackgrounds.fillRoundedRect(
          bgX + 4,
          bgY + 4,
          this.tileSize - 8,
          this.tileSize - 8,
          8
        );
        this.tileBackgrounds.strokeRoundedRect(
          bgX + 4,
          bgY + 4,
          this.tileSize - 8,
          this.tileSize - 8,
          8
        );

        // CRITICAL FIX: Create sprite with exact size immediately - no animations or delayed sizing
        const tileSprite = this.add.sprite(worldX, worldY, tileKey);
        tileSprite.setDisplaySize(imageSize, imageSize);
        tileSprite.setDepth(2);

        // Store data
        tileSprite.setData("gridRow", row);
        tileSprite.setData("gridCol", col);
        tileSprite.setData("tileKey", tileKey);
        tileSprite.setData("baseWidth", imageSize);
        tileSprite.setData("baseHeight", imageSize);

        // Make interactive and add to group
        tileSprite.setInteractive();
        this.tileSprites.add(tileSprite);

        // Add to grid
        this.grid[row][col] = tileSprite;

        // NO initial animations - they will display immediately at the correct size
      }
    }

    console.log("Grid initialization complete without animations");

    // Optionally show a welcome message after a short delay
    this.time.delayedCall(500, () => {
      this.showMascotMessage("开始吧!");
    });
  }

  // We can keep the old initializeGrid method for when we want to reinitialize with animations
  // like after restarting the game, but rename it to make its purpose clear
  initializeGridWithAnimations() {
    console.log("Initializing grid with animations...");
    this.tileBackgrounds.clear();
    this.tileBackgrounds.fillStyle(COLORS.SOFT_WHITE, 1);
    this.tileBackgrounds.lineStyle(2, 0xffe0e0, 1);

    this.tileSprites.clear(true, true);
    this.grid = [];

    // Calculate proper tile size
    const properTileSize = Math.min(
      Math.floor(this.tileSize * 1),
      this.tileSize - TILE_PADDING * 2
    );

    const imageSize = properTileSize * 0.9; // 70% of proper tile size

    for (let row = 0; row < GRID_HEIGHT; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_WIDTH; col++) {
        const tileKey = getRandomTileKey();
        const worldX = Math.floor(
          this.gridOffsetX + col * this.tileSize + this.tileSize / 2
        );
        const worldY = Math.floor(
          this.gridOffsetY + row * this.tileSize + this.tileSize / 2
        );

        // Draw tile background
        const bgX = Math.floor(this.gridOffsetX + col * this.tileSize);
        const bgY = Math.floor(this.gridOffsetY + row * this.tileSize);

        this.tileBackgrounds.fillRoundedRect(
          bgX + 4,
          bgY + 4,
          this.tileSize - 8,
          this.tileSize - 8,
          8
        );
        this.tileBackgrounds.strokeRoundedRect(
          bgX + 4,
          bgY + 4,
          this.tileSize - 8,
          this.tileSize - 8,
          8
        );

        // Create sprite with exact size
        const tileSprite = this.add.sprite(worldX, worldY, tileKey);
        tileSprite.setDisplaySize(imageSize, imageSize);
        tileSprite.setDepth(2);

        // Store data
        tileSprite.setData("gridRow", row);
        tileSprite.setData("gridCol", col);
        tileSprite.setData("tileKey", tileKey);
        tileSprite.setData("baseWidth", imageSize);
        tileSprite.setData("baseHeight", imageSize);

        // Make interactive and add to group
        tileSprite.setInteractive();
        this.tileSprites.add(tileSprite);

        // Add to grid
        this.grid[row][col] = tileSprite;

        // Now we can add entry animation since we've already set the correct size
        tileSprite.setScale(0);
        this.tweens.add({
          targets: tileSprite,
          scale: 1,
          duration: 500,
          delay: (row * 8 + col) * 25,
          ease: "Back.easeOut",
        });
      }
    }

    // Show mascot greeting
    this.time.delayedCall(1000, () => {
      this.showMascotMessage("开始吧!");
    });
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
            matchTiles.forEach((tile) => {
              if (!matchedTiles.includes(tile)) {
                matchedTiles.push(tile);
              }
            });

            // Record match pattern
            matchPatterns.push({
              type: "horizontal",
              length: matchLength,
              row: row,
              col: col,
              tileKey: key1,
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
            matchTiles.forEach((tile) => {
              if (!matchedTiles.includes(tile)) {
                matchedTiles.push(tile);
              }
            });

            // Record match pattern
            matchPatterns.push({
              type: "vertical",
              length: matchLength,
              row: row,
              col: col,
              tileKey: key1,
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

    // Calculate score for the matches
    const matchScore = matchedTiles.length * 10;
    this.score += matchScore;
    this.updateScoreText();

    console.log(`Found ${matchedTiles.length} matches! +${matchScore} points`);

    // Show cute mascot message for good matches
    if (matchedTiles.length >= 5) {
      this.showMascotMessage("太棒了!");
    } else if (matchedTiles.length >= 4) {
      this.showMascotMessage("真厉害!");
    }

    // --- Special match detection logic ---
    let specialTileInfo = null;

    if (this.lastMatchPatterns && this.lastMatchPatterns.length > 0) {
      for (const pattern of this.lastMatchPatterns) {
        if (pattern.length >= 4) {
          // Found a match that would create a special tile
          specialTileInfo = {
            pattern: pattern,
            row:
              pattern.type === "horizontal"
                ? pattern.row
                : pattern.row + Math.floor(pattern.length / 2),
            col:
              pattern.type === "horizontal"
                ? pattern.col + Math.floor(pattern.length / 2)
                : pattern.col,
            type:
              pattern.length >= 5
                ? "rainbow"
                : pattern.type === "horizontal"
                ? "horizontal_line"
                : "vertical_line",
          };

          // Prioritize longer matches
          if (pattern.length >= 5) {
            break; // Rainbow powerup takes precedence
          }
        }
      }
    }

    // Remove matched tiles with cute effects
    matchedTiles.forEach((tile) => {
      // Skip if this position will be used for a special tile
      if (
        specialTileInfo &&
        tile.getData("gridRow") === specialTileInfo.row &&
        tile.getData("gridCol") === specialTileInfo.col
      ) {
        return;
      }

      const row = tile.getData("gridRow");
      const col = tile.getData("gridCol");

      if (
        row !== undefined &&
        col !== undefined &&
        row >= 0 &&
        row < GRID_HEIGHT &&
        col >= 0 &&
        col < GRID_WIDTH &&
        this.grid[row] !== undefined
      ) {
        this.grid[row][col] = null;

        // Create smaller sparkle effect
        this.createSparkleEffect(tile.x, tile.y);

        // IMPORTANT FIX: Animate with smaller scale to prevent overlapping
        this.tweens.add({
          targets: tile,
          alpha: 0,
          scale: 1.2, // Reduced from 1.5 to 1.2
          angle: Phaser.Math.Between(-20, 20), // Smaller angle range
          duration: 300,
          ease: "Back.easeIn",
          onComplete: () => {
            tile.destroy();
          },
        });
      }
    });

    // Handle special tile logic
    if (specialTileInfo) {
      this.time.delayedCall(350, () => {
        const specialTile = this.createSpecialTile(specialTileInfo);

        this.time.delayedCall(500, () => {
          this.autoActivateSpecialTile(specialTile);
        });
      });
    } else {
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
    const worldX = Math.floor(
      this.gridOffsetX + col * this.tileSize + this.tileSize / 2
    );
    const worldY = Math.floor(
      this.gridOffsetY + row * this.tileSize + this.tileSize / 2
    );

    // Create the new special tile with proper sizing
    const specialTile = this.add.sprite(worldX, worldY, type);
    specialTile.setDepth(1);
    specialTile.setData("gridRow", row);
    specialTile.setData("gridCol", col);
    specialTile.setData("tileKey", pattern.tileKey);
    specialTile.setData("specialType", type);

    // IMPORTANT FIX: Properly size special tiles to be slightly smaller than regular tiles
    const properTileSize = Math.min(
      Math.floor(this.tileSize * 1),
      this.tileSize - TILE_PADDING * 2
    );
    const baseWidth = properTileSize * 0.9; // Special tiles are slightly larger
    const baseHeight = properTileSize * 0.9;

    specialTile.setDisplaySize(baseWidth, baseHeight);
    specialTile.setData("baseWidth", baseWidth);
    specialTile.setData("baseHeight", baseHeight);

    // Add visual effect for brief display
    specialTile.setTint(0xffff00); // Yellow tint

    // Make it pulse briefly
    this.tweens.add({
      targets: specialTile,
      scale: 1.2, // Reduced scale factor to prevent overlapping
      duration: 300,
      yoyo: true,
    });

    // Update grid data
    this.grid[row][col] = specialTile;

    // Play sound
    this.playSound("special");

    console.log(`Created special tile of type ${type} at [${row}, ${col}]`);

    return specialTile;
  }

  // --- NEW: Method to automatically activate special tile ---
  autoActivateSpecialTile(specialTile) {
    if (!specialTile) return;

    const specialType = specialTile.getData("specialType");
    const row = specialTile.getData("gridRow");
    const col = specialTile.getData("gridCol");

    console.log(`Auto-activating special tile type: ${specialType}`);
    this.playSound("special");

    // Determine which tiles to clear based on special type
    let tilesToClear = [];

    switch (specialType) {
      case "horizontal_line":
        // Clear entire row
        for (let c = 0; c < GRID_WIDTH; c++) {
          if (this.grid[row][c] && this.grid[row][c] !== specialTile) {
            tilesToClear.push(this.grid[row][c]);
          }
        }
        break;

      case "vertical_line":
        // Clear entire column
        for (let r = 0; r < GRID_HEIGHT; r++) {
          if (this.grid[r][col] && this.grid[r][col] !== specialTile) {
            tilesToClear.push(this.grid[r][col]);
          }
        }
        break;

      case "bomb":
        // Clear 3x3 area
        for (
          let r = Math.max(0, row - 1);
          r <= Math.min(GRID_HEIGHT - 1, row + 1);
          r++
        ) {
          for (
            let c = Math.max(0, col - 1);
            c <= Math.min(GRID_WIDTH - 1, col + 1);
            c++
          ) {
            if (this.grid[r][c] && this.grid[r][c] !== specialTile) {
              tilesToClear.push(this.grid[r][c]);
            }
          }
        }
        break;

      case "rainbow":
        // For rainbow, clear all tiles of a random type
        const types = ASSET_KEYS.filter(
          (key) => key !== specialTile.getData("tileKey")
        );
        const randomType = types[Math.floor(Math.random() * types.length)];

        for (let r = 0; r < GRID_HEIGHT; r++) {
          for (let c = 0; c < GRID_WIDTH; c++) {
            if (
              this.grid[r][c] &&
              this.grid[r][c] !== specialTile &&
              this.grid[r][c].getData("tileKey") === randomType
            ) {
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

    if (
      specialRow !== undefined &&
      specialCol !== undefined &&
      this.grid[specialRow] &&
      this.grid[specialRow][specialCol] === specialTile
    ) {
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
      },
    });
  }

  // --- NEW: Add pointer down handler ---
  onTilePointerDown(pointer, gameObject) {
    if (!this.canSelect || !this.tileSprites.contains(gameObject)) {
      return;
    }

    const clickedTile = gameObject;
    const specialType = clickedTile.getData("specialType");

    // Skip special tiles - they can't be selected
    if (specialType) {
      console.log(
        "Special tiles auto-activate and cannot be manually selected"
      );
      return;
    }

    // Select the tile
    this.deselectTile(); // Clear any previous selection
    this.selectTile(clickedTile);
  }

  // --- NEW: Add pointer up handler ---
  onPointerUp(pointer) {
    if (!this.selectedTile || !this.canSelect) {
      return;
    }

    // Get the tile under the pointer (if any)
    const targetPosition = pointer.position;
    let targetTile = null;

    // Find if we're over a tile
    this.tileSprites.getChildren().forEach((tile) => {
      if (
        Phaser.Geom.Rectangle.Contains(
          tile.getBounds(),
          targetPosition.x,
          targetPosition.y
        )
      ) {
        targetTile = tile;
      }
    });

    if (targetTile && targetTile !== this.selectedTile) {
      // Check if they're adjacent
      const selectedRow = this.selectedTile.getData("gridRow");
      const selectedCol = this.selectedTile.getData("gridCol");
      const targetRow = targetTile.getData("gridRow");
      const targetCol = targetTile.getData("gridCol");

      const dx = Math.abs(targetCol - selectedCol);
      const dy = Math.abs(targetRow - selectedRow);

      if (dx + dy === 1) {
        console.log(
          `Swapping [${selectedRow},${selectedCol}] with [${targetRow},${targetCol}]`
        );
        this.swapTiles(this.selectedTile, targetTile);
      } else {
        // Not adjacent - deselect the current tile and select the new one
        this.deselectTile();
      }
    } else {
      // Released not over a valid target - just deselect
      this.deselectTile();
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
        this.playSound("swap");
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
        this.playSound("error");
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
              const newY =
                this.gridOffsetY + row * this.tileSize + this.tileSize / 2;

              // Animate the tile moving down
              pendingTiles++;
              this.tweens.add({
                targets: tileToMove,
                y: newY,
                duration: 300,
                ease: "Bounce.easeOut",
                onComplete: () => {
                  pendingTiles--;
                  if (pendingTiles === 0) {
                    this.refillEmptySpaces();
                  }
                },
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

    // Calculate proper image size
    const properTileSize = Math.min(
      Math.floor(this.tileSize * 1),
      this.tileSize - TILE_PADDING * 2
    );
    const imageSize = properTileSize * 0.9; // 70% of proper tile size

    // Scan entire grid for null spaces and fill them
    for (let col = 0; col < GRID_WIDTH; col++) {
      for (let row = 0; row < GRID_HEIGHT; row++) {
        if (this.grid[row][col] === null) {
          // Create a new tile
          const tileKey = getRandomTileKey();

          // Calculate position (start above the grid)
          const worldX = Math.floor(
            this.gridOffsetX + col * this.tileSize + this.tileSize / 2
          );
          const startY = Math.floor(this.gridOffsetY - this.tileSize); // Start one tile height above grid
          const finalY = Math.floor(
            this.gridOffsetY + row * this.tileSize + this.tileSize / 2
          );

          // CRITICAL FIX: Create the sprite with exact size immediately
          const tileSprite = this.add.sprite(worldX, startY, tileKey);
          tileSprite.setDisplaySize(imageSize, imageSize);
          tileSprite.setDepth(2);
          tileSprite.setData("gridRow", row);
          tileSprite.setData("gridCol", col);
          tileSprite.setData("tileKey", tileKey);
          tileSprite.setData("baseWidth", imageSize);
          tileSprite.setData("baseHeight", imageSize);

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
            ease: "Bounce.easeOut",
            delay: row * 50, // Stagger the drops slightly
            onComplete: () => {
              pendingTiles--;
              if (pendingTiles === 0) {
                // After all new tiles are in place, check for new matches
                this.checkAfterRefill();
              }
            },
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
      console.log(
        `Cascade! Found ${newMatches.length} more matches after refill`
      );
      // Play sound if enabled
      this.playSound("combo");
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
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Create semi-transparent overlay with gradient
    const overlay = this.add.graphics();
    overlay.fillStyle(COLORS.PASTEL_PINK, 0.8);
    overlay.fillRect(0, 0, screenWidth, screenHeight);
    overlay.setDepth(20);

    // Create decorative frame for game over
    const frameWidth = 400;
    const frameHeight = 500;
    const frameX = screenWidth / 2 - frameWidth / 2;
    const frameY = screenHeight / 2 - frameHeight / 2;

    const frame = this.add.graphics();
    frame.fillStyle(COLORS.SOFT_WHITE, 0.9);
    frame.fillRoundedRect(frameX, frameY, frameWidth, frameHeight, 20);
    frame.lineStyle(10, COLORS.PASTEL_YELLOW, 1);
    frame.strokeRoundedRect(frameX, frameY, frameWidth, frameHeight, 20);
    frame.setDepth(21);

    // Create game over text
    const gameOverText = this.add.text(
      screenWidth / 2,
      frameY + 80,
      "游戏结束!",
      FONTS.GAME_OVER
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(22);
    gameOverText.setShadow(3, 3, "rgba(0,0,0,0.2)", 3);

    // Display final score
    const scoreText = this.add.text(
      screenWidth / 2,
      frameY + 160,
      `最终分数: ${this.score}`,
      { font: "32px Arial", fill: "#5c3d46" }
    );
    scoreText.setOrigin(0.5);
    scoreText.setDepth(22);

    // Add cute rating based on score
    let rating = "";
    let ratingColor = "";

    if (this.score < 500) {
      rating = "加油!";
      ratingColor = "#5c3d46";
    } else if (this.score < 1000) {
      rating = "不错哦!";
      ratingColor = "#ff6b81";
    } else {
      rating = "太棒了!";
      ratingColor = "#ff6b81";
    }

    const ratingText = this.add.text(screenWidth / 2, frameY + 220, rating, {
      font: "36px Arial",
      fill: ratingColor,
      fontStyle: "bold",
    });
    ratingText.setOrigin(0.5);
    ratingText.setDepth(22);

    // Add cute restart button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = screenWidth / 2 - buttonWidth / 2;
    const buttonY = frameY + 320;

    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(COLORS.PASTEL_BLUE, 1);
    buttonGraphics.fillRoundedRect(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      30
    );
    buttonGraphics.setDepth(22);

    const restartButton = this.add.text(
      screenWidth / 2,
      buttonY + 30,
      "再玩一次",
      FONTS.BUTTON
    );
    restartButton.setOrigin(0.5);
    restartButton.setDepth(23);
    restartButton.setInteractive({ useHandCursor: true });

    // Add button hover effect
    restartButton.on("pointerover", () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(COLORS.PASTEL_PINK, 1);
      buttonGraphics.fillRoundedRect(
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        30
      );
    });

    restartButton.on("pointerout", () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(COLORS.PASTEL_BLUE, 1);
      buttonGraphics.fillRoundedRect(
        buttonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        30
      );
    });

    // Add restart handler
    restartButton.on("pointerdown", () => {
      this.scene.restart();
    });

    // Add confetti effect
    this.createConfetti();

    // Update mascot
    this.showMascotMessage("下次会更好!");
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
      this.load.audio("match", "/assets/sounds/match.mp3");
      this.load.audio("combo", "/assets/sounds/combo.mp3");
      this.load.audio("swap", "/assets/sounds/swap.mp3");
      this.load.audio("error", "/assets/sounds/error.mp3");
      this.load.audio("special", "/assets/sounds/special.mp3");

      // Start the load
      this.load.once("complete", () => {
        // Successfully loaded sounds
        this.sounds = {
          match: this.sound.add("match"),
          combo: this.sound.add("combo"),
          swap: this.sound.add("swap"),
          error: this.sound.add("error"),
          special: this.sound.add("special"),
        };
        this.soundsLoaded = true;
        console.log("Sound effects loaded successfully");
      });

      this.load.once("loaderror", (fileObj) => {
        console.warn("Error loading sounds:", fileObj.src);
        this.soundEnabled = false;
        // Update button text to show sounds are disabled
        const soundButton = this.children.list.find(
          (child) =>
            child.type === "Text" &&
            (child.text === "🔊" || child.text === "🔇")
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

    // Get the base dimensions
    const baseWidth = tile.getData("baseWidth");
    const baseHeight = tile.getData("baseHeight");

    // IMPORTANT FIX: Reduce the scale factor to prevent overlapping
    this.tweens.add({
      targets: tile,
      displayWidth: baseWidth * 1.1, // Reduced from 1.2 to 1.1
      displayHeight: baseHeight * 1.1, // Reduced from 1.2 to 1.1
      duration: 200,
      ease: "Back.easeOut",
    });

    // Add a smaller float effect
    this.tweens.add({
      targets: tile,
      y: tile.y - 3, // Reduced from -5 to -3
      duration: 200,
      ease: "Sine.easeOut",
    });

    console.log(
      `Selected tile at [${tile.getData("gridRow")}, ${tile.getData(
        "gridCol"
      )}]`
    );
  }

  // --- MISSING: Deselect Tile ---
  deselectTile() {
    if (!this.selectedTile) return;

    // Get the base dimensions
    const baseWidth = this.selectedTile.getData("baseWidth");
    const baseHeight = this.selectedTile.getData("baseHeight");
    const originalY =
      this.gridOffsetY +
      this.selectedTile.getData("gridRow") * this.tileSize +
      this.tileSize / 2;

    // Return to original size and position
    this.tweens.add({
      targets: this.selectedTile,
      displayWidth: baseWidth,
      displayHeight: baseHeight,
      y: originalY,
      duration: 200,
      ease: "Sine.easeOut",
    });

    console.log(
      `Deselected tile at [${this.selectedTile.getData(
        "gridRow"
      )}, ${this.selectedTile.getData("gridCol")}]`
    );
    this.selectedTile = null;
  }

  // NEW: Create confetti effect
  createConfetti() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    const confettiColors = [
      COLORS.PASTEL_PINK,
      COLORS.PASTEL_BLUE,
      COLORS.PASTEL_YELLOW,
      COLORS.PASTEL_GREEN,
      COLORS.PASTEL_PURPLE,
    ];

    // Create 50 confetti particles
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, screenWidth);
      const y = -20;
      const size = Phaser.Math.Between(5, 15);
      const color =
        confettiColors[Phaser.Math.Between(0, confettiColors.length - 1)];

      const confetti = this.add.rectangle(x, y, size, size, color);
      confetti.setDepth(25);
      confetti.angle = Phaser.Math.Between(0, 360);

      this.tweens.add({
        targets: confetti,
        y: screenHeight + 50,
        x: x + Phaser.Math.Between(-200, 200),
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1000),
      });
    }
  }

  // NEW: Show message from mascot
  showMascotMessage(message) {
    // Set the message text
    this.mascotText.setText(message);

    // Show speech bubble
    this.tweens.add({
      targets: [this.speechBubble, this.mascotText],
      alpha: 1,
      duration: 300,
    });

    // Animate mascot
    this.tweens.add({
      targets: this.mascot,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });

    // Hide message after a delay
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [this.speechBubble, this.mascotText],
        alpha: 0,
        duration: 300,
      });
    });
  }

  // NEW: Create sparkle effect
  createSparkleEffect(x, y) {
    const sparkleColors = [0xffffff, 0xffff00, 0xff9999];

    for (let i = 0; i < 5; i++) {
      const sparkle = this.add.star(
        x,
        y,
        5,
        2, // Smaller inner radius
        5, // Smaller outer radius
        sparkleColors[Phaser.Math.Between(0, sparkleColors.length - 1)]
      );
      sparkle.setDepth(3);

      // Animate the sparkle with smaller range
      this.tweens.add({
        targets: sparkle,
        scale: 0,
        alpha: 0,
        angle: 90,
        x: x + Phaser.Math.Between(-15, 15), // Smaller range
        y: y + Phaser.Math.Between(-15, 15), // Smaller range
        duration: 400,
        onComplete: () => sparkle.destroy(),
      });
    }
  }
}
