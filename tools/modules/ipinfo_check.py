import json
import requests
import time
from dotenv import load_dotenv
import os
from datetime import datetime
import socket  # Import the socket library

# Load API key and rate limit from .env file
load_dotenv("../.env")
API_KEY = os.getenv("IPINFO_API_TOKEN")
RATE_LIMIT = int(os.getenv("IPINFO_RATE_LIMIT", 60))  # Default to 60 if not specified

# Define the input file
INPUT_FILE = "../Compromised-Discord-Accounts.json"
IPINFO_URL = "https://ipinfo.io/"

# Domains that should be automatically set to US
AUTO_US_DOMAINS = {"discord.com", "discord.gg", "steamcommunity.com", "funpay.com", "mediafire.com", "t.me",
                   "telegram.com", "telegra.ph"}


def log(message):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


def resolve_ip(domain):
    try:
        # Resolve the domain to an IP address
        ip_address = socket.gethostbyname(domain)
        log(f"Resolved {domain} to IP: {ip_address}")
        return ip_address
    except socket.gaierror as e:
        log(f"Error resolving {domain} to IP: {e}")
        return None


def get_geolocation(domain):
    if domain in AUTO_US_DOMAINS:
        log(f"Skipping API call for {domain}, setting to US")
        return "US"

    # Resolve the domain to an IP address
    ip_address = resolve_ip(domain)
    if not ip_address:
        return "UNKNOWN"  # Skip to the next domain if IP resolution fails

    try:
        log(f"Querying ipinfo.io for IP: {ip_address}")
        response = requests.get(f"{IPINFO_URL}{ip_address}/json", params={"token": API_KEY})
        data = response.json()
        country = data.get("country", "UNKNOWN")
        log(f"Received response for {domain} (IP: {ip_address}): {country}")
        return country
    except requests.RequestException as e:
        log(f"Error querying {domain} (IP: {ip_address}): {e}")
        return "UNKNOWN"


def count_urls_to_check():
    with open(INPUT_FILE, "r", encoding="utf-8") as file:
        accounts = json.load(file)

    total_auto_us = 0
    total_other = 0

    for account_id, details in accounts.items():
        final_url_domain = details.get("FINAL_URL_DOMAIN", "")
        if final_url_domain:
            if final_url_domain in AUTO_US_DOMAINS:
                total_auto_us += 1
            else:
                total_other += 1

    log(f"Total URLs to check: {total_auto_us + total_other}")
    log(f"   URLs automatically set to US: {total_auto_us}")
    log(f"   URLs that will be checked: {total_other}")


def update_auto_us_domains(accounts):
    updated_count = 0
    for account_id, details in accounts.items():
        final_url_domain = details.get("FINAL_URL_DOMAIN", "")
        if final_url_domain in AUTO_US_DOMAINS:
            accounts[account_id]["SUSPECTED_REGION_OF_ORIGIN"] = "US"
            updated_count += 1
            log(f"Updated {account_id}: {final_url_domain} -> US")

    if updated_count > 0:
        with open(INPUT_FILE, "w", encoding="utf-8") as file:
            json.dump(accounts, file, indent=4)
        log(f"Updated {updated_count} cases with AUTO_US domains to US")


def update_compromised_accounts(start_from=0):
    with open(INPUT_FILE, "r", encoding="utf-8") as file:
        accounts = json.load(file)

    total_cases = len(accounts)
    updated_count = 0
    unknown_count = 0
    skipped_count = 0
    request_counter = 0

    log(f"Found {total_cases} cases in {INPUT_FILE}")

    # First, update all cases with AUTO_US domains
    update_auto_us_domains(accounts)

    # Then, process the rest with the API
    for i, (account_id, details) in enumerate(accounts.items()):
        if i < start_from:
            continue

        final_url_domain = details.get("FINAL_URL_DOMAIN", "")
        if final_url_domain and final_url_domain not in AUTO_US_DOMAINS:
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

            # Only increment the request counter and apply rate limiting if we actually queried the API
            if country != "UNKNOWN":
                request_counter += 1
                if request_counter >= RATE_LIMIT:
                    log(f"Reached API rate limit ({RATE_LIMIT} per minute), sleeping for 60 seconds...")
                    time.sleep(60)
                    request_counter = 0
                else:
                    time.sleep(60 / RATE_LIMIT)  # Distribute requests evenly

    log(f"Update complete: {updated_count} updated, {unknown_count} set to UNKNOWN, {skipped_count} auto-set to US")


if __name__ == "__main__":
    count_urls_to_check()  # Print the count before starting the update

    # Ask the user if they want to process the full file or start from a specific case number
    user_input = input("Do you want to process the full file (F) or start from a specific case number (S)? ").strip().lower()
    if user_input == "s":
        start_from = int(input("Enter the case number to start from: "))
        update_compromised_accounts(start_from)
    else:
        update_compromised_accounts()