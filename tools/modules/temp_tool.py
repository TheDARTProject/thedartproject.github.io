import json

# Load the JSON data from a file
with open('../Compromised-Discord-Accounts.json', 'r') as file:
    data = json.load(file)

# Iterate over each key in the dictionary
for key, value in data.items():
    # Check if the case contains the "ACCOUNT_NUMBER_" field
    if "ACCOUNT_NUMBER_" in value:
        # Remove the "ACCOUNT_NUMBER_" field from the case data
        del value["ACCOUNT_NUMBER_"]

# Save the modified data back to a new file
with open('../Compromised-Discord-Accounts.json', 'w') as file:
    json.dump(data, file, indent=4)

print("The 'ACCOUNT_NUMBER_' fields have been removed from each case.")
