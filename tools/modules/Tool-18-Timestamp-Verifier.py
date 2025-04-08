import json
from datetime import datetime


def print_with_timestamp(message):
    # Current timestamp for printing in [YYYY-MM-DD HH:MM:SS] format
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


# Load the JSON file
with open("../Compromised-Discord-Accounts.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Get the current timestamp in ISO format for the file
current_timestamp = datetime.utcnow().isoformat()

# Initialize counters
total_accounts = len(data)
missing_field_count = 0
empty_field_count = 0

# Iterate over accounts and add LAST_CHECK if missing or empty
for account in data.values():
    if "LAST_CHECK" not in account:
        missing_field_count += 1
        account["LAST_CHECK"] = current_timestamp
    elif not account["LAST_CHECK"]:
        empty_field_count += 1
        account["LAST_CHECK"] = current_timestamp

# Save the updated JSON file
with open("../Compromised-Discord-Accounts.json", "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4, ensure_ascii=False)

# Print summary of actions
print_with_timestamp(f"Total accounts processed: {total_accounts}")
print_with_timestamp(f"Accounts missing 'LAST_CHECK' field: {missing_field_count}")
print_with_timestamp(f"Accounts with empty 'LAST_CHECK' field: {empty_field_count}")
print_with_timestamp("Timestamps added successfully!")
