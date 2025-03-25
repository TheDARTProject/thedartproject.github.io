import discord
from discord import app_commands
from utils.config import load_server_settings


# Define a custom check failure error that includes a message
class InviterCheckFailure(app_commands.errors.CheckFailure):
    def __init__(self, message):
        self.message = message
        super().__init__(message)


def is_inviter():
    async def predicate(interaction: discord.Interaction):
        server_settings = load_server_settings()
        guild_id = str(interaction.guild.id)

        # Find the server data in the settings
        server_data = None
        for key, data in server_settings.items():
            if str(data["Guild ID"]) == guild_id:
                server_data = data
                break

        if not server_data:
            # Instead of sending a response, raise a custom error
            raise InviterCheckFailure(
                "This server is not configured properly. Please re-add the bot."
            )

        inviter_id = server_data.get("Inviter ID")
        if inviter_id is None:
            raise InviterCheckFailure(
                "The bot was not properly configured when added to this server. "
                "Please re-add the bot to ensure proper permissions are set."
            )

        # Check if the user is the inviter
        if str(interaction.user.id) == str(inviter_id):
            return True
        else:
            raise InviterCheckFailure(
                "You don't have permission to do that. If you are part of the staff team of this server, "
                "please contact the person who added this bot inside the server and ask them to run the command for you."
            )

    return app_commands.check(predicate)
