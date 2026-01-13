#!/usr/bin/env python3
"""
Forward Game Simulator - Location 1
Runs Monte Carlo simulations to validate game balance
"""

import random
from dataclasses import dataclass
from typing import List, Optional, Tuple
from collections import defaultdict

@dataclass
class Card:
    name: str
    card_type: str
    hp: int = 0  # For Beasts/Hollows
    heal: int = 0  # For Items/Blessing
    equipment_type: str = ""  # "gnarled_branch" or "empty_prism"

@dataclass
class GameState:
    hp: int = 20
    max_hp: int = 20
    lux: int = 0
    equipment: List[Card] = None
    items: List[Card] = None
    snare_active: bool = False
    deck: List[Card] = None

    def __post_init__(self):
        if self.equipment is None:
            self.equipment = []
        if self.items is None:
            self.items = []
        if self.deck is None:
            self.deck = []

# Create the Location 1 deck
def create_deck() -> List[Card]:
    deck = []

    # Items (2) - dummy items for testing
    deck.append(Card("Old Boot", "Item", heal=0))
    deck.append(Card("Older Boot", "Item", heal=0))

    # Equipment (2)
    deck.append(Card("Gnarled Branch", "Equipment", equipment_type="gnarled_branch"))
    deck.append(Card("Empty Prism", "Equipment", equipment_type="empty_prism"))

    # Beasts (5)
    deck.append(Card("Ravenous Boar", "Beast", hp=3))
    deck.append(Card("Mangy Wolf", "Beast", hp=3))
    deck.append(Card("Feral Dog Pack", "Beast", hp=3))
    deck.append(Card("Territorial Stag", "Beast", hp=5))
    deck.append(Card("Carrion Crow Flock", "Beast", hp=5))

    # Hollow (1)
    deck.append(Card("Magistrate's Lackeys", "Hollow", hp=7))

    # Terror (1)
    deck.append(Card("Parents Slain", "Terror"))

    # Pit (3)
    deck.append(Card("Trapped Corridor", "Pit"))
    deck.append(Card("Treacherous Ravine", "Pit"))
    deck.append(Card("Escape Through Flames", "Pit"))

    # Snare (1)
    deck.append(Card("Overwhelming Dread", "Snare"))

    # Blessing (1)
    deck.append(Card("A Moment of Grace", "Blessing", heal=10))

    # Caesura (3)
    deck.append(Card("Cold Hearth Shadows", "Caesura"))
    deck.append(Card("Moon on the Well", "Caesura"))
    deck.append(Card("Orchard at Dusk", "Caesura"))

    return deck

def roll_d6() -> int:
    """Roll a d6 and return result"""
    return random.randint(1, 6)

def combat_roll_player(equipment: List[Card]) -> Tuple[int, bool, bool]:
    """
    Player rolls 3d6, chooses best
    Equipment modifies the table
    Returns (damage, is_block, is_counter)
    """
    # Roll 3d6, choose best
    rolls = [roll_d6(), roll_d6(), roll_d6()]
    roll = max(rolls)  # Choose highest

    # Check for Gnarled Branch: 1 becomes Hit
    has_branch = any(e.equipment_type == "gnarled_branch" for e in equipment)

    # NEW TABLE:
    # 1: Miss (or Hit with Gnarled Branch)
    # 2: Block
    # 3-4: Hit (1 dmg)
    # 5: Hit (2 dmg)
    # 6: Counter (block + 1 dmg)

    if roll == 1:
        if has_branch:
            return (1, False, False)  # Hit instead of Miss
        else:
            return (0, False, False)  # Miss
    elif roll == 2:
        return (0, True, False)  # Block
    elif roll == 3 or roll == 4:
        return (1, False, False)  # Hit
    elif roll == 5:
        return (2, False, False)  # Hit 2
    elif roll == 6:
        return (1, True, True)  # Counter: block + deal 1

    return (0, False, False)

def combat_roll_enemy() -> Tuple[int, bool, bool]:
    """
    Enemy rolls 1d6
    Returns (damage, is_block, is_counter)
    """
    roll = roll_d6()

    # Same table as player (but no equipment)
    if roll == 1:
        return (0, False, False)  # Miss
    elif roll == 2:
        return (0, True, False)  # Block
    elif roll == 3 or roll == 4:
        return (1, False, False)  # Hit
    elif roll == 5:
        return (2, False, False)  # Hit 2
    elif roll == 6:
        return (1, True, True)  # Counter

    return (0, False, False)

def resolve_combat(state: GameState, enemy_hp: int, allow_reroll: bool = True) -> bool:
    """
    Resolve combat between player and enemy
    Returns True if player survives, False if player dies
    """
    current_enemy_hp = enemy_hp

    # Check if player has Empty Prism (required for Lux)
    has_prism = any(e.equipment_type == "empty_prism" for e in state.equipment)

    while current_enemy_hp > 0 and state.hp > 0:
        # Both roll
        player_dmg, player_block, player_counter = combat_roll_player(state.equipment)
        enemy_dmg, enemy_block, enemy_counter = combat_roll_enemy()

        # Counters block AND deal damage
        # If player counters, they block enemy and deal damage
        # If enemy counters, they block player and deal damage

        # Apply blocks (counters also block)
        if player_block or player_counter:
            enemy_dmg = 0
        if enemy_block or enemy_counter:
            player_dmg = 0

        # Apply damage
        current_enemy_hp -= player_dmg
        state.hp -= enemy_dmg

        # Check for Lux reroll opportunity (if about to die)
        if state.hp <= 0 and state.lux > 0 and allow_reroll and not state.snare_active and has_prism:
            # Use Lux to reroll (we'd die otherwise)
            state.lux -= 1
            state.hp += enemy_dmg  # Undo damage
            # This turn is wasted but we survive to next round

    return state.hp > 0

def resolve_pit(state: GameState) -> None:
    """Resolve a Pit challenge (TN 3+, 2 HP per failure)"""
    successes = 0
    failures = 0

    # Check if player has Empty Prism (required for Lux)
    has_prism = any(e.equipment_type == "empty_prism" for e in state.equipment)

    while successes < 3 and failures < 3:
        roll = roll_d6()
        if roll >= 3:
            successes += 1
        else:
            failures += 1
            state.hp -= 2

            # Use Lux to reroll a failure if low HP
            if state.hp <= 5 and state.lux > 0 and not state.snare_active and has_prism:
                state.lux -= 1
                state.hp += 2  # Undo damage
                failures -= 1  # Undo failure count

def resolve_terror(state: GameState) -> None:
    """Resolve Terror: Choose 5 HP or lose 1 Lux"""
    # Decision logic: Lose Lux if we have it and HP < 12
    if state.lux > 0 and state.hp < 12:
        state.lux -= 1  # Lose Lux
    else:
        state.hp -= 5  # Take damage

def ai_should_peek(state: GameState, cards_in_lineup: List[Card]) -> bool:
    """Decide if AI should spend Lux to peek"""
    # Check if player has Empty Prism (required for Lux)
    has_prism = any(e.equipment_type == "empty_prism" for e in state.equipment)

    if state.snare_active or not has_prism:
        return False

    # NEW LOGIC: Peek when you can afford it (have 2+ Lux) and not in immediate danger
    # Don't peek if you'll need all Lux for healing
    if state.lux >= 2:
        # Peek if HP is in danger zone (8-14) - vulnerable but not desperate
        if 8 <= state.hp <= 14:
            return True
        # Or peek if have lots of Lux (3) and HP is okay
        if state.lux == 3 and state.hp > 10:
            return True

    return False

def ai_should_shuffle_back_card(state: GameState, card: Card) -> bool:
    """Decide if AI should shuffle back a specific card"""
    # Shuffle back if dangerous and low HP
    if state.hp <= 10:
        if card.card_type in ["Beast", "Hollow", "Terror", "Pit"]:
            # Check if combat would be dangerous
            if card.card_type in ["Beast", "Hollow"]:
                expected_damage = card.hp  # Rough estimate
                if expected_damage >= state.hp - 3:  # Would leave us with <3 HP
                    return True
            elif card.card_type == "Terror":
                return True  # Always avoid Terror when low
            elif card.card_type == "Pit":
                return True  # Avoid Pit when low HP

    return False

def ai_should_heal(state: GameState) -> bool:
    """Decide if AI should spend Lux to heal"""
    # Check if player has Empty Prism (required for Lux)
    has_prism = any(e.equipment_type == "empty_prism" for e in state.equipment)

    if state.snare_active or state.lux == 0 or not has_prism:
        return False

    # Heal if HP is below 12 (more aggressive)
    if state.hp < 12:
        return True

    return False

def resolve_card(state: GameState, card: Card) -> bool:
    """
    Resolve a single card
    Returns True if player survives, False if player dies
    """

    if card.card_type == "Item":
        # Items are now dummy cards (Old Boot, Older Boot) - do nothing
        pass

    elif card.card_type == "Equipment":
        # Add to inventory (max 2)
        if len(state.equipment) < 2:
            state.equipment.append(card)

    elif card.card_type in ["Beast", "Hollow"]:
        # Combat
        if not resolve_combat(state, card.hp):
            return False  # Player died

    elif card.card_type == "Terror":
        resolve_terror(state)
        if state.hp <= 0:
            return False

    elif card.card_type == "Pit":
        resolve_pit(state)
        if state.hp <= 0:
            return False

    elif card.card_type == "Snare":
        state.snare_active = True

    elif card.card_type == "Blessing":
        state.hp = min(state.hp + card.heal, state.max_hp)
        state.snare_active = False  # Cleanse

    elif card.card_type == "Caesura":
        state.lux = min(state.lux + 1, 3)

    # After resolving, check if we should use Lux to heal
    while ai_should_heal(state):
        state.lux -= 1
        state.hp = min(state.hp + 5, state.max_hp)

    return True  # Player survived

def simulate_game() -> Tuple[bool, int, dict]:
    """
    Simulate one playthrough
    Returns (survived, ending_hp, stats_dict)
    """
    state = GameState()
    deck = create_deck()

    # GUARANTEE EMPTY PRISM IS FIRST CARD
    # Remove Empty Prism from deck
    empty_prism = None
    for i, card in enumerate(deck):
        if card.equipment_type == "empty_prism":
            empty_prism = deck.pop(i)
            break

    # Shuffle remaining cards
    random.shuffle(deck)

    # Put Empty Prism at the front
    if empty_prism:
        deck.insert(0, empty_prism)

    stats = {
        'cards_drawn': 0,
        'combat_encounters': 0,
        'damage_taken': 0,
        'healing_used': 0,
        'lux_spent_on_peek': 0,
        'lux_spent_on_heal': 0,
        'shuffles_back': 0
    }

    starting_hp = state.hp

    while deck and state.hp > 0:
        # Draw 3 cards (or fewer if deck is running out)
        draw_count = min(3, len(deck))
        if draw_count == 0:
            break

        lineup = [deck.pop(0) for _ in range(draw_count)]

        # AI decides whether to peek
        if ai_should_peek(state, lineup):
            # NEW PEEK MECHANIC: Peek at 2 cards, shuffle up to 2 back
            state.lux -= 1
            stats['lux_spent_on_peek'] += 1

            # Peek at 2 cards (or all if less than 2)
            num_to_peek = min(2, len(lineup))
            peeked_indices = random.sample(range(len(lineup)), num_to_peek)
            peeked_cards = [lineup[i] for i in peeked_indices]

            # Decide which to shuffle back (up to 2 of any of the 3)
            cards_to_shuffle_back = []
            for i, card in enumerate(lineup):
                if ai_should_shuffle_back_card(state, card):
                    cards_to_shuffle_back.append(card)
                    if len(cards_to_shuffle_back) >= 2:
                        break

            # Shuffle back chosen cards
            for card in cards_to_shuffle_back:
                lineup.remove(card)
                deck.append(card)
                stats['shuffles_back'] += 1

            # Draw replacements
            while len(lineup) < min(3, draw_count) and deck:
                lineup.append(deck.pop(0))

            # Shuffle deck
            random.shuffle(deck)

        # Choose a card (random if not peeked, avoid peeked if dangerous)
        if len(lineup) == 0:
            break
        chosen_card = random.choice(lineup)
        lineup.remove(chosen_card)

        # Return unchosen cards to deck and shuffle
        deck.extend(lineup)
        random.shuffle(deck)

        # Track stats
        stats['cards_drawn'] += 1
        if chosen_card.card_type in ["Beast", "Hollow"]:
            stats['combat_encounters'] += 1

        # Resolve the card
        hp_before = state.hp
        survived = resolve_card(state, chosen_card)
        hp_after = state.hp

        if hp_before > hp_after:
            stats['damage_taken'] += (hp_before - hp_after)
        elif hp_after > hp_before:
            stats['healing_used'] += (hp_after - hp_before)

        if not survived:
            return (False, 0, stats)

    # Calculate Lux spent on healing (rough estimate)
    stats['lux_spent_on_heal'] = 3 - state.lux - stats['lux_spent_on_peek']

    return (True, state.hp, stats)

def run_simulations(num_runs: int = 1000) -> dict:
    """Run multiple simulations and collect statistics"""
    results = {
        'total_runs': num_runs,
        'wins': 0,
        'losses': 0,
        'ending_hp_list': [],
        'total_damage_taken': 0,
        'total_healing_used': 0,
        'total_lux_peek': 0,
        'total_lux_heal': 0,
        'total_shuffles': 0,
        'total_combat_encounters': 0
    }

    for _ in range(num_runs):
        survived, ending_hp, stats = simulate_game()

        if survived:
            results['wins'] += 1
            results['ending_hp_list'].append(ending_hp)
        else:
            results['losses'] += 1
            results['ending_hp_list'].append(0)

        results['total_damage_taken'] += stats['damage_taken']
        results['total_healing_used'] += stats['healing_used']
        results['total_lux_peek'] += stats['lux_spent_on_peek']
        results['total_lux_heal'] += stats['lux_spent_on_heal']
        results['total_shuffles'] += stats['shuffles_back']
        results['total_combat_encounters'] += stats['combat_encounters']

    return results

def print_results(results: dict):
    """Print simulation results"""
    total = results['total_runs']
    wins = results['wins']
    losses = results['losses']

    print("=" * 60)
    print("FORWARD - LOCATION 1 SIMULATION RESULTS")
    print("=" * 60)
    print(f"\nTotal Simulations: {total}")
    print(f"Wins: {wins} ({wins/total*100:.1f}%)")
    print(f"Losses: {losses} ({losses/total*100:.1f}%)")

    # Filter out losses (0 HP) for ending HP stats
    surviving_hp = [hp for hp in results['ending_hp_list'] if hp > 0]

    if surviving_hp:
        print(f"\n--- ENDING HP (survivors only) ---")
        print(f"Average: {sum(surviving_hp)/len(surviving_hp):.1f} HP")
        print(f"Median: {sorted(surviving_hp)[len(surviving_hp)//2]:.1f} HP")
        print(f"Min: {min(surviving_hp)} HP")
        print(f"Max: {max(surviving_hp)} HP")

        # HP distribution
        print(f"\n--- HP DISTRIBUTION (survivors) ---")
        hp_buckets = defaultdict(int)
        for hp in surviving_hp:
            bucket = (hp // 5) * 5
            hp_buckets[bucket] += 1

        for bucket in sorted(hp_buckets.keys()):
            count = hp_buckets[bucket]
            bar = "#" * int(count / len(surviving_hp) * 50)
            print(f"{bucket:2d}-{bucket+4:2d} HP: {bar} ({count})")

    print(f"\n--- AVERAGES PER GAME ---")
    print(f"Damage taken: {results['total_damage_taken']/total:.1f} HP")
    print(f"Healing used: {results['total_healing_used']/total:.1f} HP")
    print(f"Combat encounters: {results['total_combat_encounters']/total:.1f}")
    print(f"Lux spent on peek: {results['total_lux_peek']/total:.1f}")
    print(f"Lux spent on heal: {results['total_lux_heal']/total:.1f}")
    print(f"Cards shuffled back: {results['total_shuffles']/total:.1f}")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    print("Running 1000 simulations...\n")
    results = run_simulations(1000)
    print_results(results)
