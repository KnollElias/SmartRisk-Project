import json
import os

defaultfilepath = "./statefile.json"

# def create_statefile(filepath=None, balance=500.0, nodes=None):
#     if nodes is None:
#         nodes = [
#             {"index": 1, "scalecount": 5, "state": 0, "scale": [0, 0, 0, 0, 0]}
#         ]
    
#     if filepath is None:
#         filepath = defaultfilepath
    
#     state = {
#         "balance": balance,
#         "nodes": nodes
#     }
    
#     with open(filepath, 'w') as f:
#         json.dump(state, f, indent=4)

def show_statefile(filepath=None):
    if filepath is None:
        filepath = defaultfilepath
    
    if not os.path.exists(filepath):
        print(f"No state file found at {filepath}")
        return
    
    with open(filepath, 'r') as f:
        state = json.load(f)
    
    for key, value in state.items():
        if isinstance(value, list):
            print(f"{key.capitalize()}:")
            for item in value:
                if isinstance(item, dict):
                    for sub_key, sub_value in item.items():
                        print(f"  {sub_key.capitalize()}: {sub_value}")
                else:
                    print(f"  {item}")
        else:
            print(f"{key.capitalize()}: {value}")

def read_statefile(filepath=None):
    if filepath is None:
        filepath = defaultfilepath
    
    if not os.path.exists(filepath):
        print(f"No state file found at {filepath}")
        return None
    
    with open(filepath, 'r') as f:
        state = json.load(f)
    
    return state

def write_statefile(attribute, value, filepath=None):
    if filepath is None:
        filepath = defaultfilepath
    
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            state = json.load(f)
    else:
        state = {}
    
    state[attribute] = value
    
    with open(filepath, 'w') as f:
        json.dump(state, f, indent=4)