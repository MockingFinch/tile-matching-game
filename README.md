This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Game Design Document: Food Sticker Fiesta (消消乐)

This document details the design for a highly engaging tile-matching game ("消消乐") using the food stickers, aiming for deep player satisfaction and retention.

### Current Implementation Status

We've built a fully playable match-3 game using Phaser 3 with the following features:

**✅ Implemented Features:**
- 8x8 grid of delicious food sticker tiles with white background
- Intuitive click-select and swap mechanics
- Match-3 detection for both horizontal and vertical matches
- Score system with display in Chinese (分数)
- Moves counter with Chinese display (剩余步数)
- Satisfying animations for tile selection, swapping, and clearing
- Gravity effect with tiles falling to fill empty spaces
- Automatic cascading matches with chain reactions
- Game over screen in Chinese with final score and restart button
- Special tiles created from matches of 4+ in a row
- Auto-activation of special tiles for exciting chain reactions:
  - Horizontal Line Clear: Wipes out the entire row
  - Vertical Line Clear: Wipes out the entire column
  - Rainbow Tile: Clears all tiles of a random type on the board

**⏳ Planned Future Features:**
- Level-based progression with varying objectives
- Time-limited gameplay mode (急速模式)
- Level map for progression tracking
- Star rating system (1-3 stars) based on performance
- Daily rewards and login bonuses
- Power-ups and boosters (强化道具)
- Social features like leaderboards (好友排行)
- More special tile variations like Bomb tiles (3x3 area clear)
- Advanced tile types and obstacles

### Original Design Document

**1. The Core Experience & The Lens of Essential Experience:**

- **What is the essential experience?** Satisfyingly clearing waves of cute food tiles through clever swaps, triggering explosive chain reactions, overcoming escalating challenges, and feeling a sense of accomplishment and progression.
- **Theme:** A vibrant, playful culinary world bursting with delicious-looking food stickers.
- **Target Audience:** Casual to mid-core puzzle players seeking both relaxing moments and stimulating challenges.
- **Platform Assumption:** Mobile-first design (touch controls), using Phaser as our game engine for rich effects and web-based play.

**2. Core Mechanics & The Lens of Mechanism:**

- **Grid & Tiles:** An 8x8 grid filled with various food sticker tiles. 6 distinct tile types visible at once to balance challenge and opportunity.
- **Swapping:** Intuitive select-and-swap adjacent tiles (horizontal/vertical). Only valid swaps (ones that create a match) are allowed, providing instant feedback.
- **Matching:** Match 3+ identical tiles in a line.
  - **Match 3:** Standard clear.
  - **Match 4 (Line):** Creates a Line Clear tile that automatically clears its entire row or column based on the match orientation.
  - **Match 5 (Line):** Creates a Rainbow tile that automatically clears all tiles of a randomly selected type.
- **Clearing & Cascades:**
  - Matched tiles clear with satisfying animations.
  - Tiles above fall down to fill empty spaces.
  - Cascades trigger automatically when new matches form after tiles fall.
- **Moves:** The game currently uses a move-limited approach (经典模式 - Classic Mode) with 20 moves per game.

**3. Game Flow & The Core Loop:**

1. **Observe & Strategize:** Player scans the board for potential matches.
2. **Execute Swap:** Player selects and swaps two adjacent tiles.
3. **Resolution & Feedback:**
   - If match occurs: Tiles clear, score increases, special tiles might form, new tiles fall.
   - Cascade Check: Game automatically resolves cascades, increasing score further.
   - Move Counter Decrements: Remaining moves are updated.
4. **Goal Check:**
   - No moves remaining? -> Game Over (游戏结束) with score display and restart option.
   - Moves remaining? -> Return to Observe & Strategize.

**4. Aesthetics & Juice:**

- **Visuals:** High-quality food stickers with transparent backgrounds against white tile backgrounds.
- **Animations:** Smooth animations for selection, swapping, clearing, and falling.
- **Interface:** Clean, intuitive, and entirely in Chinese. Score (分数), Moves (剩余步数).

**5. Technology Implementation:**

- **Game Engine:** Using Phaser 3 for 2D rendering, animations, and game logic.
- **Framework:** Next.js for the web application structure.
- **Sound System:** Optional sound effects with toggle button (currently placeholder).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
