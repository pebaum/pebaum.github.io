# Why the AI Doesn't Peek (Analysis)

## The Problem

**Lux spent on peek: 0.0** across 1000 simulations

The AI has peek logic but never uses it. Why?

---

## Root Cause: Competing Priorities

### Current AI Logic

**Peek decision (happens BEFORE drawing):**
```python
def ai_should_peek():
    if HP < 10:
        return True  # Peek!
    return False
```

**Heal decision (happens AFTER resolving card):**
```python
def ai_should_heal():
    if HP < 12:
        return True  # Heal!
    return False

# In resolve_card:
while ai_should_heal(state):
    state.lux -= 1
    state.hp += 5  # Heal
```

### The Conflict

**Scenario 1: HP = 11**
- Peek? NO (needs HP < 10)
- Heal? YES (HP < 12)
- Result: Spends Lux on healing, never peeks

**Scenario 2: HP = 9**
- Peek? YES (HP < 10)
- Heal? YES (HP < 12)
- Result: Peeks (costs 1 Lux), then immediately spends remaining Lux on healing
- Next turn: No Lux left to peek again

**Scenario 3: HP = 15**
- Peek? NO (HP >= 10)
- Heal? NO (HP >= 12)
- Result: Saves Lux but never peeks (not desperate enough)

### The Result

AI only considers peeking when HP < 10 (desperate mode), but healing also triggers at HP < 12. Since healing happens AFTER card resolution, all Lux gets consumed by healing.

**Peek and heal are competing for the same Lux in the same HP range.**

---

## Additional Issues

### 1. Peek Logic Doesn't Evaluate Card Safety

Current peek logic just checks HP:
```python
if state.hp < 10:
    return True  # Always peek if low HP
```

Better logic would evaluate:
- **"Am I at high risk?"** (low HP + facing unknown cards)
- **"Can I afford to peek?"** (have 2+ Lux, or only 1 but HP stable)
- **"What's the expected value?"** (likely to find dangerous cards vs safe cards)

### 2. Peek Threshold Is Too Low

HP < 10 means AI is already in survival mode. At that point, healing is more urgent than information.

Better thresholds:
- Peek when HP < 15 (proactive risk management)
- Or: Peek when HP < 12 AND have 2+ Lux (can afford both peek + heal)

### 3. No Expected Value Calculation

The AI doesn't know:
- How many dangerous cards are left in deck (Beasts, Hollows, Pits, Terror)
- How many safe cards are left (Caesuras, Blessing, Equipment, Items)
- Probability of drawing danger vs safety

A smart AI would calculate:
```
dangerous_cards_remaining = count(Beasts + Hollows + Terror + Pit)
safe_cards_remaining = count(Caesuras + Blessing + Equipment + Item)
danger_ratio = dangerous_cards_remaining / total_cards_remaining

if danger_ratio > 0.6 and state.hp < 12 and state.lux >= 2:
    # High danger, low HP, but have spare Lux
    return True  # Peek to avoid danger
```

---

## Better Peek Strategy

### Strategy 1: Peek When You Can Afford It
```python
def ai_should_peek(state, cards_in_lineup):
    has_prism = any(e.equipment_type == "empty_prism" for e in state.equipment)

    if not has_prism or state.snare_active:
        return False

    # Need at least 2 Lux to consider peeking (keep 1 for emergency heal)
    if state.lux < 2:
        return False

    # Peek if in danger zone (HP 8-14)
    if 8 <= state.hp <= 14:
        return True

    # Peek if have lots of Lux (3) and not in immediate danger
    if state.lux == 3 and state.hp > 10:
        return True

    return False
```

### Strategy 2: Peek Based on Deck Composition
```python
def ai_should_peek(state, deck_remaining):
    # Count dangerous vs safe cards left
    dangerous = count(c for c in deck if c.type in ["Beast", "Hollow", "Terror", "Pit"])
    total = len(deck)
    danger_ratio = dangerous / total if total > 0 else 0

    # Peek if danger is high and we're vulnerable
    if danger_ratio > 0.5 and state.hp < 15 and state.lux >= 2:
        return True

    return False
```

### Strategy 3: Always Peek Early, Save Lux Late
```python
def ai_should_peek(state, cards_drawn):
    # Early game: use Lux for info
    if cards_drawn < 10 and state.lux >= 2:
        return True

    # Late game: save Lux for healing
    if cards_drawn >= 10 and state.hp < 12:
        return False

    return state.lux >= 2 and state.hp < 15
```

---

## Comparison: Current vs Better AI

### Current AI (Simulated)
- **Peek usage:** 0.0 Lux per game
- **Peek timing:** Only when HP < 10 (too late)
- **Result:** Never peeks, healing takes priority

### Better AI (Hypothetical)
- **Peek usage:** 0.5-1.0 Lux per game
- **Peek timing:** When HP 8-14 AND have 2+ Lux (balanced)
- **Result:** Peeks 1-2 times per location strategically

---

## Why This Matters for Design

### Human vs AI Behavior

**Human players would likely:**
- Peek 1-2 times per location
- Peek when facing critical decisions (low HP, uncertain outcomes)
- Value information more than AI does
- Plan ahead ("I need to find Blessing soon or I'm dead")

**AI currently:**
- Never peeks (healing always wins)
- Reactive, not proactive
- Doesn't plan ahead

### Peek Mechanic Might Be Stronger Than We Think

Since AI doesn't use peek, we can't evaluate:
- Is "flip 2, shuffle up to 2" worth 1 Lux?
- How much does peek improve win rate?
- What's the skill ceiling of optimal peeking?

**Human playtests are critical** to understand this mechanic's power.

---

## Recommendations

### Option 1: Fix AI Peek Logic
Make AI peek when it can afford to (2+ Lux, HP in danger zone).

**Pro:** Better simulation of human play
**Con:** More complex AI

### Option 2: Keep Simple AI, Rely on Human Playtest
Accept that AI is conservative with peek, test with humans.

**Pro:** Simpler
**Con:** Can't balance peek mechanic via simulation

### Option 3: Make Peek Cheaper
If 1 Lux is too expensive to compete with healing, make peek cost 0.5 Lux or make first peek free per location.

**Pro:** Encourages use
**Con:** Changes game balance

### Option 4: Separate "Scout Lux" vs "Healing Lux"
Gain different types of Lux for different purposes.

**Pro:** No competition between peek and heal
**Con:** More complex resource system

---

## Next Steps

1. **Implement better AI peek logic** (Strategy 1: peek when have 2+ Lux and HP 8-14)
2. **Re-run simulation** to see peek usage and win rate change
3. **Compare** to current 63.7% win rate
4. **Human playtest** to validate AI behavior matches real play

Would you like me to implement one of these strategies and re-simulate?
