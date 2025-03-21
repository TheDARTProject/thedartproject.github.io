import discord
from discord.ext import commands
from discord import app_commands
from utils.embed_utils import add_embed_elements
from utils.decorators import is_inviter


class HelpCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(
        name="help", description="Get a list of all available commands."
    )
    async def help(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="Bot Commands",
            description="Here is a list of all available commands and what they do:",
            color=discord.Color.blue(),
        )

        # Add common elements to the embed
        embed = add_embed_elements(embed)

        # Add fields for each command
        embed.add_field(
            name="/setup",
            value="Set up the bot to monitor specific channels.",
            inline=False,
        )
        embed.add_field(
            name="/reset",
            value="Reset the bot's configuration for this server.",
            inline=False,
        )
        embed.add_field(
            name="/info",
            value="Get information about the bot and flagged messages.",
            inline=False,
        )
        embed.add_field(
            name="/dump",
            value="Download a CSV file with all flagged messages for this server.",
            inline=False,
        )
        embed.add_field(
            name="/help",
            value="Get a list of all available commands.",
            inline=False,
        )
        embed.add_field(
            name="/support",
            value="Send a support request to the bot's developer.",
            inline=False,
        )

        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot):
    await bot.add_cog(HelpCog(bot))
