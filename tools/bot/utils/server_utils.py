import json
import os
from utils.logging import configure_server_logging

CONFIG_DIR = "config"
SERVERS_FILE = os.path.join(CONFIG_DIR, "servers.json")

# Ensure the config directory exists
if not os.path.exists(CONFIG_DIR):
    os.makedirs(CONFIG_DIR)

# Ensure the servers.json file exists
if not os.path.exists(SERVERS_FILE):
    with open(SERVERS_FILE, "w") as initial_file:
        json.dump({}, initial_file)  # Create an empty JSON object


def add_server_to_config(guild, inviter_id=None):
    """
    Adds a server to the servers.json configuration file when the bot joins a new server.

    Args:
        guild (discord.Guild): The server (guild) the bot has joined.
        inviter_id (int): The ID of the user who invited the bot to the server.
    """
    logger = configure_server_logging(guild.id)  # Initialize logger here

    with open(SERVERS_FILE, "r") as read_file:
        servers = json.load(read_file)

    # Check if the server already exists in the configuration
    server_exists = any(
        server_data["Guild ID"] == guild.id for server_data in servers.values()
    )
    if not server_exists:
        server_count = len(servers)
        new_server_key = f"SERVER_NO_{server_count + 1}"
        servers[new_server_key] = {
            "Guild ID": guild.id,
            "Server Name": guild.name,
            "Member Count": guild.member_count,
            "Monitored Channels": [],  # Initialize with an empty list
            "Inviter ID": inviter_id,  # Add the inviter's ID
        }

        with open(SERVERS_FILE, "w") as write_file:
            json.dump(servers, write_file, indent=4)

        logger.info(f"Server {guild.name} (ID: {guild.id}) added to servers.json.")
        if inviter_id:
            logger.info(f"Inviter ID: {inviter_id}")

    # Calculate total servers and combined member count
    total_servers = len(servers)
    total_members = sum(
        server_data.get("Member Count", 0) for server_data in servers.values()
    )

    # Log and print the updated statistics
    logger.info(
        f"Bot is now in {total_servers} servers, monitoring {total_members} members in total."
    )
    print(
        f"Bot is now in {total_servers} servers, monitoring {total_members} members in total."
    )


def remove_server_from_config(guild_id):
    """
    Removes a server from the servers.json configuration file when the bot is kicked or banned.

    Args:
        guild_id (int): The ID of the server to remove.
    """
    logger = configure_server_logging(guild_id)  # Initialize logger here

    with open(SERVERS_FILE, "r") as read_file:
        servers = json.load(read_file)

    # Check if the server exists in the configuration
    server_found = False
    for server_key, server_data in list(servers.items()):
        if server_data["Guild ID"] == guild_id:
            del servers[server_key]
            server_found = True
            break

    if server_found:
        with open(SERVERS_FILE, "w") as write_file:
            json.dump(servers, write_file, indent=4)

        logger.info(f"Server {guild_id} removed from servers.json.")

    # Calculate total servers and combined member count
    total_servers = len(servers)
    total_members = sum(
        server_data.get("Member Count", 0) for server_data in servers.values()
    )

    # Log and print the updated statistics
    logger.info(
        f"Bot is now in {total_servers} servers, monitoring {total_members} members in total."
    )
    print(
        f"Bot is now in {total_servers} servers, monitoring {total_members} members in total."
    )
