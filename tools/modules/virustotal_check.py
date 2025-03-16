import json
import os
import time
import base64
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv("../.env")

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_TOKEN")
EXCLUDED_DOMAINS = set(os.getenv("EXCLUDED_DOMAINS", "").split(","))
RATE_LIMIT = int(os.getenv("VIRUSTOTAL_RATE_LIMIT", 4))  # Requests per minute

VT_URL = "https://www.virustotal.com/api/v3/urls"
HEADERS = {"x-apikey": VIRUSTOTAL_API_KEY}

# Load the JSON data
json_path = "../Compromised-Discord-Accounts.json"

with open(json_path, "r", encoding="utf-8") as file:
    data = json.load(file)


def log(message):
    """Prints a message with a timestamp."""
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


def encode_url(url):
    """Encodes the URL in base64 (without padding) for VirusTotal API requests."""
    return base64.urlsafe_b64encode(url.encode()).decode().strip("=")


def get_final_url(url):
    """Fetches the redirection chain from VirusTotal."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()

    if domain in EXCLUDED_DOMAINS:
        return url

    try:
        # Base64-encode URL
        encoded_url = encode_url(url)

        log(f"Checking URL on VirusTotal: {url}")

        # Query VirusTotal for URL analysis
        response = requests.get(f"{VT_URL}/{encoded_url}", headers=HEADERS)

        if response.status_code == 404:
            log(f"No VirusTotal data for {url}, keeping as is.")
            return url

        response.raise_for_status()
        json_response = response.json()

        # Extract final redirection URL
        last_url = json_response["data"]["attributes"].get("last_final_url", url)

        log(f"Final URL found: {last_url}")
        return last_url

    except requests.RequestException as e:
        log(f"Error checking {url}: {e}")
        return url


# Process each account entry with rate limiting
log("Starting VirusTotal URL check...")

# Count the total number of cases
total_cases = len(data)
log(f"Total cases: {total_cases}")

# Count non-excluded URLs
non_excluded_count = sum(
    1
    for details in data.values()
    if details.get("SURFACE_URL", "")
    and urlparse(details.get("SURFACE_URL", "")).netloc not in EXCLUDED_DOMAINS
)
log(f"Cases to process (non-excluded URLs): {non_excluded_count}")

request_count = 0  # Initialize the request count
excluded_count = 0  # For counting excluded domains between processed accounts
total_excluded = 0  # For overall statistics
total_active = 0  # Count of active URLs
total_inactive = 0  # Count of inactive URLs

# Convert data.items() to a list to make it iterable multiple times
items = list(data.items())

for i, (account, details) in enumerate(items):
    surface_url = details.get("SURFACE_URL", "")
    if not surface_url:
        continue

    if urlparse(surface_url).netloc in EXCLUDED_DOMAINS:
        excluded_count += 1
        total_excluded += 1

        # Check if next item is also excluded or if this is the last item
        next_is_excluded = False
        if i + 1 < len(items):
            next_account, next_details = items[i + 1]
            next_url = next_details.get("SURFACE_URL", "")
            if next_url and urlparse(next_url).netloc in EXCLUDED_DOMAINS:
                next_is_excluded = True

        # Only print excluded count when we're about to process a non-excluded account
        # or if this is the last item
        if not next_is_excluded or i + 1 == len(items):
            plural = "s" if excluded_count != 1 else ""
            log(f"Skipping {excluded_count} account{plural} with excluded domains")
            excluded_count = 0  # Reset counter
        continue

    log(f"Processing Account: {account} | URL: {surface_url}")

    # Only apply the rate limit for URLs that are actually sent through the API
    request_count += 1

    final_url = get_final_url(surface_url)
    final_url_domain = urlparse(final_url).netloc

    # Update JSON data
    details["FINAL_URL"] = final_url
    details["FINAL_URL_DOMAIN"] = final_url_domain

    if final_url_domain != urlparse(surface_url).netloc:
        details["SURFACE_URL_STATUS"] = "ACTIVE"
        details["FINAL_URL_STATUS"] = "ACTIVE"
        log(f"URL Redirect Detected! Marking as ACTIVE.")
        total_active += 1
    else:
        details["SURFACE_URL_STATUS"] = "INACTIVE"
        details["FINAL_URL_STATUS"] = "INACTIVE"
        log(f"No Redirect. Marking as INACTIVE.")
        total_inactive += 1

    # Respect rate limit
    if request_count >= RATE_LIMIT:
        log(f"Rate limit reached ({RATE_LIMIT} requests). Waiting 60 seconds...")
        time.sleep(60)
        request_count = 0  # Reset the request count after the wait

# Save the updated data
with open(json_path, "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)

# Print final statistics
log("Finished processing. JSON file updated with VirusTotal results.")
log("Final Statistics:")
excluded_plural = "s" if total_excluded != 1 else ""
log(f"- Total accounts skipped: {total_excluded} account{excluded_plural}")
active_plural = "s" if total_active != 1 else ""
log(f"- URLs flagged as ACTIVE: {total_active} account{active_plural}")
inactive_plural = "s" if total_inactive != 1 else ""
log(f"- URLs flagged as INACTIVE: {total_inactive} account{inactive_plural}")
log(f"- Total accounts processed: {total_active + total_inactive}")
