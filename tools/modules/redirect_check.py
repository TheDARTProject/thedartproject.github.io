import requests
import json
import os
from urllib.parse import urlparse


# Load the domains to exclude from the .env file
def load_excluded_domains():
    print("Loading excluded domains from .env file...")
    excluded_domains = []
    with open('../.env', 'r') as env_file:  # Updated path to '../.env'
        for line in env_file:
            if line.startswith("EXCLUDED_DOMAINS"):
                excluded_domains = line.strip().split('=')[1].split(',')
                print(f"Excluded domains loaded: {excluded_domains}")
                break
    return excluded_domains


# Find the final URL after following redirects
def get_final_url(surface_url):
    print(f"Following redirects for surface URL: {surface_url}")
    try:
        response = requests.get(surface_url, allow_redirects=True, timeout=10)
        final_url = response.url
        print(f"Found final URL: {final_url}")
        return final_url
    except requests.RequestException as e:
        print(f"Failed to retrieve final URL for {surface_url}. Error: {e}")
        return None


# Extract domain from a URL
def get_domain(url):
    parsed_url = urlparse(url)
    return parsed_url.netloc


# Main function to process the JSON file
def process_compromised_accounts():
    print("Starting to process compromised Discord accounts...")

    # Load the excluded domains from the .env file
    excluded_domains = load_excluded_domains()

    # Load the compromised Discord accounts data from the JSON file
    print("Loading compromised Discord accounts from JSON file...")
    with open('../../data/Compromised-Discord-Accounts.json', 'r') as file:
        data = json.load(file)

    # Process each account entry
    updated_count = 0
    skipped_count = 0
    for account_key, account_info in data.items():
        surface_url = account_info.get('SURFACE_URL')

        if not surface_url:
            print(f"No surface URL found for account {account_key}, skipping...")
            continue

        # Skip if the surface URL domain is in the excluded domains list
        surface_domain = get_domain(surface_url)
        if surface_domain in excluded_domains:
            print(f"Surface URL domain {surface_domain} is excluded. Skipping account {account_key}...")
            skipped_count += 1
            continue

        print(f"Processing account {account_key} with surface URL: {surface_url}")

        # Try to get the final URL after redirection
        final_url = get_final_url(surface_url)

        if final_url:
            final_domain = get_domain(final_url)
            # Update the account with the final URL and domain
            print(f"Updating account {account_key} with final URL: {final_url} and domain: {final_domain}")
            account_info['FINAL_URL'] = final_url
            account_info['FINAL_URL_DOMAIN'] = final_domain
            updated_count += 1
        else:
            print(f"No final URL found for account {account_key}, skipping update...")

    # Save the updated data back to the JSON file
    print(f"Saving updated data back to JSON file...")
    with open('../../data/Compromised-Discord-Accounts.json', 'w') as file:
        json.dump(data, file, indent=4)

    print(f"Processing complete. {updated_count} accounts updated, {skipped_count} accounts skipped.")


# Run the script
if __name__ == "__main__":
    process_compromised_accounts()
