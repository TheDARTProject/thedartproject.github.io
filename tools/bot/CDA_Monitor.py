import os
import csv
import json
import logging
from datetime import datetime
import discord
from discord.ext import commands
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../.env")

# Constants
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
CLIENT_ID = os.getenv("CLIENT_ID")
WORD_LIST = os.getenv("WORD_LIST").split(",")

# Initialize bot
intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# File to store server settings
SERVERS_FILE = "servers.json"

# Logs directory
LOGS_DIR = "bot_logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)


# Function to get or create a server-specific log folder
def get_server_log_folder(guild_id):
    server_log_folder = os.path.join(LOGS_DIR, str(guild_id))
    if not os.path.exists(server_log_folder):
        os.makedirs(server_log_folder)
    return server_log_folder


# Function to configure logging for a specific server
def configure_server_logging(guild_id):
    server_log_folder = get_server_log_folder(guild_id)
    log_file = os.path.join(
        server_log_folder, f"GUILD_{guild_id}_{datetime.now().strftime('%Y-%m-%d')}.log"
    )

    logger = logging.getLogger(f"guild_{guild_id}")
    logger.setLevel(logging.INFO)

    # Remove existing handlers to avoid duplication
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Add a file handler for the server-specific log file
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(file_handler)

    return logger


# Global logger for general bot logs
global_logger = logging.getLogger("global")
global_logger.setLevel(logging.INFO)
global_logger.addHandler(logging.StreamHandler())


# Load server settings from JSON file
def load_server_settings():
    if os.path.exists(SERVERS_FILE):
        with open(SERVERS_FILE, "r") as file:
            return json.load(file)
    return {}


# Save server settings to JSON file
def save_server_settings(settings):
    with open(SERVERS_FILE, "w") as file:
        json.dump(settings, file, indent=4)


# Function to log message to CSV
def log_message_to_csv(message):
    logger = configure_server_logging(message.guild.id)
    logger.info(
        f"Logging message to CSV: {message.content} (Server: {message.guild.name}, Channel: {message.channel.name})"
    )
    file_exists = os.path.isfile("message_log.csv")
    with open("message_log.csv", mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        # Write column titles if the file is being created for the first time
        if not file_exists:
            writer.writerow(
                [
                    "Message ID",
                    "Author Name",
                    "Author ID",
                    "Message Content",
                    "Channel Name",
                    "Timestamp",
                ]
            )
        # Write the message data
        writer.writerow(
            [
                message.id,
                message.author.name,
                message.author.id,
                message.content,
                message.channel.name,
                message.created_at,
            ]
        )


# Function to perform historical scan
async def historical_scan(channel):
    logger = configure_server_logging(channel.guild.id)
    logger.info(
        f"Starting historical scan for channel: {channel.name} (Server: {channel.guild.name})"
    )
    async for message in channel.history(limit=None, oldest_first=True):
        if any(word.lower() in message.content.lower() for word in WORD_LIST):
            log_message_to_csv(message)
    logger.info(
        f"Historical scan completed for channel: {channel.name} (Server: {channel.guild.name})"
    )


# Bot event: on_ready
@bot.event
async def on_ready():
    global_logger.info(f"Logged in as {bot.user.name}")
    await bot.tree.sync()  # Sync slash commands
    global_logger.info("Commands synced.")


# Bot command: setup
@bot.tree.command(
    name="setup", description="Set up the bot to monitor specific channels."
)
async def setup(interaction: discord.Interaction):
    logger = configure_server_logging(interaction.guild.id)
    logger.info(
        f"Setup command invoked by {interaction.user.name} (Server: {interaction.guild.name})"
    )
    if interaction.guild is None:
        await interaction.response.send_message(
            "Please set up the bot in a server, not in DMs."
        )
        return

    # Ask user to select channels
    await interaction.response.send_message(
        "Please mention the channels you want to monitor (e.g., #general #random):"
    )

    def check(m):
        return m.author == interaction.user and m.channel == interaction.channel

    try:
        channel_msg = await bot.wait_for("message", timeout=60.0, check=check)
        channel_ids = [
            int(channel_id.strip("<#!>"))
            for channel_id in channel_msg.content.split()
            if channel_id.startswith("<#")
        ]
        channels = [bot.get_channel(channel_id) for channel_id in channel_ids]

        # Ask user if they want to perform a historical scan
        await interaction.followup.send(
            "Do you want to perform a full historical scan before starting to monitor? (yes/no)"
        )
        historical_scan_msg = await bot.wait_for("message", timeout=60.0, check=check)

        if historical_scan_msg.content.lower() == "yes":
            for channel in channels:
                await interaction.followup.send(
                    f"Starting historical scan for channel {channel.name}..."
                )
                await historical_scan(channel)
                await interaction.followup.send(
                    f"Historical scan for channel {channel.name} completed."
                )

        # Load existing server settings
        server_settings = load_server_settings()

        # Determine the next server number
        server_count = len(server_settings)
        new_server_key = f"SERVER_NO_{server_count + 1}"

        # Add the new server to the settings
        server_settings[new_server_key] = {
            "Guild ID": interaction.guild.id,
            "Server Name": interaction.guild.name,
            "Monitored Channels": [
                {"Channel ID": channel.id, "Channel Name": channel.name}
                for channel in channels
            ],
        }

        # Save the updated settings
        save_server_settings(server_settings)
        await interaction.followup.send(
            "Monitoring started. I will log messages containing the specified words."
        )
        logger.info(f"Monitoring started for guild: {interaction.guild.name}")

    except Exception as e:
        await interaction.followup.send(f"An error occurred: {e}")
        logger.error(f"Error during setup: {e}")


# Bot event: on_message
@bot.event
async def on_message(message):
    if message.guild:  # Check if the message is from a guild
        logger = configure_server_logging(message.guild.id)
        logger.info(
            f"Message received: {message.content} (Server: {message.guild.name}, Channel: {message.channel.name})"
        )
        server_settings = load_server_settings()
        for server_key, server_data in server_settings.items():
            if server_data["Guild ID"] == message.guild.id:
                monitored_channels = [
                    channel["Channel ID"]
                    for channel in server_data["Monitored Channels"]
                ]
                if message.channel.id in monitored_channels:
                    if any(
                        word.lower() in message.content.lower() for word in WORD_LIST
                    ):
                        log_message_to_csv(message)
    await bot.process_commands(message)


# Run the bot
global_logger.info("Starting bot...")
bot.run(DISCORD_TOKEN)
