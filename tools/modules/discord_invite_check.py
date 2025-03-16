import json
import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import time
from urllib.parse import urlparse  # Add this import

# Load environment variables from .env file in the parent directory
env_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
)
load_dotenv(env_path)

# Discord bot token from .env file
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")

if not DISCORD_TOKEN:
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ERROR: Discord token not found in the .env file. Exiting."
    )
    exit()

DISCORD_INVITE_RATE_LIMIT = os.getenv("DISCORD_INVITE_RATE_LIMIT", 10)
try:
    DISCORD_INVITE_RATE_LIMIT = int(DISCORD_INVITE_RATE_LIMIT)
except ValueError:
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ERROR: Invalid rate limit value in .env. Using default of 10."
    )
    DISCORD_INVITE_RATE_LIMIT = 10

headers = {"Authorization": f"Bot {DISCORD_TOKEN}"}


# Function to check if a URL belongs to Discord
def is_valid_discord_invite(url):
    try:
        parsed_url = urlparse(url)
        return parsed_url.netloc in {"discord.gg", "discord.com"}
    except Exception:
        return False


# Function to check invite validity
def check_invite_validity(invite_url):
    invite_code = invite_url.split("/")[-1]
    url = f"https://discord.com/api/v10/invites/{invite_code}"

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        print(
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Invite {invite_url} is valid."
        )
        return True
    elif response.status_code == 404:
        print(
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Invite {invite_url} is invalid or expired."
        )
        return False
    else:
        print(
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error checking invite {invite_url}: {response.status_code}"
        )
        return False


# Update invite statuses in JSON
def update_invite_status():
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Loading compromised account data..."
    )

    with open("../Compromised-Discord-Accounts.json", "r") as f:
        accounts_data = json.load(f)

    total_accounts = len(accounts_data)
    valid_accounts = sum(
        1
        for details in accounts_data.values()
        if is_valid_discord_invite(details.get("SURFACE_URL", ""))
    )

    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Total accounts: {total_accounts}"
    )
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Accounts with valid Discord URLs: {valid_accounts}"
    )

    request_delay = 60 / DISCORD_INVITE_RATE_LIMIT
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Request delay set to {request_delay:.2f} seconds."
    )

    for account, details in accounts_data.items():
        surface_url = details.get("SURFACE_URL", "")
        final_url = details.get("FINAL_URL", "")

        if is_valid_discord_invite(surface_url):
            print(
                f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking Discord URLs for account {account}"
            )
            print(
                f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking Surface URL: {surface_url}"
            )

            surface_valid = check_invite_validity(surface_url)
            new_surface_status = "ACTIVE" if surface_valid else "INACTIVE"

            if (
                final_url
                and final_url != surface_url
                and is_valid_discord_invite(final_url)
            ):
                print(
                    f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking Final URL: {final_url}"
                )
                final_valid = check_invite_validity(final_url)
                new_final_status = "ACTIVE" if final_valid else "INACTIVE"
            else:
                new_final_status = new_surface_status

            details["SURFACE_URL_STATUS"] = new_surface_status
            details["FINAL_URL_STATUS"] = new_final_status

            print(
                f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Saving updated account data for {account}..."
            )
            with open("../Compromised-Discord-Accounts.json", "w") as f:
                json.dump(accounts_data, f, indent=4)

            print(
                f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Sleeping for {request_delay:.2f} seconds..."
            )
            time.sleep(request_delay)

        else:
            print(
                f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Skipping account {account} - No valid Discord URL found."
            )


if __name__ == "__main__":
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting invite status check..."
    )
    update_invite_status()
