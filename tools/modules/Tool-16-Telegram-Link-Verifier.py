import json
import requests
from datetime import datetime
from urllib.parse import urlparse


def print_header(message):
    """Print a formatted header message."""
    print("\n" + "=" * 50)
    print(f" {message.upper()} ".center(50, "="))
    print("=" * 50)


def print_status(url, status):
    """Print the status of a URL check."""
    domain = urlparse(url).netloc
    status_color = (
        "\033[92mACTIVE\033[0m" if status == "ACTIVE" else "\033[91mINACTIVE\033[0m"
    )
    print(f"• Checking: {url}")
    print(f"  Domain: {domain}")
    print(f"  Status: {status_color}")
    print("-" * 50)


def check_telegram_link(url):
    """Checks if a Telegram group link is active using web scraping."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200 and "t.me" in response.url:
            return "ACTIVE"
        else:
            return "INACTIVE"
    except requests.exceptions.RequestException as e:
        print(f"  Error: {str(e)}")
        return "INACTIVE"


def main():
    print_header("starting telegram link checker")

    # Load the JSON file
    print("\nLoading JSON file...")
    try:
        with open(
            "../Compromised-Discord-Accounts.json", "r", encoding="utf-8"
        ) as file:
            data = json.load(file)
        print(f"Successfully loaded {len(data)} accounts.")
    except Exception as e:
        print(f"\033[91mError loading JSON file: {str(e)}\033[0m")
        return

    # Count Telegram links
    telegram_accounts = [
        acc for acc in data.values() if "t.me" in acc.get("SURFACE_URL_DOMAIN", "")
    ]
    print(f"\nFound {len(telegram_accounts)} accounts with Telegram links to check.")

    # Iterate over each account and check t.me links
    print_header("checking telegram links")
    checked_count = 0
    for account_id, account in data.items():
        if "t.me" in account.get("SURFACE_URL_DOMAIN", ""):
            checked_count += 1
            url = account["SURFACE_URL"]
            print(f"\nAccount ID: {account_id}")

            # Check link
            new_status = check_telegram_link(url)
            print_status(url, new_status)

            # Update account data
            account["SURFACE_URL_STATUS"] = new_status
            account["FINAL_URL_STATUS"] = new_status
            account["LAST_CHECK"] = datetime.utcnow().isoformat()
            print(f"  Updated account record.")

    # Save updated JSON file
    print_header("saving results")
    try:
        with open(
            "../Compromised-Discord-Accounts.json", "w", encoding="utf-8"
        ) as file:
            json.dump(data, file, indent=4)
        print(f"\nSuccessfully saved results for {checked_count} accounts.")
    except Exception as e:
        print(f"\033[91mError saving JSON file: {str(e)}\033[0m")

    print_header("process completed")
    print(f"\nFinished checking {checked_count} Telegram links.\n")


if __name__ == "__main__":
    main()
