import os
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load the .env file from the parent directory
load_dotenv("../.env")

# Get the token from the .env file
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")

# Set up the headers with the Authorization token
headers = {"Authorization": f"Bot {DISCORD_TOKEN}"}


# Function to print log messages with a timestamp
def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


# Function to check rate limits for both endpoints
def check_rate_limits():
    # Invite Check Endpoint
    valid_invite = "https://discord.gg/projectcw"  # Example of a valid invite URL
    invite_code = valid_invite.split("/")[-1]  # Extract the invite code
    invite_url = f"https://discord.com/api/v10/invites/{invite_code}"

    # Check Invite Endpoint rate limits
    invite_response = requests.get(invite_url, headers=headers)
    log("\n[Invite Check Endpoint] Rate Limit Information:")
    if invite_response.status_code == 200:
        log("Request successful!")
    elif invite_response.status_code == 429:
        log("Rate limited!")
    else:
        log(f"Unexpected status code: {invite_response.status_code}")

    # Handle possible missing headers
    invite_limit = invite_response.headers.get("X-RateLimit-Limit", "N/A")
    invite_remaining = invite_response.headers.get("X-RateLimit-Remaining", "N/A")
    invite_reset_timestamp = invite_response.headers.get("X-RateLimit-Reset")

    # Check if the invite reset timestamp exists and convert it to a human-readable format
    if invite_reset_timestamp:
        invite_reset_time = datetime.utcfromtimestamp(float(invite_reset_timestamp)).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    else:
        invite_reset_time = "N/A"

    log(f"X-RateLimit-Limit: {invite_limit}")
    log(f"X-RateLimit-Remaining: {invite_remaining}")
    log(f"X-RateLimit-Reset (human-readable): {invite_reset_time}")

    # Username Check Endpoint
    discord_user_id = "363284446268620800"  # Replace with a valid Discord ID for testing
    user_url = f"https://discord.com/api/v10/users/{discord_user_id}"

    # Check Username Endpoint rate limits
    user_response = requests.get(user_url, headers=headers)
    log("\n[Username Check Endpoint] Rate Limit Information:")
    if user_response.status_code == 200:
        log("Request successful!")
    elif user_response.status_code == 429:
        log("Rate limited!")
    else:
        log(f"Unexpected status code: {user_response.status_code}")

    limit = user_response.headers.get("X-RateLimit-Limit", "N/A")
    remaining = user_response.headers.get("X-RateLimit-Remaining", "N/A")
    reset_timestamp = user_response.headers.get("X-RateLimit-Reset")

    # Convert the reset timestamp to a human-readable format
    if reset_timestamp:
        reset_time = datetime.utcfromtimestamp(float(reset_timestamp)).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    else:
        reset_time = "N/A"

    log(f"X-RateLimit-Limit: {limit}")
    log(f"X-RateLimit-Remaining: {remaining}")
    log(f"X-RateLimit-Reset (human-readable): {reset_time}")


if __name__ == "__main__":
    check_rate_limits()
