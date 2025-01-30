log_file_path = "./logs.txt"

def log(message):
    with open(log_file_path, 'a') as log_file:
        log_file.write(message + '\n')