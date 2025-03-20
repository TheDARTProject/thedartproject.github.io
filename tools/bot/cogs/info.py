import os
import csv
import json
import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime


def load_server_settings():
    # Load server settings from the JSON file
    config_dir = "config"
    servers_file = os.path.join(config_dir, "servers.json")
    if os.path.exists(servers_file):
        with open(servers_file, "r") as file:
            return json.load(file)
    return {}


class InfoCog(commands.Cog):
    def __init__(self, bot, word_list):
        self.bot = bot
        self.word_list = word_list  # Store WORD_LIST as an instance variable

    @commands.Cog.listener()
    async def on_ready(self):
        print("InfoCog is ready.")

    @app_commands.command(
        name="info", description="Get information about the bot and flagged messages."
    )
    async def info(self, interaction: discord.Interaction):
        # Ensure the command is used in a server
        if interaction.guild is None:
            await interaction.response.send_message(
                "This command can only be used in a server.", ephemeral=True
            )
            return

        # Get the server-specific CSV file
        csv_file = os.path.join("data", f"messages_guild_{interaction.guild.id}.csv")
        flagged_messages_count = 0
        last_scan_date = "No scans yet"

        # Read the CSV file to count flagged messages and get the last scan date
        if os.path.exists(csv_file):
            with open(csv_file, mode="r", encoding="utf-8") as file:
                reader = csv.reader(file)
                rows = list(reader)
                flagged_messages_count = len(rows) - 1  # Subtract the header row
                if flagged_messages_count > 0:
                    last_scan_date = rows[-1][5]  # Timestamp is in the 6th column

        # Get the number of monitored channels
        server_settings = load_server_settings()
        monitored_channels_count = 0
        for server_key, server_data in server_settings.items():
            if server_data["Guild ID"] == interaction.guild.id:
                monitored_channels_count = len(server_data["Monitored Channels"])
                break

        # Create an embed to display the information
        embed = discord.Embed(
            title="Bot Information",
            description="Here are some stats and information about the bot:",
            color=discord.Color.blue(),
        )

        # Header image
        embed.set_thumbnail(
            url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Header.png"
        )

        embed.set_author(
            name="CDA Monitor",
            icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Author.png",
        )

        embed.add_field(
            name="Flagged Messages Logged",
            value=str(flagged_messages_count),
            inline=True,
        )
        embed.add_field(
            name="Last Scan Date",
            value=last_scan_date,
            inline=True,
        )
        embed.add_field(
            name="Words Monitored",
            value=str(len(self.word_list)),
            inline=True,
        )
        embed.add_field(
            name="Channels Monitored",
            value=str(monitored_channels_count),
            inline=True,
        )

        # Add a help message
        embed.add_field(
            name="Need Help?",
            value="For additional help, visit [the documentation](https://thatsinewave.github.io/CDA-Project/pages/discord-bot.html) or contact the project's owner <@212020258402205697>.",
            inline=False,
        )

        # Add footer
        embed.set_footer(
            text="Developed by ThatSINEWAVE | CDA Project",
            icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Footer.png",
        )

        # Add Timestamp
        embed.timestamp = datetime.utcnow()

        # Send the embed
        await interaction.response.send_message(embed=embed, ephemeral=True)
