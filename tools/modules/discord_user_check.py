import json
import requests
import time
import logging
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
DISCORD_USERS_RATE_LIMIT = int(
    os.getenv("DISCORD_USERS_RATE_LIMIT", 10)
)  # Requests per minute

# Set up the logger for nice prints
logging.basicConfig(level=logging.INFO, format="%(message)s")


def log_message(message):
    """Print formatted log messages."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")


def check_discord_username(discord_id, expected_username):
    """Check the current username for a given Discord ID using the Discord API."""
    url = f"https://discord.com/api/v10/users/{discord_id}"
    headers = {"Authorization": f"Bot {DISCORD_TOKEN}"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        user_data = response.json()
        current_username = user_data["username"]

        if current_username == expected_username:
            log_message(
                f"Username for Discord ID {discord_id} is correct: {expected_username}"
            )
            return None  # Username is correct, no update needed

        elif current_username.startswith("deleted_user"):
            log_message(
                f"User with Discord ID {discord_id} has been deleted. Updating status."
            )
            return current_username  # Return deleted username format

        else:
            log_message(
                f"Username for Discord ID {discord_id} has changed from {expected_username} to {current_username}. Updating."
            )
            return current_username  # Return new username

    else:
        log_message(
            f"Error retrieving user data for Discord ID {discord_id}: {response.status_code}"
        )
        return None


def update_json_file(file_path, updated_data):
    """Update the JSON file with the corrected information."""
    try:
        with open(file_path, "w") as file:
            json.dump(updated_data, file, indent=4)
        log_message("Updated JSON file with new data.")
    except Exception as e:
        log_message(f"Error updating JSON file: {e}")


def load_json_file(file_path):
    """Load the JSON file, handling potential file not found errors."""
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        log_message(f"File {file_path} not found. Creating a new file.")
        return {}
    except json.JSONDecodeError:
        log_message(f"Error decoding JSON in {file_path}. Creating a new file.")
        return {}
    except Exception as e:
        log_message(f"Error loading JSON file: {e}")
        return {}


def main():
    file_path = "../Compromised-Discord-Accounts.json"

    try:
        data = load_json_file(file_path)
        log_message(f"Found {len(data)} accounts in the JSON file.")

        if not DISCORD_TOKEN:
            log_message(
                "DISCORD_TOKEN not found in the environment variables. Exiting."
            )
            return

        log_message(
            f"Rate limit found: {DISCORD_USERS_RATE_LIMIT} requests per minute."
        )

        # Ask the user whether to scan fully or start from a specific case
        choice = (
            input(
                "Do you want to scan the full file or start from a specific case? (full/start): "
            )
            .strip()
            .lower()
        )
        start_index = 0

        if choice == "start":
            try:
                start_index = int(
                    input("Enter the case number to start from: ").strip()
                )
            except ValueError:
                log_message("Invalid input. Starting from the beginning.")
                start_index = 0

        accounts_updated = 0
        for index, (account_number, account_data) in enumerate(list(data.items())):
            if index < start_index:
                continue  # Skip cases before the chosen start point

            discord_id = account_data["DISCORD_ID"]
            expected_username = account_data["USERNAME"]

            log_message(
                f"Checking account {account_number}: {discord_id} ({expected_username})"
            )

            updated_username_or_status = check_discord_username(
                discord_id, expected_username
            )

            # Only update if the username has changed
            if (
                updated_username_or_status
                and updated_username_or_status != expected_username
            ):
                account_data["USERNAME"] = updated_username_or_status
                accounts_updated += 1

                # Always update the deleted status regardless of previous status
                if updated_username_or_status.startswith("deleted_user"):
                    account_data["ACCOUNT_STATUS"] = "DELETED"

                # Live update the file after each change
                update_json_file(file_path, data)
                log_message(f"Live updated file for account {account_number}")
            else:
                log_message(f"No update needed for account {account_number}")

            # Sleep to respect the rate limit
            time.sleep(60 / DISCORD_USERS_RATE_LIMIT)

        log_message(f"Scan complete. Updated {accounts_updated} accounts.")

    except Exception as e:
        log_message(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
