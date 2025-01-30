import csv

def trade_outcome(csv_path, index):
    with open(csv_path, mode='r') as file:
        reader = csv.DictReader(file)
        rows = list(reader)
        
        if index < 1 or index > len(rows):
            raise IndexError("Index out of range")
        
        trade = rows[index - 1]
        change_percent = float(trade['Change %'].strip('%'))
        # open_price = float(trade['Open'])
        # close_price = float(trade['Price'])
        
        if change_percent > 0.01: # or (open_price - close_price) / close_price > 0.001:
            return True
        else:
            return False