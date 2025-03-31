import json
import os
import time
import datetime
import re
import requests
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv("../.env")

# Get environment variables
DISCORD_INVITE_RATE_LIMIT = int(os.getenv("DISCORD_INVITE_RATE_LIMIT", "20"))
PROXY_URL = os.getenv("PROXY_URL", "https://api.codetabs.com/v1/proxy/?quest=")
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
CLIENT_ID = os.getenv("CLIENT_ID", "")

# File paths
COMPROMISED_ACCOUNTS_FILE = "../Compromised-Discord-Accounts.json"
ACTIVE_SERVERS_FILE = "../Active-Discord-Servers.json"

# Discord Epoch (2015-01-01T00:00:00.000Z)
DISCORD_EPOCH = 1420070400000


def extract_invite_code(url):
    """Extract Discord invite code from URL."""
    # Parse the URL
    parsed_url = urlparse(url)

    # Check if it's a discord.gg URL
    if parsed_url.netloc == "discord.gg":
        return parsed_url.path.strip("/")

    # Check if it's a discord.com/invite URL
    if parsed_url.netloc == "discord.com" and "/invite/" in parsed_url.path:
        return parsed_url.path.split("/invite/")[1]

    return None


def snowflake_to_datetime(snowflake):
    """Convert a Discord snowflake ID to a datetime object."""
    try:
        # Convert snowflake to integer
        snowflake = int(snowflake)

        # Calculate timestamp from snowflake
        timestamp = ((snowflake >> 22) + DISCORD_EPOCH) / 1000

        # Convert to datetime
        creation_date = datetime.datetime.fromtimestamp(
            timestamp, tz=datetime.timezone.utc
        )

        # Format as YYYY-MM-DD
        return creation_date.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return "UNKNOWN"


def get_server_info(invite_code):
    """Get Discord server information using the Discord API."""
    headers = {
        "Authorization": f"Bot {DISCORD_TOKEN}" if DISCORD_TOKEN else None,
        "User-Agent": f"DiscordBot (https://github.com/discord/discord-api-docs, 10)",
    }

    # Filter out None values from headers
    headers = {k: v for k, v in headers.items() if v is not None}

    api_url = f"https://discord.com/api/v10/invites/{invite_code}?with_counts=true&with_expiration=true"
    proxy_api_url = f"{PROXY_URL}{api_url}"

    try:
        response = requests.get(proxy_api_url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            print(
                f"Error fetching server info for invite code {invite_code}: {response.status_code} - {response.text}"
            )
            return None
    except Exception as e:
        print(
            f"Exception while fetching server info for invite code {invite_code}: {e}"
        )
        return None


def main():
    print("=== Discord Server Checker Script ===")
    print(f"Using rate limit of {DISCORD_INVITE_RATE_LIMIT} requests per minute")
    print(f"Using proxy URL: {PROXY_URL}")

    # Load compromised accounts data
    print(f"Loading data from {COMPROMISED_ACCOUNTS_FILE}...")
    try:
        with open(COMPROMISED_ACCOUNTS_FILE, "r", encoding="utf-8") as f:
            compromised_accounts = json.load(f)
    except FileNotFoundError:
        print(f"Error: {COMPROMISED_ACCOUNTS_FILE} not found!")
        return
    except json.JSONDecodeError:
        print(f"Error: {COMPROMISED_ACCOUNTS_FILE} is not a valid JSON file!")
        return

    print(f"Successfully loaded {len(compromised_accounts)} accounts")

    # Load existing active servers data if it exists
    active_servers = {}
    try:
        with open(ACTIVE_SERVERS_FILE, "r", encoding="utf-8") as f:
            active_servers = json.load(f)
        print(
            f"Successfully loaded existing {ACTIVE_SERVERS_FILE} with {len(active_servers)} servers"
        )
    except (FileNotFoundError, json.JSONDecodeError):
        print(
            f"No existing {ACTIVE_SERVERS_FILE} found or it's invalid, creating a new one"
        )

    # Find Discord invite URLs in the compromised accounts data
    discord_invites = []
    for account_key, account_data in compromised_accounts.items():
        surface_url = account_data.get("SURFACE_URL", "")
        surface_url_status = account_data.get("SURFACE_URL_STATUS", "")

        # Check if the URL is a Discord URL and is ACTIVE
        if (
            "discord.gg" in surface_url or "discord.com" in surface_url
        ) and surface_url_status == "ACTIVE":
            invite_code = extract_invite_code(surface_url)
            if invite_code:
                discord_invites.append(
                    {
                        "account_key": account_key,
                        "invite_code": invite_code,
                        "url": surface_url,
                    }
                )

    print(f"Found {len(discord_invites)} active Discord invite URLs to process")

    # Process each invite URL
    processed_count = 0
    server_count = len(active_servers)

    for invite in discord_invites:
        processed_count += 1
        invite_code = invite["invite_code"]
        print(
            f"Processing invite {processed_count}/{len(discord_invites)}: {invite_code}"
        )

        # Check if we already have this server by invite code
        existing_server_key = None
        for server_key, server_data in active_servers.items():
            if server_data.get("INVITE_CODE") == invite_code:
                existing_server_key = server_key
                break

        # Get server information
        server_info = get_server_info(invite_code)

        if server_info:
            # Create or update server entry
            current_time = datetime.datetime.now().isoformat()

            if existing_server_key:
                server_key = existing_server_key
                print(f"Updating existing server {server_key}")
            else:
                server_count += 1
                server_key = f"SERVER_NUMBER_{server_count}"
                print(f"Adding new server as {server_key}")

            # Extract server details
            guild_data = server_info.get("guild", {})
            channel_data = server_info.get("channel", {})
            inviter_data = server_info.get("inviter", {})

            # Get user ID for creation date calculation
            user_id = inviter_data.get("id", "UNKNOWN")
            created_on = (
                snowflake_to_datetime(user_id) if user_id != "UNKNOWN" else "UNKNOWN"
            )

            # Get guild ID for creation date calculation
            guild_id = guild_data.get("id", "UNKNOWN")
            guild_created_on = (
                snowflake_to_datetime(guild_id) if guild_id != "UNKNOWN" else "UNKNOWN"
            )

            # Create server entry
            active_servers[server_key] = {
                "SERVER_STATUS": "ACTIVE",
                "GUILD_ID": server_info.get(
                    "guild_id", guild_data.get("id", "UNKNOWN")
                ),
                "GUILD_NAME": guild_data.get("name", "UNKNOWN"),
                "GUILD_DESCRIPTION": guild_data.get("description", "UNKNOWN"),
                "GUILD_CREATION": guild_created_on,
                "NSFW": guild_data.get("nsfw", False),
                "NSFW_LEVEL": guild_data.get("nsfw_level", 0),
                "VERIFICATION_LEVEL": guild_data.get("verification_level", 0),
                "MEMBER_COUNT": server_info.get("approximate_member_count", 0),
                "ONLINE_MEMBER_COUNT": server_info.get("approximate_presence_count", 0),
                "PREMIUM_SUBSCRIPTION_COUNT": guild_data.get(
                    "premium_subscription_count", 0
                ),
                "PREMIUM_TIER": guild_data.get("premium_tier", 0),
                "FEATURES": guild_data.get("features", []),
                "BANNER": guild_data.get("banner", "UNKNOWN"),
                "ICON": guild_data.get("icon", "UNKNOWN"),
                "SPLASH": guild_data.get("splash", "UNKNOWN"),
                "VANITY_URL_CODE": guild_data.get("vanity_url_code", "UNKNOWN"),
                "INVITE_CODE": server_info.get("code", invite_code),
                "INVITE_EXPIRES_AT": server_info.get("expires_at", None),
                "CHANNEL": {
                    "CHANNEL_ID": channel_data.get("id", "UNKNOWN"),
                    "CHANNEL_NAME": channel_data.get("name", "UNKNOWN"),
                    "CHANNEL_TYPE": channel_data.get("type", 0),
                },
                "INVITE_CREATOR": {
                    "USER_ID": user_id,
                    "USERNAME": inviter_data.get("username", "UNKNOWN"),
                    "DISCRIMINATOR": inviter_data.get("discriminator", "UNKNOWN"),
                    "GLOBAL_NAME": inviter_data.get("global_name", "UNKNOWN"),
                    "AVATAR": inviter_data.get("avatar", "UNKNOWN"),
                    "ACCOUNT_CREATION": created_on,
                },
                "LAST_CHECK": current_time,
            }

            # Save the file after each update
            with open(ACTIVE_SERVERS_FILE, "w", encoding="utf-8") as f:
                json.dump(active_servers, f, indent=4)

            print(
                f"Saved server information for {guild_data.get('name', 'UNKNOWN')} (ID: {guild_data.get('id', 'UNKNOWN')})"
            )
            print(f"Invite creator account created on: {created_on}")
            print(f"Guild created on: {guild_created_on}")
        else:
            # If server info couldn't be retrieved, but we have an existing entry, mark it as INACTIVE
            if existing_server_key:
                print(f"Marking server {existing_server_key} as INACTIVE")
                active_servers[existing_server_key]["SERVER_STATUS"] = "INACTIVE"
                active_servers[existing_server_key][
                    "LAST_CHECK"
                ] = datetime.datetime.now().isoformat()

                # Save the file after update
                with open(ACTIVE_SERVERS_FILE, "w", encoding="utf-8") as f:
                    json.dump(active_servers, f, indent=4)

        # Respect rate limit
        if processed_count < len(discord_invites):
            sleep_time = 60 / DISCORD_INVITE_RATE_LIMIT
            print(
                f"Waiting {sleep_time:.2f} seconds before next request (rate limit: {DISCORD_INVITE_RATE_LIMIT}/min)"
            )
            time.sleep(sleep_time)

    print(f"Processing complete! {processed_count} invites processed.")
    print(f"Active servers file saved to {ACTIVE_SERVERS_FILE}")
    print(f"Total servers in the file: {len(active_servers)}")


if __name__ == "__main__":
    main()
