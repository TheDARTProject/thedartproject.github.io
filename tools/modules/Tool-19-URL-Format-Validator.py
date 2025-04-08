import json
import re
from urllib.parse import urlparse


# Function to validate URLs
def is_valid_url(url):
    # Check if the URL is "UNKNOWN"
    if url == "No URL Sent":
        return "Invalid URL: Must be a valid URL, not 'No URL Sent'"

    # Check if URL starts with http:// or https://
    if not url.startswith(("http://", "https://")):
        return "Invalid URL: Must start with http:// or https://"

    # Parse the URL to ensure it's a valid structure
    try:
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            return "Invalid URL: Incomplete URL structure (missing scheme or netloc)"
    except Exception as e:
        return f"Error parsing URL: {e}"

    return None  # None means the URL is valid


# Load the JSON data
with open("../Compromised-Discord-Accounts.json", "r") as file:
    data = json.load(file)

# Initialize counters and lists for statistics
total_cases = len(data)
total_urls = 0
invalid_urls = []
fixed_urls = []

# Iterate over all accounts and check URLs silently
for account_id, account_data in data.items():
    surface_url = account_data.get("SURFACE_URL")
    final_url = account_data.get("FINAL_URL")

    # Count the total URLs found
    total_urls_for_account = 0

    # Check the surface URL
    if surface_url:
        total_urls_for_account += 1
        validation_error = is_valid_url(surface_url)

        # If the URL is invalid
        if validation_error:
            if surface_url == "UNKNOWN":
                invalid_urls.append(
                    f"Invalid SURFACE_URL for {account_id}: {surface_url} - {validation_error}"
                )
            elif "Must start with http:// or https://" in validation_error:
                # Fix the URL by adding https://
                fixed_url = (
                    f"https://{surface_url}"
                    if not surface_url.startswith(("http://", "https://"))
                    else surface_url
                )
                fixed_urls.append(
                    f"Fixed SURFACE_URL for {account_id}: {surface_url} -> {fixed_url}"
                )
                account_data["SURFACE_URL"] = fixed_url  # Update the SURFACE_URL field
            else:
                invalid_urls.append(
                    f"Invalid SURFACE_URL for {account_id}: {surface_url} - {validation_error}"
                )

    # Check the final URL
    if final_url:
        total_urls_for_account += 1
        validation_error = is_valid_url(final_url)

        # If the URL is invalid
        if validation_error:
            if final_url == "UNKNOWN":
                invalid_urls.append(
                    f"Invalid FINAL_URL for {account_id}: {final_url} - {validation_error}"
                )
            elif "Must start with http:// or https://" in validation_error:
                # Fix the URL by adding https://
                fixed_url = (
                    f"https://{final_url}"
                    if not final_url.startswith(("http://", "https://"))
                    else final_url
                )
                fixed_urls.append(
                    f"Fixed FINAL_URL for {account_id}: {final_url} -> {fixed_url}"
                )
                account_data["FINAL_URL"] = fixed_url  # Update the FINAL_URL field
            else:
                invalid_urls.append(
                    f"Invalid FINAL_URL for {account_id}: {final_url} - {validation_error}"
                )

    total_urls += total_urls_for_account

# Print summary of invalid URLs
if invalid_urls:
    print(f"Found issues with {len(invalid_urls)} URLs:")
    for issue in invalid_urls:
        print(issue)
else:
    print("All URLs are valid!")

# Print summary of fixed URLs
if fixed_urls:
    print(f"Fixed issues with {len(fixed_urls)} URLs:")
    for fixed in fixed_urls:
        print(fixed)

# Print total processed URLs and cases
print(f"Processed {total_urls} total URLs in {total_cases} cases successfully!")

# Save the updated data back to the same JSON file
with open("../Compromised-Discord-Accounts.json", "w") as file:
    json.dump(data, file, indent=4)
