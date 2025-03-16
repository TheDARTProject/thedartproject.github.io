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


def process_account(account, details, request_timestamps):
    """Process a single account and update its URL details."""
    surface_url = details.get("SURFACE_URL", "")
    if not surface_url:
        return False, request_timestamps

    if urlparse(surface_url).netloc in EXCLUDED_DOMAINS:
        return False, request_timestamps

    log(f"Processing Account: {account} | URL: {surface_url}")

    # Respect rate limit by checking timestamps
    current_time = time.time()
    # Remove timestamps older than 60 seconds
    while request_timestamps and current_time - request_timestamps[0] > 60:
        request_timestamps.pop(0)

    # If we've reached the rate limit, wait until enough time has passed
    if len(request_timestamps) >= RATE_LIMIT:
        wait_time = 60 - (current_time - request_timestamps[0])
        if wait_time > 0:
            log(f"Rate limit reached. Waiting {wait_time:.2f} seconds...")
            time.sleep(wait_time)

    # Add current request timestamp
    request_timestamps.append(time.time())

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
            return True, request_timestamps
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
                else:
                    details["SURFACE_URL_STATUS"] = "ACTIVE"
                    details["FINAL_URL_STATUS"] = "ACTIVE"
                    log(
                        f"Redirect detected and final URL is ACTIVE. Marking as ACTIVE."
                    )
                return True, request_timestamps
            except requests.RequestException:
                details["SURFACE_URL_STATUS"] = "ACTIVE"
                details["FINAL_URL_STATUS"] = "INACTIVE"
                log(
                    f"Redirect detected but final URL is INACTIVE. Marking surface URL as ACTIVE."
                )
                return True, request_timestamps
    else:
        # No redirect, check if the URL returns a 400 or 404
        try:
            surface_response = requests.get(surface_url)
            if surface_response.status_code in [400, 404]:
                details["SURFACE_URL_STATUS"] = "INACTIVE"
                details["FINAL_URL_STATUS"] = "INACTIVE"
                log(f"No Redirect and URL is INACTIVE. Marking as INACTIVE.")
                return False, request_timestamps
            else:
                details["SURFACE_URL_STATUS"] = "ACTIVE"
                details["FINAL_URL_STATUS"] = "ACTIVE"
                log(f"No Redirect but no 400/404. Marking as ACTIVE.")
                return True, request_timestamps
        except requests.RequestException:
            details["SURFACE_URL_STATUS"] = "INACTIVE"
            details["FINAL_URL_STATUS"] = "INACTIVE"
            log(f"No Redirect and URL is INACTIVE. Marking as INACTIVE.")
            return False, request_timestamps


# Main execution
def main():
    # Convert data.items() to a list to make it iterable multiple times
    items = list(data.items())

    # Ask user for run mode
    print("\n=== URLScan Check Tool ===")
    print("1. Complete run (process all accounts)")
    print("2. Start from specific account number")
    choice = input("Enter your choice (1 or 2): ")

    start_index = 0
    if choice == "2":
        total_accounts = len(items)
        print(f"There are {total_accounts} accounts in total.")
        while True:
            try:
                start_number = int(input(f"Enter starting account number (1-{total_accounts}): "))
                if 1 <= start_number <= total_accounts:
                    start_index = start_number - 1
                    break
                else:
                    print(f"Please enter a number between 1 and {total_accounts}.")
            except ValueError:
                print("Please enter a valid number.")

    log(f"Starting URLScan URL check from account #{start_index + 1}...")

    # Stats counters
    total_excluded = 0
    total_active = 0
    total_inactive = 0
    request_timestamps = []  # Track when requests were made for rate limiting

    # Process each account entry with proper rate limiting
    for i, (account, details) in enumerate(items[start_index:], start=start_index):
        surface_url = details.get("SURFACE_URL", "")
        if not surface_url:
            continue

        if urlparse(surface_url).netloc in EXCLUDED_DOMAINS:
            total_excluded += 1
            continue

        is_active, request_timestamps = process_account(account, details, request_timestamps)

        if is_active:
            total_active += 1
        else:
            total_inactive += 1

        # Save after each update
        save_json()

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


if __name__ == "__main__":
    main()
