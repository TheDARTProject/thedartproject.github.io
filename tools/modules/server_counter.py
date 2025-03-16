import json

# Load the JSON data from the file
with open('../Compromised-Discord-Accounts.json', 'r') as file:
    data = json.load(file)

# Create a dictionary to store the server counts
server_counts = {}

# Iterate over all accounts in the JSON data
for account_number, account_details in data.items():
    server = account_details.get("FOUND_ON_SERVER")

    # Update the count for the server
    if server:
        if server in server_counts:
            server_counts[server] += 1
        else:
            server_counts[server] = 1

# Print the number of cases for each server
for server, count in server_counts.items():
    print(f"Server: {server} - Cases: {count}")
