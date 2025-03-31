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
    processed = 0
    updated_accounts = 0
    skipped_accounts = 0
    rate_limit_counter = 0

    print(f"Starting processing of {total_accounts} accounts...")

    for account_id, account_data in data.items():
        processed += 1
        surface_url = account_data.get("SURFACE_URL", "")
        surface_domain = account_data.get("SURFACE_URL_DOMAIN", "")

        # Skip if not a Discord invite URL
        if not (
            surface_domain in ["discord.gg", "discord.com"]
            and surface_url.startswith(("http://", "https://"))
        ):
            print(
                f"[{processed}/{total_accounts}] Skipping {account_id}: Not a Discord invite URL"
            )
            skipped_accounts += 1
            continue

        invite_code = extract_invite_code(surface_url)
        if not invite_code:
            print(
                f"[{processed}/{total_accounts}] Skipping {account_id}: Could not extract invite code from URL"
            )
            skipped_accounts += 1
            continue

        print(
            f"[{processed}/{total_accounts}] Processing {account_id}: Checking invite {invite_code}"
        )

        # Check rate limit
        if rate_limit_counter >= RATE_LIMIT:
            print(
                f"Rate limit reached ({RATE_LIMIT} requests/min). Waiting 60 seconds..."
            )
            time.sleep(60)
            rate_limit_counter = 0

        # Check invite status
        is_active, final_url = check_invite(invite_code)
        rate_limit_counter += 1

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

    print(f"\nProcessing complete!")
    print(f"Total accounts: {total_accounts}")
    print(f"Processed: {processed}")
    print(f"Updated: {updated_accounts}")
    print(f"Skipped: {skipped_accounts}")


if __name__ == "__main__":
    process_accounts()
