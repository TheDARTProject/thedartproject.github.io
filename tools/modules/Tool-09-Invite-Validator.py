import os
import json
import time
from datetime import datetime
import requests
from urllib.parse import urlparse


# Load environment variables
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), "../.env")
    env_vars = {}
    try:
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(".env file not found. Using default values.")
        env_vars["PROXY_URL"] = "https://api.codetabs.com/v1/proxy/?quest="
        env_vars["DISCORD_INVITE_RATE_LIMIT"] = "20"
    return env_vars


env_vars = load_env()

# Configuration
PROXY_URL = env_vars.get("PROXY_URL", "https://api.codetabs.com/v1/proxy/?quest=")
RATE_LIMIT = int(env_vars.get("DISCORD_INVITE_RATE_LIMIT", 20))
JSON_FILE_PATH = os.path.join(
    os.path.dirname(__file__), "../Compromised-Discord-Accounts.json"
)
PRINT_RESPONSE = True  # Set to True to see full API responses

# Discord API endpoint
DISCORD_API_URL = (
    "https://discord.com/api/v10/invites/{}?with_counts=true&with_expiration=true"
)


def extract_invite_code(url):
    """Extract invite code from Discord URL"""
    parsed = urlparse(url)
    if parsed.netloc == "discord.gg":
        return parsed.path.lstrip("/")
    elif parsed.netloc == "discord.com":
        if parsed.path.startswith("/invite/"):
            return parsed.path.split("/")[2]
    return None


def check_invite(invite_code):
    """Check if a Discord invite is active"""
    url = DISCORD_API_URL.format(invite_code)
    proxy_url = PROXY_URL + url if PROXY_URL else url

    try:
        response = requests.get(proxy_url, timeout=10)
        if PRINT_RESPONSE:
            print(
                f"API Response for {invite_code}: {response.status_code} - {response.text}"
            )

        if response.status_code == 200:
            # Check if the response indicates an unknown invite
            try:
                data = response.json()
                if (
                    data.get("code") == 10006
                    and data.get("message") == "Unknown Invite"
                ):
                    return False, f"https://discord.com/invite/{invite_code}"
                # If we got valid guild data, the invite is active
                if "guild" in data:
                    return True, f"https://discord.com/invite/{invite_code}"
            except ValueError:
                pass
            return False, f"https://discord.com/invite/{invite_code}"
        else:
            return False, f"https://discord.com/invite/{invite_code}"
    except Exception as e:
        if PRINT_RESPONSE:
            print(f"Error checking invite {invite_code}: {str(e)}")
        return False, f"https://discord.com/invite/{invite_code}"


def get_starting_point(total_accounts):
    """Ask user whether to do full scan or start from specific account number"""
    while True:
        print("\n" + "=" * 50)
        print(f"Total accounts in file: {total_accounts}")
        print("1. Full scan (process all accounts)")
        print("2. Start from specific account number")
        print("=" * 50)

        choice = input("Enter your choice (1 or 2): ").strip()

        if choice == "1":
            return 0  # Start from beginning
        elif choice == "2":
            while True:
                try:
                    start_num = int(
                        input(f"Enter starting account number (1-{total_accounts}): ")
                    )
                    if 1 <= start_num <= total_accounts:
                        return start_num - 1  # Convert to 0-based index
                    print(f"Please enter a number between 1 and {total_accounts}")
                except ValueError:
                    print("Please enter a valid number")
        else:
            print("Invalid choice. Please enter 1 or 2")


def process_accounts():
    """Process all accounts in the JSON file"""
    try:
        with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: JSON file not found at {JSON_FILE_PATH}")
        return
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in file {JSON_FILE_PATH}")
        return

    total_accounts = len(data)
    if total_accounts == 0:
        print("No accounts found in the JSON file.")
        return

    # Get user's choice for scanning
    start_index = get_starting_point(total_accounts)

    processed = 0
    updated_accounts = 0
    skipped_accounts = 0

    # Calculate delay between requests to evenly distribute them
    if RATE_LIMIT > 0:
        request_delay = 60.0 / RATE_LIMIT  # Spread requests evenly over a minute
    else:
        request_delay = 0

    print(f"\nStarting processing of accounts...")
    print(f"Starting from account number: {start_index + 1}")
    print(f"Rate limit configured: {RATE_LIMIT} requests/minute")
    print(f"Request delay: {request_delay:.2f} seconds between requests")

    # Convert dict to list of items for easier slicing
    accounts_items = list(data.items())

    for i in range(start_index, total_accounts):
        account_id, account_data = accounts_items[i]
        processed += 1
        surface_url = account_data.get("SURFACE_URL", "")
        surface_domain = account_data.get("SURFACE_URL_DOMAIN", "")

        # Skip if not a Discord invite URL
        if not (
            surface_domain in ["discord.gg", "discord.com"]
            and surface_url.startswith(("http://", "https://"))
        ):
            print(
                f"[{i+1}/{total_accounts}] Skipping {account_id}: Not a Discord invite URL"
            )
            skipped_accounts += 1
            continue

        invite_code = extract_invite_code(surface_url)
        if not invite_code:
            print(
                f"[{i+1}/{total_accounts}] Skipping {account_id}: Could not extract invite code from URL"
            )
            skipped_accounts += 1
            continue

        print(
            f"[{i+1}/{total_accounts}] Processing {account_id}: Checking invite {invite_code}"
        )

        # Check invite status
        start_time = time.time()
        is_active, final_url = check_invite(invite_code)

        # Update account data
        status = "ACTIVE" if is_active else "INACTIVE"
        account_data["SURFACE_URL_STATUS"] = status
        account_data["FINAL_URL"] = final_url
        account_data["FINAL_URL_DOMAIN"] = "discord.com"
        account_data["FINAL_URL_STATUS"] = status
        account_data["LAST_CHECK"] = datetime.utcnow().isoformat()

        updated_accounts += 1
        print(f"Updated {account_id}: Status = {status}")

        # Write changes after each check to prevent data loss
        try:
            with open(JSON_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print("Changes saved to file")
        except Exception as e:
            print(f"Error saving changes to file: {str(e)}")

        # Calculate time taken for the request and adjust delay
        request_time = time.time() - start_time
        remaining_delay = max(0, request_delay - request_time)
        if remaining_delay > 0:
            print(f"Waiting {remaining_delay:.2f} seconds to maintain rate limit...")
            time.sleep(remaining_delay)

    print(f"\nProcessing complete!")
    print(f"Total accounts: {total_accounts}")
    print(f"Processed: {processed}")
    print(f"Updated: {updated_accounts}")
    print(f"Skipped: {skipped_accounts}")


if __name__ == "__main__":
    process_accounts()
