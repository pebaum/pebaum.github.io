#!/usr/bin/env python3
"""
Forward - Full 9-Location Campaign Simulation
"""

import random
from dataclasses import dataclass
from typing import List, Tuple
from collections import defaultdict

@dataclass
class Card:
    name: str
    card_type: str
    location: int
    hp: int = 0
    heal: int = 0
    equipment_type: str = ""
    tier: int = 1  # Equipment/Item tier (1-3)

@dataclass
class GameState:
    hp: int = 20
    max_hp: int = 20
    lux: int = 0
    equipment: List[Card] = None
    snare_active: bool = False
    current_location: int = 1
    free_reroll_used: bool = False  # Track if free reroll used this combat

    def __post_init__(self):
        if self.equipment is None:
            self.equipment = []

def create_location_deck(location_num: int) -> List[Card]:
    """Create deck for a specific location with difficulty scaling"""
    deck = []

    # Difficulty tiers: 1-3 (easy), 4-6 (medium), 7-9 (hard)
    tier = (location_num - 1) // 3 + 1

    # Beast HP scaling (reduced by 1 across the board)
    if tier == 1:  # Locations 1-3
        beast_hp = [2, 2, 2, 4, 4]
        hollow_hp = 6
    elif tier == 2:  # Locations 4-6
        beast_hp = [4, 4, 4, 6, 6]
        hollow_hp = 8
    else:  # Locations 7-9
        beast_hp = [6, 6, 6, 8, 8]
        hollow_hp = 9

    # Items (healing scales with tier)
    item_heal = [3, 5, 8][tier - 1]  # Tier 1: 3 HP, Tier 2: 5 HP, Tier 3: 8 HP
    deck.append(Card(f"Item A (L{location_num})", "Item", location_num, heal=item_heal, tier=tier))
    deck.append(Card(f"Item B (L{location_num})", "Item", location_num, heal=item_heal, tier=tier))

    # Equipment (weapon only - player starts with Empty Prism)
    weapon_name = ["Gnarled Branch", "Sturdy Blade", "Masterwork Blade"][tier - 1]
    deck.append(Card(f"{weapon_name} (L{location_num})", "Equipment", location_num, equipment_type="weapon", tier=tier))

    # Beasts
    for i, hp in enumerate(beast_hp):
        deck.append(Card(f"Beast {i+1} (L{location_num})", "Beast", location_num, hp=hp))

    # Hollow
    deck.append(Card(f"Hollow (L{location_num})", "Hollow", location_num, hp=hollow_hp))

    # Terror
    deck.append(Card(f"Terror (L{location_num})", "Terror", location_num))

    # Pits
    for i in range(3):
        deck.append(Card(f"Pit {i+1} (L{location_num})", "Pit", location_num))

    # Snare
    deck.append(Card(f"Snare (L{location_num})", "Snare", location_num))

    # Blessing (heal scales with tier)
    blessing_heal = 10 + (tier - 1) * 2  # 10, 12, 14 HP
    deck.append(Card(f"Blessing (L{location_num})", "Blessing", location_num, heal=blessing_heal))

    # Caesuras
    for i in range(3):
        deck.append(Card(f"Caesura {i+1} (L{location_num})", "Caesura", location_num))

    # Note: Deck now has 18 cards (removed tool, Hollow will be positioned in last 3)
    return deck

def roll_d6() -> int:
    return random.randint(1, 6)

def combat_roll_player(equipment: List[Card]) -> Tuple[int, bool, bool]:
    """Player rolls 3d6, chooses best"""
    rolls = [roll_d6(), roll_d6(), roll_d6()]
    roll = max(rolls)

    # Check for weapon equipment and get tier
    weapon = next((e for e in equipment if e.equipment_type == "weapon"), None)
    weapon_tier = weapon.tier if weapon else 0

    if roll == 1:
        # Tier 1+: 1 → Hit
        return (1, False, False) if weapon_tier >= 1 else (0, False, False)
    elif roll == 2:
        # Tier 2+: 2 → Hit (otherwise Block)
        if weapon_tier >= 2:
            return (1, False, False)
        else:
            return (0, True, False)
    elif roll == 3 or roll == 4:
        # Tier 3+: 3-4 → Hit+1 (otherwise Hit)
        if weapon_tier >= 3:
            return (2, False, False)
        else:
            return (1, False, False)
    elif roll == 5:
        return (2, False, False)
    elif roll == 6:
        return (1, True, True)

    return (0, False, False)

def combat_roll_enemy() -> Tuple[int, bool, bool]:
    """Enemy rolls 1d6"""
    roll = roll_d6()

    if roll == 1:
        return (0, False, False)
    elif roll == 2:
        return (0, True, False)
    elif roll == 3 or roll == 4:
        return (1, False, False)
    elif roll == 5:
        return (2, False, False)
    elif roll == 6:
        return (1, True, True)

    return (0, False, False)

def resolve_combat(state: GameState, enemy_hp: int) -> bool:
    """Resolve combat"""
    current_enemy_hp = enemy_hp
    has_tool = any(e.equipment_type == "tool" for e in state.equipment)

    while current_enemy_hp > 0 and state.hp > 0:
        player_dmg, player_block, player_counter = combat_roll_player(state.equipment)
        enemy_dmg, enemy_block, enemy_counter = combat_roll_enemy()

        if player_block or player_counter:
            enemy_dmg = 0
        if enemy_block or enemy_counter:
            player_dmg = 0

        current_enemy_hp -= player_dmg
        state.hp -= enemy_dmg

        # Emergency Lux reroll
        if state.hp <= 0 and state.lux > 0 and not state.snare_active and has_tool:
            state.lux -= 1
            state.hp += enemy_dmg

    return state.hp > 0

def resolve_pit(state: GameState) -> None:
    """Resolve Pit challenge"""
    successes = 0
    failures = 0
    has_tool = any(e.equipment_type == "tool" for e in state.equipment)

    while successes < 3 and failures < 3:
        roll = roll_d6()
        if roll >= 3:
            successes += 1
        else:
            failures += 1
            state.hp -= 1  # Reduced from 2 to 1 HP

            if state.hp <= 5 and state.lux > 0 and not state.snare_active and has_tool:
                state.lux -= 1
                state.hp += 1  # Adjusted reroll recovery
                failures -= 1

def resolve_terror(state: GameState) -> None:
    """Resolve Terror"""
    if state.lux > 0 and state.hp < 12:
        state.lux -= 1
    else:
        state.hp -= 4  # Reduced from 5 to 4 HP

def ai_should_heal(state: GameState) -> bool:
    """Decide if AI should heal"""
    has_tool = any(e.equipment_type == "tool" for e in state.equipment)

    if state.snare_active or state.lux == 0 or not has_tool:
        return False

    if state.hp < 12:
        return True

    return False

def resolve_card(state: GameState, card: Card) -> bool:
    """Resolve a single card"""

    if card.card_type == "Item":
        # Items heal based on tier (3, 5, 8 HP)
        state.hp = min(state.hp + card.heal, state.max_hp)

    elif card.card_type == "Equipment":
        if len(state.equipment) < 2:
            state.equipment.append(card)

    elif card.card_type == "Beast":
        if not resolve_combat(state, card.hp):
            return False

    elif card.card_type == "Hollow":
        if not resolve_combat(state, card.hp):
            return False
        # No heal after Hollow - only heal between locations

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
        state.snare_active = False

    elif card.card_type == "Caesura":
        # Always +1 Lux (Empty Prism doesn't upgrade)
        state.lux = min(state.lux + 1, 3)

    # Auto-heal with Lux (always 5 HP)
    while ai_should_heal(state):
        state.lux -= 1
        state.hp = min(state.hp + 5, state.max_hp)

    return True

def simulate_location(state: GameState, location_num: int) -> Tuple[bool, dict]:
    """Simulate one location"""
    deck = create_location_deck(location_num)

    # Full heal at start of new location (rest between locations)
    if location_num > 1:
        state.hp = state.max_hp

    # Position Hollow in last 3 cards (predictable boss)
    hollow = next((c for c in deck if c.card_type == "Hollow"), None)
    if hollow:
        deck.remove(hollow)
        random.shuffle(deck)
        # Insert Hollow in one of the last 3 positions
        hollow_position = len(deck) - random.randint(0, 2)
        deck.insert(hollow_position, hollow)
    else:
        random.shuffle(deck)

    stats = {
        'cards_drawn': 0,
        'damage_taken': 0,
        'healing_used': 0,
        'starting_hp': state.hp,
        'max_hp': state.max_hp
    }

    starting_hp = state.hp

    while deck and state.hp > 0:
        # Simple draw (no peeking for speed)
        card = deck.pop(0)
        stats['cards_drawn'] += 1

        hp_before = state.hp
        survived = resolve_card(state, card)
        hp_after = state.hp

        if hp_before > hp_after:
            stats['damage_taken'] += (hp_before - hp_after)
        elif hp_after > hp_before:
            stats['healing_used'] += (hp_after - hp_before)

        if not survived:
            return (False, stats)

    stats['ending_hp'] = state.hp
    return (True, stats)

def simulate_full_campaign() -> Tuple[bool, List[dict]]:
    """Simulate all 9 locations"""
    state = GameState()
    # Player starts with Empty Prism
    state.equipment.append(Card("Empty Prism (Starting)", "Equipment", 0, equipment_type="tool", tier=1))
    location_stats = []

    for location_num in range(1, 10):
        state.current_location = location_num
        survived, stats = simulate_location(state, location_num)

        stats['location'] = location_num
        stats['survived'] = survived
        location_stats.append(stats)

        if not survived:
            return (False, location_stats)

    return (True, location_stats)

def run_campaign_simulations(num_runs: int = 1000):
    """Run multiple full campaign simulations"""
    results = {
        'total_runs': num_runs,
        'full_victories': 0,
        'location_stats': defaultdict(lambda: {
            'attempts': 0,
            'clears': 0,
            'deaths': 0,
            'total_damage': 0,
            'total_healing': 0
        })
    }

    final_locations_reached = []

    for _ in range(num_runs):
        survived, location_stats = simulate_full_campaign()

        if survived:
            results['full_victories'] += 1

        # Track stats per location
        for stats in location_stats:
            loc = stats['location']
            results['location_stats'][loc]['attempts'] += 1

            if stats['survived']:
                results['location_stats'][loc]['clears'] += 1
            else:
                results['location_stats'][loc]['deaths'] += 1

            results['location_stats'][loc]['total_damage'] += stats['damage_taken']
            results['location_stats'][loc]['total_healing'] += stats['healing_used']

        final_locations_reached.append(len(location_stats))

    results['final_locations_reached'] = final_locations_reached

    return results

def print_results(results: dict):
    """Print campaign simulation results"""
    total = results['total_runs']
    victories = results['full_victories']

    print("=" * 80)
    print("FORWARD - FULL 9-LOCATION CAMPAIGN SIMULATION")
    print("=" * 80)

    print(f"\nTotal Runs: {total}")
    print(f"Full Campaign Victories: {victories} ({victories/total*100:.1f}%)")
    print(f"Died Before Completion: {total - victories} ({(total-victories)/total*100:.1f}%)")

    # Per-location stats
    print(f"\n{'='*80}")
    print("PER-LOCATION STATISTICS")
    print(f"{'='*80}")
    print(f"{'Location':<12} {'Attempts':<10} {'Clears':<10} {'Deaths':<10} {'Clear %':<12} {'Avg Dmg':<10} {'Avg Heal':<10}")
    print(f"{'-'*80}")

    for loc in range(1, 10):
        stats = results['location_stats'][loc]
        attempts = stats['attempts']

        if attempts > 0:
            clear_pct = (stats['clears'] / attempts) * 100
            avg_dmg = stats['total_damage'] / attempts
            avg_heal = stats['total_healing'] / attempts

            print(f"Location {loc:<3} {attempts:<10} {stats['clears']:<10} {stats['deaths']:<10} "
                  f"{clear_pct:>5.1f}%       {avg_dmg:<10.1f} {avg_heal:<10.1f}")

    # Death distribution
    print(f"\n{'='*80}")
    print("WHERE PLAYERS DIED")
    print(f"{'='*80}")

    from collections import Counter
    final_locs = results['final_locations_reached']
    death_counts = Counter([loc for loc in final_locs if loc < 9])

    print(f"{'Location':<15} {'Deaths':<10} {'Percentage'}")
    print(f"{'-'*40}")
    for loc in range(1, 9):
        count = death_counts.get(loc, 0)
        pct = (count / total) * 100
        if count > 0:
            bar = '#' * int(pct * 2)
            print(f"Location {loc:<6} {count:<10} {pct:>5.1f}%  {bar}")

    print(f"\nCompleted All 9:  {victories} ({victories/total*100:.1f}%)")

if __name__ == "__main__":
    print("Running 10000 full campaign simulations...\n")
    results = run_campaign_simulations(10000)
    print_results(results)
