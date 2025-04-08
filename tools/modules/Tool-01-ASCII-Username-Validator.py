import json
import string
from datetime import datetime


# Function to check if a string is ASCII
def is_ascii(s):
    return all(c in string.printable for c in s)


# Load the JSON data from the file
with open("../Compromised-Discord-Accounts.json", "r") as file:
    data = json.load(file)

# Get the current timestamp in the desired format
current_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Print the number of cases found with the current timestamp
print(f"[{current_timestamp}] Found {len(data)} cases in the JSON.")

# Initialize counters for the updated usernames
updated_true = 0
updated_false = 0

# Iterate through the accounts
for account_number, account_info in data.items():
    username = account_info["USERNAME"]

    # Check if the username is ASCII
    if is_ascii(username):
        account_info["NON_ASCII_USERNAME"] = False
        updated_false += 1
    else:
        account_info["NON_ASCII_USERNAME"] = True
        updated_true += 1
        # Get the current timestamp for each update
        current_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(
            f"[{current_timestamp}] Username for {username} is non-ASCII, NON_ASCII_USERNAME set to True."
        )

# Get the current timestamp for the final summary
current_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Print the summary of updates with the current timestamp
print(
    f"[{current_timestamp}] {updated_true} accounts updated with NON_ASCII_USERNAME set to True."
)
print(
    f"[{current_timestamp}] {updated_false} accounts updated with NON_ASCII_USERNAME set to False."
)

# Save the updated data back to the file
with open("../Compromised-Discord-Accounts.json", "w") as file:
    json.dump(data, file, indent=4)
