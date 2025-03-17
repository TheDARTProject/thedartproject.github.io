import json
import requests
import time
from dotenv import load_dotenv
import os
from datetime import datetime

# Load API key and rate limit from .env file
load_dotenv("../.env")
API_KEY = os.getenv("IPINFO_API_TOKEN")
RATE_LIMIT = int(os.getenv("IPINFO_RATE_LIMIT", 60))  # Default to 60 if not specified

# Define the input file
INPUT_FILE = "Compromised-Discord-Accounts.json"
IPINFO_URL = "https://ipinfo.io/"

# Domains that should be automatically set to US
AUTO_US_DOMAINS = {"discord.com", "discord.gg", "steamcommunity.com", "funpay.com", "mediafire.com", "t.me",
                   "telegram.com", "telegra.ph"}


def log(message):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


def get_geolocation(domain):
    if domain in AUTO_US_DOMAINS:
        log(f"Skipping API call for {domain}, setting to US")
        return "US"

    try:
        log(f"Querying ipinfo.io for {domain}")
        response = requests.get(f"{IPINFO_URL}{domain}/json", params={"token": API_KEY})
        data = response.json()
        country = data.get("country", "UNKNOWN")
        log(f"Received response for {domain}: {country}")
        return country
    except requests.RequestException as e:
        log(f"Error querying {domain}: {e}")
        return "UNKNOWN"


def update_compromised_accounts():
    with open(INPUT_FILE, "r", encoding="utf-8") as file:
        accounts = json.load(file)

    total_cases = len(accounts)
    updated_count = 0
    unknown_count = 0
    skipped_count = 0
    request_counter = 0

    log(f"Found {total_cases} cases in {INPUT_FILE}")

    for account_id, details in accounts.items():
        final_url_domain = details.get("FINAL_URL_DOMAIN", "")
        if final_url_domain:
            country = get_geolocation(final_url_domain)
            accounts[account_id]["SUSPECTED_REGION_OF_ORIGIN"] = country

            if country == "US":
                skipped_count += 1
            elif country == "UNKNOWN":
                unknown_count += 1
            else:
                updated_count += 1

            log(f"Updated {account_id}: {final_url_domain} -> {country}")

            # Save progress after each update
            with open(INPUT_FILE, "w", encoding="utf-8") as file:
                json.dump(accounts, file, indent=4)

            request_counter += 1
            if request_counter >= RATE_LIMIT:
                log(f"Reached API rate limit ({RATE_LIMIT} per minute), sleeping for 60 seconds...")
                time.sleep(60)
                request_counter = 0
            else:
                time.sleep(60 / RATE_LIMIT)  # Distribute requests evenly

    log(f"Update complete: {updated_count} updated, {unknown_count} set to UNKNOWN, {skipped_count} auto-set to US")


if __name__ == "__main__":
    update_compromised_accounts()
