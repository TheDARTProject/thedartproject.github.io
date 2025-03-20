import discord
from datetime import datetime


def add_embed_elements(embed):
    """Helper function to add common elements to an embed."""
    # Header image (Thumbnail)
    embed.set_thumbnail(
        url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Header.png"
    )

    # Author
    embed.set_author(
        name="CDA Monitor",
        icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Author.png",
    )

    # Help message
    embed.add_field(
        name="Need Help?",
        value="For additional help, visit [the documentation](https://thatsinewave.github.io/CDA-Project/pages/discord-bot.html) or contact the project's owner <@212020258402205697>.",
        inline=False,
    )

    # Footer
    embed.set_footer(
        text="Developed by ThatSINEWAVE | CDA Project",
        icon_url="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/tools/bot/images/embed/Embed-Footer.png",
    )

    # Timestamp
    embed.timestamp = datetime.utcnow()

    return embed
