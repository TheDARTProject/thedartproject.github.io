import os
import json
import asyncio
import aiohttp
from datetime import datetime, timezone
from dotenv import load_dotenv
import discord
from discord.ext import commands, tasks
import logging

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='[%(asctime)s] [%(levelname)-8s] %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Environment variables
GUILD_ID = int(os.getenv('GUILD_ID'))
BOT_TOKEN = os.getenv('BOT_TOKEN')
APP_ID = os.getenv('APP_ID')
CATEGORY_ID = int(os.getenv('CATEGORY_ID'))
JSON_URL = 'https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/main/data/Compromised-Discord-Accounts.json'

# Config file paths
CONFIG_FOLDER = 'config'
INVITES_CONFIG_PATH = os.path.join(CONFIG_FOLDER, 'invites.json')
CHANNELS_CONFIG_PATH = os.path.join(CONFIG_FOLDER, 'channels.json')

# Intents setup
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
bot = commands.Bot(command_prefix='!', intents=intents)

# Channel names and order
CHANNEL_NAMES = [
    'Updated',
    'Total Cases',
    'Active Cases',
    'Inactive Cases',
    'Total Servers',
    'Total Members'
]


async def fetch_json_data():
    """Fetch JSON data from the GitHub URL with error handling"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(JSON_URL) as response:
                # Try to parse the response
                try:
                    data = json.loads(await response.text())
                    return data
                except json.JSONDecodeError as e:
                    logger.error(f"JSON Decode Error: {e}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching JSON: {e}")
        return None


def load_config_file(filepath):
    """Load JSON configuration file with error handling"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Config file not found at {filepath}")
        return {}
    except json.JSONDecodeError:
        logger.error(f"Error parsing config file at {filepath}")
        return {}


async def get_total_members(invites):
    """Get total member count across all servers"""
    total_members = 0

    for server_name, invite_code in invites.items():
        try:
            # Attempt to get invite using the invite code
            invite = await bot.fetch_invite(invite_code)
            total_members += invite.approximate_member_count or 0
            logger.info(f"Server {server_name}: {invite.approximate_member_count} members")
        except discord.NotFound:
            logger.warning(f"Invite for {server_name} is invalid or expired")
        except Exception as e:
            logger.error(f"Error fetching invite for {server_name}: {e}")

    return total_members


def analyze_data(data):
    """Analyze the JSON data and return statistics"""
    if not data:
        logger.warning("No data to analyze")
        return {
            'last_update': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M'),
            'total_cases': 0,
            'active_cases': 0,
            'inactive_cases': 0,
            'total_servers': 0,
            'total_members': 0
        }

    # Get the latest timestamp
    latest_timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')

    # Calculate statistics
    total_cases = len(data)
    active_cases = sum(1 for entry in data.values() if entry.get('FINAL_URL_STATUS') == 'ACTIVE')
    inactive_cases = total_cases - active_cases
    total_servers = len(set(entry.get('FOUND_ON_SERVER', '') for entry in data.values()))

    return {
        'last_update': latest_timestamp,
        'total_cases': total_cases,
        'active_cases': active_cases,
        'inactive_cases': inactive_cases,
        'total_servers': total_servers,
        'total_members': 0  # Will be updated later
    }


@tasks.loop(minutes=10)
async def update_channels():
    """Periodically update channels with project statistics"""
    try:
        # Load channel configuration
        channel_config = load_config_file(CHANNELS_CONFIG_PATH)

        # Fetch guild
        guild = bot.get_guild(GUILD_ID)

        if not guild:
            logger.error(f"Guild with ID {GUILD_ID} not found.")
            return

        # Fetch and analyze data
        data = await fetch_json_data()

        if data is None:
            logger.error("Failed to fetch or parse JSON data")
            return

        # Analyze data
        stats = analyze_data(data)

        # Load and calculate total members
        invites = load_config_file(INVITES_CONFIG_PATH)
        stats['total_members'] = await get_total_members(invites)

        # Update channel names
        channel_stats = [
            stats['last_update'],
            str(stats['total_cases']),
            str(stats['active_cases']),
            str(stats['inactive_cases']),
            str(stats['total_servers']),
            str(stats['total_members'])
        ]

        # Update channels based on configuration
        for i, (name, stat) in enumerate(zip(CHANNEL_NAMES, channel_stats)):
            channel_id = channel_config.get(name)
            if channel_id:
                try:
                    channel = guild.get_channel(int(channel_id))
                    if channel:
                        await channel.edit(name=str(stat))
                        logger.info(f"Updated {name} channel to: {stat}")
                    else:
                        logger.warning(f"Channel {name} with ID {channel_id} not found")
                except Exception as e:
                    logger.error(f"Error updating channel {name}: {e}")

        logger.info("Channels updated successfully.")

    except Exception as e:
        logger.error(f"Error updating channels: {e}")


@bot.event
async def on_ready():
    """Bot startup event"""
    logger.info(f'Logged in as {bot.user.name}')
    try:
        await bot.tree.sync()
        update_channels.start()
    except Exception as e:
        logger.error(f"Error syncing commands or starting tasks: {e}")


# Run the bot
bot.run(BOT_TOKEN)
