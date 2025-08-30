FORWARD — RULES v1.4 8.20.2025

INTRODUCTION — THE BRIDGE YOU BURN
The world has thinned to nine haunted places. Your father—the Mirror Knight—challenged the Dragon of Chaos and failed. His echo lingers as a Hollow, your name a shard in his helm. The Princess waits to lift the shield; the Sage keeps a bell for one last crossing; the Ancient Sword is somewhere in the maze of cold stars. Each step forward burns the path behind, and whatever you refuse to face sinks into the Nightsea and returns as strength for the Dragon. Go forward. Take only what you need. Leave as little as you dare.

OBJECTIVE
- Defeat the Dragon of Chaos after completing the 9th location.
- You lose if your HP reaches 0.

──────────────────────────────────────────────────────────────────────────────
1) COMPONENTS
- Forward deck (100 cards), containing:
  • Player
  • Dragon of Chaos
  • SPARE CARDS (not currently used, set aside)
  • 9 Location cards (each has a unique 3×3 layout + a marked Start slot)
  • 81 location-associated cards (9 per location):
    - Scene, Item, Equipment, Hollow, Beast, Snare, Pit, Terror, Blessing
- 2 six-sided dice (d6)
- **Board helper cards:**  
  • **BURIED** (place buried cards face-down on top of this card)  
  • **EXPERIENCE** (place XP cards face-up on top; each card = **1 XP**)  
  • **COMBAT Reference** (round sequence and results at a glance)

──────────────────────────────────────────────────────────────────────────────
2) SETUP — BOARD & STACKS (Diamond Path)
1. Remove and set aside:
   - **Player** (place in front of you)
   - **Dragon of Chaos**
   - **BURIED**, **EXPERIENCE**, and **COMBAT Reference** helper cards
2. Arrange the 9 Location cards **FACE UP** in a diamond:

        [9]
      [7] [8]
    [4] [5] [6]
      [2] [3]
        [1]

3. For EACH Location, gather its 9 associated cards, shuffle them, and place them
   **FACE DOWN** as a stack **under** that Location card (now **9 stacks of 10**).
4. Starting stats: HP = 20, Max HP = 20, XP = 0. Inventory limits: Items 0/2, Equipment 0/2.
5. Place the **Dragon of Chaos** nearby. Put the **BURIED** card beside the Dragon; this is where
   all buried cards will go **face-down on top** during play.
6. Place the **EXPERIENCE** card near you; during play, put XP cards **face-up on top** of it.
7. Place the **COMBAT Reference** card within reach.

──────────────────────────────────────────────────────────────────────────────
3) PLAYING THE GAME — LOCATION FLOW

A) Choosing and entering locations (Diamond Path)
- You **must start at Location 1**.
- After you finish a location, you may move to any **adjacent or diagonal** location
  in the diamond that you have not yet completed (no revisits).
- Adjacency map (valid next choices):
  • 1 → {2, 3}
  • 2 → {3, 4, 5}
  • 3 → {2, 5, 6}
  • 4 → {2, 5, 7}
  • 5 → {2, 3, 4, 6, 7, 8}
  • 6 → {3, 5, 8}
  • 7 → {4, 5, 9}
  • 8 → {5, 6, 9}
  • 9 → (none; after clearing all 9, proceed to the Dragon)

B) Setting up a location run (per location)
1. Take that Location’s 9 associated cards and **lay out all 9 face-down** exactly as
   shown in that Location’s layout diagram (Sec. 9). **Rows/columns never slide or collapse.**
2. **Start:** Place your **Player card** on the **Start** slot indicated on the Location card.

C) Movement & Map Flow (Orthogonal, Burn-the-Bridge)
- **Your map turn** (choose **one**):
  1) **Step:** Move your Player **one slot orthogonally** (↑↓←→; **no diagonals**).
     - Destination **face-down** → **flip** and **immediately resolve** its text.
     - Destination **face-up ongoing** → follow its text; enter only if not **Blocked/Impassable**.
     - Destination **Void** → you **cannot** enter it.
  2) **Stay & use:** If the card you’re on has an action like “use while here,” stay and use it.

- **Tile States (card-only handling)**
  • **Face-down (Unknown):** Flip on entry.  
  • **Face-up (Ongoing):** Remains on its slot; traversable only if allowed.  
  • **Claimed/Removed → Void:** If a result says **gain/claim/take/discard this card**, **remove it now**
    (to Inventory/**EXPERIENCE**/**BURIED**, etc.). While you are on that now-empty slot you remain there;  
    **when you step off, the slot becomes Void** (a hole). Void is never traversable and never counts for adjacency.  
  • **Blocked/Impassable:** You cannot enter that slot. (If a reveal makes the slot Blocked under you,
    finish resolving; on your next map turn you must move to a legal orthogonal neighbor or as instructed.)

- **Getting stuck (forced exit)**  
  If at the start of your turn you have **no legal orthogonal move** (all neighbors are **Void** or **Blocked**),
  you **immediately leave** the location (this counts as leaving early).

D) Clearing & Leaving a location
- **Clearing (farthest-tile objective):**
  • **Orthogonal distance** = number of ↑↓←→ steps between two slots.  
  • The **Farthest Tile(s)** are the slot(s) with the **maximum** orthogonal distance from **Start** (ties allowed).  
  • **To clear this location**, enter **any one** of the Farthest Tile(s) at least once.
- **Leaving a location** (early, forced, or by choice):
  1) **Bury** all **unrevealed** (still face-down) cards from the map **face-down on top of the BURIED card** (see Global Burying).
  2) Inventory and EXPERIENCE are already handled (you removed those cards when resolved).
  3) Pick up your **Player card**; clean up any remaining face-up ongoing cards per their text.

**Teach box (quick):**  
Step = move 1 **orthogonal** slot → flip on entry if face-down → removing a card creates **Void** **after** you step away  
→ **Void is never traversable** → clear by entering a **farthest** slot → **bury unrevealed** on the **BURIED** card.

— GLOBAL BURYING (always face-down) —
- The game uses a single **BURIED** helper card.  
- **Any time** a rule instructs you to **bury** a card—from the **map**, your **hand/inventory**, a **deck**, or a **discard**—place it **face-down on top of the BURIED card**.  
- If a card to be buried is currently face-up, **flip it face-down before burying**.  
- **Do not look at or reorder** cards on the BURIED stack.  
- Unless a card says otherwise, **each card on the BURIED stack increases the Dragon’s HP by +1**.

──────────────────────────────────────────────────────────────────────────────
4) CARD TYPES & RESOLUTION

MONSTERS (Hollows & Beasts)
- **“Fight: X HP” = the enemy’s total HP.** Track damage across rounds; when cumulative
  damage you’ve dealt ≥ X, the enemy is defeated (then follow on-victory text, usually to **EXPERIENCE**).
- **How enemies deal damage (default).** Enemies have **no fixed ATK**. Unless a card says otherwise,
  an enemy only deals damage via its **combat die result** each round (per the Duel System table:
  Miss/Parry = 0, Hit = 1, Crit = 2, Counter = 1), modified by effects in play.
- **Enemy stats.** Enemies normally have **no DEF** and no ATK unless granted by a card.
- **Persistence.** Damage to enemies **persists across rounds** unless healed/reset by an effect.
- Fight using the **Duel System** (Sec. 5). On victory, put the defeated monster on **EXPERIENCE** (face-up).

EQUIPMENT
- Max **2** equipped. **Auto-equip** or “**must take**” overrides choice (see Items below).
- Equipping beyond the limit: **immediately** choose one to unequip; unequipped equipment goes to **EXPERIENCE** (face-up).
- Equipment is **ongoing** unless stated otherwise. If an equipped card **leaves the map**, the slot follows **Claimed/Removed → Void** when you step off it.

ITEMS
- **On Reveal (your choice to take):** When you **enter** and **reveal** an **Item** or **Equipment**, you may
  **take it or leave it**. Resolve any “on reveal” text first, **then decide**.
  • If you **leave it**: it stays **face-up** on its slot as an **unclaimed item**. The slot remains **traversable**
    (unless the card says otherwise). You may try to take it later this run.  
  • If you **take it**: put it in **Inventory** (or immediately **equip**, if applicable). Because you **removed**
    the card from the map, that slot becomes **Void after you step off** it.
- **Limits & Overflow:** If taking a card would exceed your **Item** and/or **Equipment** limits, you must
  **immediately** choose and **discard down to the limit**. **All excess** you discard this way go to **EXPERIENCE** (face-up).  
  You cannot “hold over limit” even temporarily.
- One-time use, then to **EXPERIENCE** (see Mirror Shard exception in Sec. 6 & 11).

TERRORS
- On reveal choose ONE:
  (A) Take the listed HP loss and gain XP (card to **EXPERIENCE**, face-up), OR
  (B) **Bury** it (no XP; put **face-down** on **BURIED**).

PITS (TRAPS)
- Roll d6 against the card’s target number.
- Fail: take listed HP loss. Succeed: no HP loss.
- Either way, the Pit card goes to **EXPERIENCE** (face-up).

SNARES
- Ongoing penalty until cleansed by a Blessing/effect that says “cleanse.”
- When cleansed, the snare card goes to **EXPERIENCE** (face-up).

BLESSINGS
- Positive effect that lasts until you leave the current location (unless stated).
- If it says “cleanse snare,” remove your current snare(s) as specified; cleansed
  snare cards go to **EXPERIENCE** (face-up).

SCENES
- Resolve their effect (often healing) and put the Scene into **EXPERIENCE** (face-up).

COMPANIONS (Princess / Sage / Mirror Knight)
- On reveal (Princess/Sage) or on special resolution (Mirror Knight), place the
  Companion next to the Player (they **leave the map**). The space is cleared (→ **Void after you step off**).
- Companions can be **activated** by key items or effects; their Dragon effects are in Sec. 8 & 11.

──────────────────────────────────────────────────────────────────────────────
5) COMBAT — DUEL SYSTEM (simultaneous rounds)
Use the **COMBAT Reference** card for a quick summary of this sequence and the die results.

**Enemy HP & damage in this system (summary):**  
A monster’s HP is its printed **“Fight: X HP.”** Each round, the enemy’s **only** source of
damage is its die result (plus any printed/effect modifiers). Apply your **DEF** to reduce
incoming damage (min 0). Defeat an enemy when your cumulative dealt damage reaches its HP.

ROUND SEQUENCE
1) Both sides roll 1d6.
2) Translate each roll to a base result:
   - 1 = Miss            (deal 0 this round)
   - 2 = Parry           (block all damage you would take this round)
   - 3 = Hit             (1 base damage)
   - 4 = Hit             (1 base damage)
   - 5 = Critical        (2 base damage)
   - 6 = Counter         (block all incoming damage AND deal 1 damage;
                          if both roll 6, both block and neither deals the counter damage)
3) Add Player stats to damage dealt:
   - When YOU deal damage (Hit/Crit/Counter), add +ATK to your damage.
4) Compute both sides’ total damage for the round (including effects like
   Moonleaf Brandy’s +1 this combat and snare/blessing modifiers).
5) Apply defense to incoming damage:
   - Reduce damage YOU take by your DEF (min 0).
   - Enemies normally have no DEF unless stated.
6) Apply HP loss. If either side reaches 0 HP, the fight ends.

COMMON EFFECT CALL-OUTS
- “Miss first attack(s)” snares: your first 1 or 2 combat rolls are treated as 1 (Miss)
  and still count as “you rolled a 1” for effects.
- Brume snare (first attack against you deals double damage): the first damaging hit
  you take after this applies is ×2, then reduce by DEF.
- Frozen Gaol blessing (“normal hit on 1”): your 1 counts as a normal Hit (1 base damage).
- Mirrored Shield (“block on 1–2”): when you would take damage, roll 1d6; on 1–2,
  set that single instance of incoming damage to 0 (after DEF).

──────────────────────────────────────────────────────────────────────────────
6) INVENTORY, LIMITS & TIMING
- Limits: **Item 2**, **Equipment 2**. On pickup beyond a limit, **immediately** trim to limits; all chosen
  excess go to **EXPERIENCE** (face-up; each counts as **1 XP**).
- **On Reveal choice to take/leave** applies to Items & Equipment (see Sec. 4).
- **Slot becomes Void after you step off** any slot from which the card was **removed** (claimed/used/defeated/etc.).
- Using items (unless timing is specified):
  • You may use an item at any time.
  • **Phoenix Tear:** when you would hit 0 HP, instead heal 10; then to **EXPERIENCE**.
  • **Moonleaf Brandy:** at start of a fight, lose 4 HP; your hits/counters deal +1 damage this combat.
  • **Mirror Shard (special):** also can be **used immediately when the Mirror Knight is revealed in Sicorro Wastes
    (before any combat rolls)** to recruit it as a Companion (card leaves the map; slot clears; Mirror Shard to **EXPERIENCE**).
- Giving items to Companions:
  • **Princess/Sage:** you must own the item (equipped or carried); giving it removes it
    from your slots and **activates** the Companion (see Sec. 11).
  • **Mirror Knight:** recruited only by **using Mirror Shard at reveal** (not by later “give”).

──────────────────────────────────────────────────────────────────────────────
7) EXPERIENCE — REROLL CURRENCY (revised)
- **EXPERIENCE pile:** Place XP cards **face-up on the EXPERIENCE card**.  
  **Each card on the EXPERIENCE card equals 1 XP.** You may count the stack at any time.
- **Gaining XP** (place the card on **EXPERIENCE**, face-up):
  • Defeated monsters
  • Resolved dangers (Pits; Terrors only if you choose the HP loss; Snares when cleansed)
  • Used items
  • Unequipped equipment (when swapped out)
  • Completed Location cards
  • Scenes (when resolved)
  • **Overflow trimming** when exceeding Item/Equipment limits (chosen excess → EXPERIENCE)
- **Spending XP — Rerolls:**
  • **Cost:** Spend **3 XP** (remove any 3 cards from the EXPERIENCE stack to a personal discard/box) to reroll **one** d6 (yours or the enemy’s) you **just rolled**.  
  • **Lock-in:** You **must keep** the new result. You **cannot** reroll the same die again **this round**.  
  • **Timing:** After seeing that die’s result, **before** applying its effects.  
  • **Limit (table option, recommended):** At most **1 reroll per round total**.

──────────────────────────────────────────────────────────────────────────────
8) ENDGAME — DRAGON OF CHAOS
- After finishing the **9th location**, fight the Dragon using the Duel System.
- **Dragon HP = 60 + 1 for each card on the BURIED stack**:
  • All unrevealed cards left behind when you left a location.
  • Every card you chose to **Bury** (e.g., Terrors you did not face).
- **Quest gate (essential):**
  • **Invulnerability shield:** Only the **activated Ghostly Princess** can remove it on arrival.
  • **Ancient Sword:** This is the only way you can deal damage to the Dragon. If you do not
    have it equipped, your attacks deal 0.
  • **Activated Sage:** on arrival, he sacrifices to **halve the Dragon’s current HP** (round up).
  • **Mirror Knight (Companion):** while fighting the Dragon, **double all damage you deal**
    (apply after ATK and other modifiers; Ancient Sword/Shield rules still apply).
- Win if you reduce the Dragon to 0 HP; lose if your HP reaches 0.

──────────────────────────────────────────────────────────────────────────────
9) LOCATION REFERENCE (layouts only)

1. HOME VILLAGE TERMINA
Layout:
  [1][2][3]
     [4]
  [5][6][7]
     [8]
     [9]

2. SHRINE OF WORSHIP
Layout:
     [1]
  [2][3][4]
     [5]
  [6][7][8]
     [9]

3. BANNERED CITY VALTHRIA
Layout:
  [1][2][3][4]
        [5]
  [6][7][8][9]

4. THE CAELITH SPIREMAZE
Layout:
  [1]   [2]
  [3]   [4]
  [5]   [6]
  [7]   [8]
  [9]

5. SICORRO WASTES
Layout:
  [1][2][3]
  [4][5][6]
  [7][8][9]
Notes:
- **Humanoid (Hollow) = Mirror Knight** (special encounter; see Sec. 11).

6. DARKWOOD BRUME
Layout:
  [1][2]
  [3]   [4]
    [5]
  [6]   [7]
    [8][9]

7. AMARA ROT GLADE
Layout:
     [1]
  [2]   [3]
     [4][5]
  [6]   [7]
     [8]
     [9]

8. FROZEN GAOL
Layout:
  [1][2]
  [3][4][5]
     [6][7]
        [8][9]

9. THE NIGHTSEA EXPANSE
Layout:
  [1]   [2]
     [3]
  [4][5][6]
     [7]
  [8]   [9]

──────────────────────────────────────────────────────────────────────────────
10) GLOSSARY
- **Map turn:** Choose one: step 1 orthogonal slot (flip on entry if face-down) or stay & use.
- **Reveal:** Turn a card face-up. **Resolve:** Carry out its effects immediately.
- **Bury:** Place the card **face-down on the BURIED card**; it adds +1 Dragon HP at endgame.
- **EXPERIENCE:** Place eligible cards **face-up on the EXPERIENCE card**; each card = **1 XP**.
- **Void:** An empty slot created **after** stepping off a removed/claimed card; never traversable; never counts for adjacency.
- **Fight: X HP:** The printed health of a monster. Deal total damage ≥ X to defeat it.
- **Monster Damage (default):** Enemy damage comes only from its combat die result that round, unless a card states additional values/modifiers.
- **Humanoid:** All Hollows are Humanoid (e.g., Blacksap Thorn can instantly defeat them).

──────────────────────────────────────────────────────────────────────────────
11) HIDDEN RULES (SPOILERS)
- **The Caelith Spiremaze**: the Humanoid slot is the **Ghostly Princess (Companion)**.
  She does nothing until given the **Gilded Bangle**; when activated, she will remove
  the Dragon’s invulnerability shield on arrival (sacrifices on arrival).
- **Darkwood Brume**: the Humanoid slot is the **Sage (Companion)**.
  He does nothing until given the **Ferryman’s Bell**; when activated, he will halve
  the Dragon’s current HP on arrival (sacrifices on arrival).
- **Sicorro Wastes — Mirror Knight (special Hollow)**:
  • On reveal, the Mirror Knight “copies everything you do.” It is **unbeatable by combat**.
  • You must either:
      – **Use the Mirror Shard** immediately (before any combat rolls) to recruit it as a
        **Companion** that follows you (card leaves the map; the space is cleared; Mirror Shard to **EXPERIENCE**), or
      – **Bury** the Mirror Knight (no XP; put **face-down on BURIED**). You cannot fight or defeat it.
  • As a Companion, the Mirror Knight has no effect until the Dragon fight, where it
    **doubles all damage you deal** to the Dragon (apply after ATK and other modifiers).

