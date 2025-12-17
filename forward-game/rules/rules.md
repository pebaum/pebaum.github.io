# Forward - rules (clean draft)

## Concept
Forward is a solo or two-player (with a Guide) roguelike card adventure. You travel through nine Domains arranged in a rough diamond path, collecting items, surviving hazards, and finally confronting a Guardian at the end of the Nightsea Expanse. Cards drive everything: exploration, combat, equipment, status effects, and story beats.

## Components
- 200 cards total:
  - 9 Domain title cards
  - 162 Station cards (18 per Domain)
  - Player card
  - Guardian card (final battle)
  - Resolve and Dread track (two-card slider)
  - Grace track (0-3)
  - Health track (start at 20)
  - Status tracker
  - Turn/Combat reference and Combat Reference Table
  - Blank/spare cards (prototype use)
- Dice: two six-sided dice
- Tokens/markers for Health (optional), Resolve/Dread slider, Grace, Status, and persistent Snares.

## Table layout
- **World Map (left):** Arrange the nine Domain stacks in a diamond. Bottom start: Home Village Termina. Top: The Nightsea Expanse. Place each Domain title face up with its shuffled deck underneath.
- **Exploration area (center):** Active Domain goes here. Title card on top; beneath it the Domain draw pile (face down) and a discard pile (starts empty). Below those, up to three face-down Station cards (the active row).
- **Status area (right):** Player card plus trackers (Health 20, Resolve 0, Grace 0, Dread neutral). Leave space for two Item slots, two Equipment slots, any persistent Snares, and a stack for completed Domains.

## Setup and starting play
1) Take Home Village Termina. Shuffle its 18 Station cards face down beneath the title card without looking.
2) Place that stack in the Exploration area.
3) Draw three face-down cards from the Domain deck into the active row (slots 1-3).
4) Keep the Resolve/Dread slider in the neutral gap; Grace at 0; Health at 20.

## Turn loop inside a Domain
1) Ensure three face-down cards are present. If fewer and the deck is not empty, draw to refill.
2) Choose one face-down card and flip it.
3) Resolve it fully using Card Types below. Keepers go to your player zone; others usually go to the Domain discard.
4) If the Domain deck still has cards, immediately refill the empty slot with the next face-down card.
5) Continue until the Domain deck is empty **and** no face-down cards remain.
6) Domain complete: place the Domain title on top of its discard pile and move the stack aside, out of play. Proceed forward to an adjacent Domain on the diamond path (no backtracking).

## Card types (prototype set)
- **Item:** Goes to one of two Item slots. If slots are full, you may swap; the displaced Item goes to this Domain discard. One-time Use effects are discarded after use.
- **Equipment:** Goes to one of two Equipment slots. If slots are full, you may swap; displaced Equipment is discarded here. Remains until removed.
- **Companion/Ally:** Kept in the player zone; offers passive or single-use effects.
- **Duel/Combat/Beast/Hollow:** Simultaneous combat. Roll 1d6 for you and 1d6 for the enemy each exchange; apply combat table results and card text until one side is defeated.
- **Terror:** Two options; choose one, resolve, then discard.
- **Pit/Challenge:** Single test vs a target number or extended test (3 successes before 3 failures). Track tallies until one threshold is met.
- **Snare:** Persistent hindrance; stays in your area until cleansed or removed by a card effect.
- **Caesura:** No major effect; often a moment of texture or a minor peek/reorder. Discard after reading.
- **Blessing:** Immediate benefit; discard after resolving.
- **Rest:** While resolving, you may spend 1 Resolve to gain 1 Grace and/or spend 1 Resolve to heal 5 Health (repeat as desired), then discard.
- **Scenes/Locations:** Domain title and some Station cards carry scene text; resolve any listed effects.
- **Special/Trackers:** Player, Guardian, Resolve/Dread slider, Grace, Health, Status, Combat Reference, and blanks.

## Combat reference (player side)
Roll 1d6 each for player and foe simultaneously; apply both results.
- 1: Miss (deal 0)
- 2: Parry (block all incoming)
- 3: Hit (deal 1 + ATK)
- 4: Hit (deal 1 + ATK)
- 5: Critical (deal 2 + ATK)
- 6: Counter (block all incoming and deal 1 unless enemy text overrides)

Enemy faces, HP, immunities, and on-hit effects are printed on the card. Reduce incoming damage by your DEF. Apply simultaneous effects; if a side reaches 0 HP, it is defeated immediately.

## Resolve, Dread, and Grace
- Start with the marker in the neutral gap of the Resolve/Dread slider.
- Gain N Resolve: move the marker up N steps toward Resolve (max four).
- Gain N Dread: move the marker down N steps toward Dread (max four).
- Cards may check thresholds such as "if Resolve >= 2" or "if Dread >= 3."
- Grace is a reroll bank (0-3). Gain Grace only by spending Resolve at Rest cards (1 Resolve -> 1 Grace). Spend 1 Grace to reroll any die you or an enemy just rolled; keep the new result.
- The track persists between Domains unless a card says otherwise.

## Forward path and final battle
- After completing Termina, choose an adjacent forward Domain on the diamond. You cannot backtrack to a cleared Domain or jump over gaps that are not adjacent.
- Continue clearing Domains until the Nightsea Expanse is completed.
- Then reveal the Guardian and fight using the Duel system plus any Guardian-specific requirements or seals noted on its card. If its requirements are impossible to meet, the run may be unwinnable.

## Failure state
- You lose immediately if Health reaches 0, Dread would move past its maximum, or you abandon the journey. Reset and start a new run.

## Known design gaps to revisit
- Finalize counts for reference and tracker cards (including blanks and spares).
- Decide whether peeking at face-down slots is only by card text or if a paid option exists.
- Guardian setup rules (pre-placed snares, resolve/dread spikes, arena modifiers) need confirmation.
- Diagramming: replace ASCII table layout with a proper world-map illustration for print rules.
