# Benji's Yoshi Adventure - Development Plan

Based on research of **Yoshi's Crafted World** and the classic **Yoshi's Island** gameplay mechanics.

---

## Core Yoshi Mechanics

### Movement & Actions
- [x] Basic left/right movement
- [x] Basic jump
- [x] Flutter jump (hold jump in air for extended hover with slower fall)
- [x] **Ground pound** (press down while in air to slam down, can break objects/stun enemies)
- [x] Tongue attack to eat enemies
- [x] Swallow enemies to create eggs
- [x] **Egg aiming system** (hold button to show aiming reticle that moves up/down, release to throw)
- [x] Basic egg throwing
- [x] **Eggs bounce off walls/surfaces** (realistic physics)
- [x] **Up to 6 eggs can trail behind Yoshi** (visual egg trail)

### Advanced Mechanics (Crafted World Style)
- [ ] **Throw eggs into foreground/background** (3D depth - hit things in front or behind)
- [ ] **Ducking/crouching**
- [ ] **Push/pull objects**

---

## Health & Damage System

### Current System
- [x] Hearts-based health (3 hearts)
- [x] Invincibility frames after damage
- [x] Fall death (pit)

### Improvements Needed
- [ ] **Star timer system** (like original Yoshi's Island - when hit, Baby Mario floats in bubble with countdown timer instead of losing hearts)
- [ ] **Collect stars to refill timer** (small stars scattered in level)
- [ ] **If timer reaches zero, lose a life**
- [ ] **Max timer of 30 stars/seconds**
- [ ] Or keep hearts but add **heart pickups** in levels

---

## Collectibles (Crafted World Style)

### Current
- [x] Gems (generic collectibles)

### Full Collectible System
- [ ] **Red Coins** (20 per level, disguised as regular coins)
- [ ] **Smiley Flowers** (5-7 hidden per level, main collectible)
- [ ] **Regular Coins** (for points/extra lives)
- [ ] **Hearts** (health refill pickups)
- [ ] **Egg refill pickups** (when low on eggs)
- [ ] **Poochy Pups** (3 per level on "flip side" - bonus objective)
- [ ] **Souvenirs/Crafts** (hidden background items to find and hit with eggs)

---

## Enemies

### Current
- [x] Shy Guys (basic patrol enemy)

### Additional Enemies Needed
- [ ] **Piranha Plants** (stationary, bite when close)
- [ ] **Koopa Troopas** (shell can be kicked/swallowed)
- [ ] **Fly Guys** (flying Shy Guys carrying items)
- [ ] **Boos** (chase when back turned, stop when facing them)
- [ ] **Nipper Plants** (small hopping plants)
- [ ] **Bullet Bills** (shot from cannons)
- [ ] **Monty Moles** (pop out of ground)

### Enemy Behaviors
- [ ] Enemies can be eaten and turned into eggs
- [ ] Some enemies take multiple hits
- [ ] Stomping behavior varies by enemy type

---

## Level Design Elements

### Platforms & Terrain
- [x] Ground platforms (cardboard style)
- [x] Floating platforms
- [x] **Moving platforms** (horizontal, vertical, circular paths)
- [ ] **Falling platforms** (collapse after standing on them)
- [ ] **Bouncy platforms** (springs/trampolines)
- [ ] **One-way platforms** (can jump through from below)
- [x] **Breakable blocks** (ground pound or egg to destroy)

### Interactive Objects
- [x] **? Clouds** (hit with egg to reveal items)
- [ ] **Winged clouds** (special clouds with power-ups)
- [ ] **Crates/boxes** (push, destroy for items)
- [ ] **Pipes** (enter to go to bonus areas)
- [x] **Checkpoints** (middle-level save points)
- [ ] **Goal ring** (end of level - spin for bonus)
- [ ] **Doors** (foreground/background transitions)

### Hazards
- [x] Pits (fall death)
- [ ] **Spikes** (instant damage)
- [ ] **Lava** (instant death)
- [ ] **Water** (Yoshi can't swim well in Crafted World)
- [ ] **Thorns**

---

## Visual Style (Crafted World Aesthetic)

### Current
- [x] Cardboard/paper platform textures
- [x] Paper clouds
- [x] Crafted decorations (flowers, trees, bushes, mushrooms)
- [x] Colorful gems

### Improvements
- [ ] **Depth layers** (foreground objects in front of Yoshi, background behind)
- [ ] **Tape/glue visible on crafts** (holding things together)
- [ ] **Corrugated cardboard texture** more prominent
- [ ] **Paper cutout enemies** (folded paper look)
- [ ] **Yarn/string elements**
- [ ] **Buttons and fabric accents**
- [ ] **Googly eyes** on some objects
- [ ] **Parallax scrolling** (multiple background layers move at different speeds)
- [ ] **Lighting/shadow effects** (soft shadows under objects)

---

## UI Improvements

### Current
- [x] Hearts display
- [x] Gem counter
- [x] Egg counter with visual dots

### Needed
- [ ] **Coin counter**
- [ ] **Red coin counter** (X/20)
- [ ] **Smiley flower counter** (X/5)
- [ ] **Star timer** (if using that system)
- [ ] **Level name display**
- [ ] **Pause menu**
- [ ] **Level select/world map**

---

## Audio (Future Enhancement)
- [ ] Jump sound
- [ ] Flutter sound
- [ ] Egg throw sound
- [ ] Egg hit sound
- [ ] Coin collect sound
- [ ] Enemy defeat sound
- [ ] Damage sound
- [ ] Background music

---

## Game Structure

### Current
- [x] Single level
- [x] Start screen
- [x] Game over screen
- [x] Win screen (all gems collected)

### Full Game Structure
- [x] **World map** (different themed worlds)
- [x] **Multiple levels per world**
- [x] **Level completion tracking**
- [ ] **Collectible completion percentage**
- [x] **Boss battles** (at end of each world)
- [ ] **Costumes/skins for Yoshi** (unlockable)

---

## Priority Implementation Order

### Phase 1: Core Mechanics ✅ COMPLETE
1. [x] Improve egg aiming system (hold to aim, show trajectory)
2. [x] Add ground pound
3. [x] Add egg bouncing physics
4. [x] Visual egg trail behind Yoshi (up to 6)

### Phase 2: Level Interactivity ✅ COMPLETE
5. [x] Add ? clouds (hit with egg for items)
6. [x] Add breakable blocks
7. [x] Add moving platforms
8. [x] Add checkpoint system

### Phase 3: Collectibles ✅ COMPLETE
9. [x] Add coins (regular + red coins)
10. [x] Add Smiley Flowers
11. [x] Add heart pickups

### Phase 4: More Enemies ✅ COMPLETE
12. [x] Add Piranha Plants
13. [x] Add Fly Guys
14. [x] Add Koopa Troopas

### Phase 5: Polish & Depth ✅ COMPLETE
15. [x] Add foreground/background depth
16. [x] Improve visual crafted style
17. [x] Add parallax scrolling
18. [x] Add more level variety

### Phase 6: Game Structure ✅ COMPLETE
19. [x] Add level select/world map
20. [x] Add multiple levels (4 themed levels)
21. [x] Add boss battle (Baby Bowser)

---

## Current Session Progress

**Last Updated:** December 24, 2025

**Status:** 🎉 ALL 6 PHASES COMPLETE! 🎉

**Completed This Session:**
- Initial game created with basic Yoshi mechanics
- Basic platforming, jumping, flutter, tongue, egg throwing
- Shy Guy enemies
- Gem collectibles
- Crafted visual style (basic)
- ✅ Egg aiming system with oscillating reticle and trajectory preview
- ✅ Ground pound (press Down in air, impact particles)
- ✅ Egg bouncing off platforms (up to 3 bounces)
- ✅ Visual egg trail behind Yoshi
- ✅ ? Clouds (hit with egg to spawn coins, eggs, or hearts)
- ✅ Breakable blocks (ground pound or egg to destroy with cardboard explosion)
- ✅ Moving platforms (horizontal and vertical movement, Yoshi rides along)
- ✅ Checkpoint system (flag turns green, saves respawn position)
- ✅ Regular coins (38 spinning gold coins throughout level)
- ✅ Red coins (20 special coins that glow red when nearby, reveal "R" symbol)
- ✅ Smiley Flowers (5 hidden main collectibles with sparkle effects - new win condition!)
- ✅ Heart pickups (4 floating hearts to restore health)
- ✅ Updated UI with coin counter, red coin counter (X/20), flower counter (X/5)
- ✅ Piranha Plants (5 plants that snap/bite when Yoshi gets close, defeatable with eggs)
- ✅ Fly Guys (6 flying enemies with propellers, carry coins/red coins/eggs, patrol vertically)
- ✅ Koopa Troopas (6 walking turtles, stomp once to shell, stomp again or kick shell!)
- ✅ Kicked shells bounce off walls and defeat other enemies
- ✅ Multi-layer parallax backgrounds (distant mountains, mid-hills with stitching)
- ✅ Background objects (houses, windmills, trees, clouds) with depth parallax
- ✅ Foreground objects (grass, flowers, rocks, bushes) that pass in front of Yoshi
- ✅ Enhanced platform textures (corrugated cardboard, tape strips, stitched grass)
- ✅ Googly eyes on trees and mushrooms that follow Yoshi
- ✅ Felt texture decorations with stitching details
- ✅ Warm peachy sky gradient with paper texture overlay
- ✅ Level Select screen with World Map interface
- ✅ 4 Themed Levels: Green Meadows, Sandy Dunes, Frosty Peaks, Boss Castle
- ✅ Level progression system (complete levels to unlock next)
- ✅ Different sky gradients and platform colors per theme
- ✅ Baby Bowser boss battle with fireballs, jumping, and 5 HP
- ✅ Boss health bar display
- ✅ Victory screen after defeating the boss

**GAME COMPLETE!** 🦖🌸

---

## Notes
- Keep file size manageable - single HTML file constraint
- Test frequently in browser
- Prioritize gameplay feel over visual polish initially
