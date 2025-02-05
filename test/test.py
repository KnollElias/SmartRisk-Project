import random

# Simulation Parameters
num_trials = 1000  # Number of trades to simulate
starting_bet = 1  # Initial bet per scale
max_buffer_single = 8  # Single scale with 8 levels
num_scales = 8  # Number of independent scales in the multiscale system
capital_single = 511  # Required capital for single scale
capital_multi = starting_bet * num_scales  # Capital for multiscale strategy

# Simulate outcomes (50% win rate)
outcomes = [random.choice([1, 0]) for _ in range(num_trials)]  # 1 = Win, 0 = Loss

# Single Scale Simulation
profit_single = 0
current_bet_single = starting_bet
buffer_count_single = 0

for outcome in outcomes:
    if outcome == 1:  # Win
        profit_single += current_bet_single
        current_bet_single = starting_bet
        buffer_count_single = 0
    else:  # Loss
        profit_single -= current_bet_single
        buffer_count_single += 1
        if buffer_count_single >= max_buffer_single:  # Max buffer reached
            break
        current_bet_single *= 2

# Multiscale Simulation
profits_multi = [0] * num_scales  # Initialize profits for each scale
current_bets_multi = [starting_bet] * num_scales  # Initialize bets for each scale
buffer_counts_multi = [0] * num_scales  # Track buffer levels for each scale

for outcome in outcomes:
    for i in range(num_scales):
        if outcome == 1:  # Win
            profits_multi[i] += current_bets_multi[i]
            current_bets_multi[i] = starting_bet
            buffer_counts_multi[i] = 0
        else:  # Loss
            profits_multi[i] -= current_bets_multi[i]
            buffer_counts_multi[i] += 1
            if buffer_counts_multi[i] >= 1:  # Each scale has only 1 level
                break
            current_bets_multi[i] *= 2

# Calculate total profit for the multiscale strategy
total_profit_multi = sum(profits_multi)

# Output Results
print("Single Scale Strategy:")
print(f"  Total Profit: ${profit_single}")
print(f"  Capital Required: ${capital_single}")

print("\nMultiscale Strategy:")
print(f"  Total Profit: ${total_profit_multi}")
print(f"  Capital Required: ${capital_multi}")

