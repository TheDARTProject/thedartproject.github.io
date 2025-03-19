import os
import csv
import json
import logging
from datetime import datetime
import discord
from discord.ext import commands
from discord.ui import Select, View
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
CONFIG_DIR = "config"
SERVERS_FILE = os.path.join(CONFIG_DIR, "servers.json")

# Logs directory
LOGS_DIR = "bot_logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Data directory for CSV files
DATA_DIR = "data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

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
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    if os.path.exists(SERVERS_FILE):
        with open(SERVERS_FILE, "r") as file:
            return json.load(file)
    return {}


# Save server settings to JSON file
def save_server_settings(settings):
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    with open(SERVERS_FILE, "w") as file:
        json.dump(settings, file, indent=4)


# Function to log message to CSV
def log_message_to_csv(message):
    logger = configure_server_logging(message.guild.id)
    logger.info(
        f"Logging message to CSV: {message.content} (Server: {message.guild.name}, Channel: {message.channel.name})"
    )

    # Create a server-specific CSV file in the data folder
    csv_file = os.path.join(DATA_DIR, f"messages_guild_{message.guild.id}.csv")
    file_exists = os.path.isfile(csv_file)

    with open(csv_file, mode="a", newline="", encoding="utf-8") as file:
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
                    "Guild ID",
                ]
            )
        # Write the message data
        writer.writerow(
            [
                f'"{message.id}"',
                message.author.name,
                f'"{message.author.id}"',
                message.content,
                message.channel.name,
                message.created_at,
                f'"{message.guild.id}"',
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
            "Please set up the bot in a server, not in DMs.", ephemeral=True
        )
        return

    # Create an embed for the setup process
    setup_embed = discord.Embed(
        title="Bot Setup",
        description="Welcome to the bot setup! Please follow the steps below.",
        color=discord.Color.blue(),
    )

    # Step 1: Channel Selection
    setup_embed.add_field(
        name="Step 1: Channel Selection",
        value="Please select the channels you want to monitor from the dropdown below.",
        inline=False,
    )

    # Create a dropdown menu for channel selection
    channel_options = [
        discord.SelectOption(label=channel.name, value=str(channel.id))
        for channel in interaction.guild.text_channels
    ]

    # Store selected channels in a class variable
    selected_channels = []

    async def select_callback(select_interaction):
        nonlocal selected_channels
        # Get the selected channel objects
        selected_channels = [
            interaction.guild.get_channel(int(channel_id))
            for channel_id in select_interaction.data["values"]
        ]

        # Update the embed for Step 2: Historical Scan
        step2_embed = discord.Embed(
            title="Bot Setup",
            description="Welcome to the bot setup! Please follow the steps below.",
            color=discord.Color.blue(),
        )
        step2_embed.add_field(
            name="Step 2: Historical Scan",
            value="Do you want to perform a full historical scan of the selected channels? React with ✅ for yes or ❌ for no.",
            inline=False,
        )

        # Create buttons for yes/no
        yes_button = discord.ui.Button(
            label="Yes", style=discord.ButtonStyle.green, custom_id="yes"
        )
        no_button = discord.ui.Button(
            label="No", style=discord.ButtonStyle.red, custom_id="no"
        )

        async def yes_callback(button_interaction):
            for channel in selected_channels:
                update_embed = discord.Embed(
                    title="Bot Setup",
                    description="Welcome to the bot setup! Please follow the steps below.",
                    color=discord.Color.blue(),
                )
                update_embed.add_field(
                    name="Historical Scan",
                    value=f"Starting historical scan for channel {channel.name}...",
                    inline=False,
                )
                await button_interaction.response.edit_message(
                    embed=update_embed, view=None
                )
                await historical_scan(channel)

            finish_embed = discord.Embed(
                title="Bot Setup",
                description="Welcome to the bot setup! Please follow the steps below.",
                color=discord.Color.blue(),
            )
            finish_embed.add_field(
                name="Setup Complete",
                value="Monitoring has been set up successfully! The bot will now log messages containing the specified words.",
                inline=False,
            )
            await button_interaction.edit_original_response(embed=finish_embed)

            # Save the server settings
            save_server_config(interaction.guild, selected_channels)
            logger.info(f"Monitoring started for guild: {interaction.guild.name}")

        async def no_callback(button_interaction):
            finish_embed = discord.Embed(
                title="Bot Setup",
                description="Welcome to the bot setup! Please follow the steps below.",
                color=discord.Color.blue(),
            )
            finish_embed.add_field(
                name="Setup Complete",
                value="Monitoring has been set up successfully without historical scan! The bot will now log messages containing the specified words.",
                inline=False,
            )
            await button_interaction.response.edit_message(
                embed=finish_embed, view=None
            )

            # Save the server settings
            save_server_config(interaction.guild, selected_channels)
            logger.info(
                f"Monitoring started for guild: {interaction.guild.name} (without historical scan)"
            )

        yes_button.callback = yes_callback
        no_button.callback = no_callback

        step2_view = discord.ui.View()
        step2_view.add_item(yes_button)
        step2_view.add_item(no_button)

        await select_interaction.response.edit_message(
            embed=step2_embed, view=step2_view
        )

    # Create the select menu
    select = discord.ui.Select(
        placeholder="Select channels to monitor...",
        min_values=1,
        max_values=len(channel_options),
        options=channel_options,
    )
    select.callback = select_callback

    setup_view = discord.ui.View()
    setup_view.add_item(select)

    await interaction.response.send_message(
        embed=setup_embed, view=setup_view, ephemeral=True
    )


# Helper function to save server configuration
def save_server_config(guild, selected_channels):
    server_settings = load_server_settings()
    server_count = len(server_settings)
    new_server_key = f"SERVER_NO_{server_count + 1}"

    server_settings[new_server_key] = {
        "Guild ID": guild.id,
        "Server Name": guild.name,
        "Monitored Channels": [
            {"Channel ID": channel.id, "Channel Name": channel.name}
            for channel in selected_channels
        ],
    }

    save_server_settings(server_settings)


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
