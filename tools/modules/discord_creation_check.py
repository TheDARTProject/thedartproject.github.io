import json
import logging
from datetime import datetime

# Set up the logger
logging.basicConfig(level=logging.INFO, format="%(message)s")


def log_message(message):
    """Print formatted log messages."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")


def get_account_creation_date(discord_id):
    """Extract the account creation date from the Discord ID."""
    try:
        creation_timestamp = ((int(discord_id) >> 22) + 1420070400000) / 1000
        return datetime.utcfromtimestamp(creation_timestamp).strftime("%Y-%m-%d")
    except ValueError:
        log_message(f"Invalid Discord ID format: {discord_id}")
        return None


def update_json_file(file_path, data):
    """Update the JSON file with new data."""
    try:
        with open(file_path, "w") as file:
            json.dump(data, file, indent=4)
        log_message("Updated JSON file with new data.")
    except Exception as e:
        log_message(f"Error updating JSON file: {e}")


def load_json_file(file_path):
    """Load the JSON file, handling errors."""
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        log_message(f"Error loading JSON file {file_path}. Creating a new file.")
        return {}


def main():
    file_path = "../Compromised-Discord-Accounts.json"
    data = load_json_file(file_path)
    log_message(f"Found {len(data)} accounts in the JSON file.")

    accounts_updated = 0
    for account_number, account_data in data.items():
        discord_id = account_data.get("DISCORD_ID")
        if not discord_id:
            log_message(f"Skipping account {account_number}: No DISCORD_ID found.")
            continue

        creation_date = get_account_creation_date(discord_id)
        if creation_date and "ACCOUNT_CREATION" not in account_data:
            ordered_data = {}
            for key, value in account_data.items():
                ordered_data[key] = value
                if key == "ACCOUNT_TYPE":
                    ordered_data["ACCOUNT_CREATION"] = creation_date
            data[account_number] = ordered_data
            accounts_updated += 1

    if accounts_updated > 0:
        update_json_file(file_path, data)
        log_message(f"Check complete. Updated {accounts_updated} accounts.")
    else:
        log_message("No accounts needed updating.")


if __name__ == "__main__":
    main()
