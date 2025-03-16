import json
import os
import time
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv("../.env")

URLSCAN_API_KEY = os.getenv("URLSCAN_API_TOKEN")
if not URLSCAN_API_KEY:
    raise ValueError("URLSCAN_API_TOKEN not found in environment variables")

EXCLUDED_DOMAINS = set(os.getenv("EXCLUDED_DOMAINS", "").split(","))
RATE_LIMIT = int(os.getenv("URLSCAN_RATE_LIMIT", 4))  # Requests per minute

URLSCAN_SUBMIT_URL = "https://urlscan.io/api/v1/scan/"
URLSCAN_RESULT_URL = "https://urlscan.io/api/v1/result/"
HEADERS = {"API-Key": URLSCAN_API_KEY, "Content-Type": "application/json"}

# Load the JSON data
json_path = "../Compromised-Discord-Accounts.json"

with open(json_path, "r", encoding="utf-8") as file:
    data = json.load(file)


def log(message):
    """Prints a message with a timestamp."""
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    print(f"{timestamp} {message}")


def save_json():
    """Saves the current data to the JSON file."""
    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)
    log("JSON file updated.")


def get_final_url(url):
    """Submits URL to URLScan and retrieves final URL from the redirection chain."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()

    if domain in EXCLUDED_DOMAINS:
        return url

    try:
        log(f"Submitting URL to URLScan: {url}")

        # Submit the URL for scanning
        submit_data = {
            "url": url,
            "visibility": "public",
        }

        submit_response = requests.post(
            URLSCAN_SUBMIT_URL, headers=HEADERS, json=submit_data
        )

        # Handle DNS resolution errors as inactive domains
        if submit_response.status_code == 400:
            response_json = submit_response.json()
            error_message = response_json.get("message", "")
            if (
                "DNS Error" in error_message
                or "could not resolve domain" in error_message.lower()
            ):
                log(f"Domain cannot be resolved. Marking as INACTIVE: {url}")
                return url  # Return original URL, which will be marked as INACTIVE

            # Log other 400 errors for debugging
            log(
                f"URLScan API error: {submit_response.status_code} - {submit_response.text}"
            )
            return url

        # Handle 404 status codes as inactive domains
        if submit_response.status_code == 404:
            log(f"URL returned 404 status. Marking as INACTIVE: {url}")
            return url  # Return original URL, which will be marked as INACTIVE

        submit_response.raise_for_status()

        scan_uuid = submit_response.json().get("uuid")
        if not scan_uuid:
            log(f"No scan UUID returned for {url}, keeping as is.")
            return url

        # Wait for scan to complete (typically takes 10-30 seconds)
        log(f"Scan submitted successfully. UUID: {scan_uuid}. Waiting for results...")
        time.sleep(30)  # Wait 30 seconds for the scan to complete

        # Retrieve the results
        result_response = requests.get(
            f"{URLSCAN_RESULT_URL}{scan_uuid}/", headers=HEADERS
        )

        if result_response.status_code == 404:
            log(f"Scan results not ready or not found for {url}, trying again...")
            time.sleep(15)  # Wait a bit more
            result_response = requests.get(
                f"{URLSCAN_RESULT_URL}{scan_uuid}/", headers=HEADERS
            )

        if result_response.status_code != 200:
            log(f"Failed to retrieve results for {url}, keeping as is.")
            return url

        result_data = result_response.json()

        # Check if the scan detected a 404 response in the page status
        page = result_data.get("page", {})
        status_code = page.get("statusCode")
        if status_code == 404:
            log(f"URL returned 404 status in scan results. Marking as INACTIVE: {url}")
            return url  # Return original URL, which will be marked as INACTIVE

        # Extract final URL from the redirection chain
        # URLScan stores this information in data.requests
        requests_data = result_data.get("data", {}).get("requests", [])

        if not requests_data:
            log(f"No request data for {url}, keeping as is.")
            return url

        # Get the last request URL
        final_url = url  # Default to original URL
        for request in requests_data:
            request_url = request.get("request", {}).get("url", "")
            if request_url:
                final_url = request_url

        log(f"Final URL found: {final_url}")
        return final_url

    except requests.RequestException as e:
        log(f"Error checking {url}: {e}")
        return url


# Process each account entry with rate limiting
log("Starting URLScan URL check...")

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

    # Check if the final URL is different from the surface URL (i.e., there was a redirect)
    if final_url_domain != urlparse(surface_url).netloc:
        # If there was a redirect, check if the final URL returns a 404 or 400
        if final_url_domain == urlparse(surface_url).netloc:
            # No redirect, but no 400 or 404, mark as ACTIVE
            details["SURFACE_URL_STATUS"] = "ACTIVE"
            details["FINAL_URL_STATUS"] = "ACTIVE"
            log(f"No Redirect but no 400/404. Marking as ACTIVE.")
            total_active += 1
        else:
            # There was a redirect, check if the final URL returns a 404 or 400
            try:
                final_response = requests.get(final_url)
                if final_response.status_code in [400, 404]:
                    details["SURFACE_URL_STATUS"] = "ACTIVE"
                    details["FINAL_URL_STATUS"] = "INACTIVE"
                    log(
                        f"Redirect detected but final URL is INACTIVE. Marking surface URL as ACTIVE."
                    )
                    total_active += 1
                else:
                    details["SURFACE_URL_STATUS"] = "ACTIVE"
                    details["FINAL_URL_STATUS"] = "ACTIVE"
                    log(
                        f"Redirect detected and final URL is ACTIVE. Marking as ACTIVE."
                    )
                    total_active += 1
            except requests.RequestException:
                details["SURFACE_URL_STATUS"] = "ACTIVE"
                details["FINAL_URL_STATUS"] = "INACTIVE"
                log(
                    f"Redirect detected but final URL is INACTIVE. Marking surface URL as ACTIVE."
                )
                total_active += 1
    else:
        # No redirect, check if the URL returns a 400 or 404
        try:
            surface_response = requests.get(surface_url)
            if surface_response.status_code in [400, 404]:
                details["SURFACE_URL_STATUS"] = "INACTIVE"
                details["FINAL_URL_STATUS"] = "INACTIVE"
                log(f"No Redirect and URL is INACTIVE. Marking as INACTIVE.")
                total_inactive += 1
            else:
                details["SURFACE_URL_STATUS"] = "ACTIVE"
                details["FINAL_URL_STATUS"] = "ACTIVE"
                log(f"No Redirect but no 400/404. Marking as ACTIVE.")
                total_active += 1
        except requests.RequestException:
            details["SURFACE_URL_STATUS"] = "INACTIVE"
            details["FINAL_URL_STATUS"] = "INACTIVE"
            log(f"No Redirect and URL is INACTIVE. Marking as INACTIVE.")
            total_inactive += 1

    # Save after each update
    save_json()

    # Respect rate limit
    if request_count >= RATE_LIMIT:
        log(f"Rate limit reached ({RATE_LIMIT} requests). Waiting 60 seconds...")
        time.sleep(60)
        request_count = 0  # Reset the request count after the wait

# Print final statistics
log("Finished processing. All results have been saved to the JSON file.")
log("Final Statistics:")
excluded_plural = "s" if total_excluded != 1 else ""
log(f"- Total accounts skipped: {total_excluded} account{excluded_plural}")
active_plural = "s" if total_active != 1 else ""
log(f"- URLs flagged as ACTIVE: {total_active} account{active_plural}")
inactive_plural = "s" if total_inactive != 1 else ""
log(f"- URLs flagged as INACTIVE: {total_inactive} account{inactive_plural}")
log(f"- Total accounts processed: {total_active + total_inactive}")
