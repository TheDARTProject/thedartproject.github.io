import os
import csv
from utils.logging import configure_server_logging

DATA_DIR = "data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)


def log_message_to_csv(message):
    logger = configure_server_logging(message.guild.id)
    logger.info(
        f"Logging message to CSV: {message.content} (Server: {message.guild.name}, Channel: {message.channel.name})"
    )

    # Create a server-specific CSV file in the data folder
    csv_file = os.path.join(DATA_DIR, f"messages_guild_{message.guild.id}.csv")
    file_exists = os.path.isfile(csv_file)

    # Extract embed content if the message has embeds
    embed_content = ""
    if message.embeds:
        for embed in message.embeds:
            if embed.title:
                embed_content += f"**Title:** {embed.title}\n"
            if embed.description:
                embed_content += f"**Description:** {embed.description}\n"
            for field in embed.fields:
                embed_content += f"**{field.name}:** {field.value}\n"

    # Combine message content and embed content
    full_content = message.content
    if embed_content:
        full_content += f"\n\n**Embed Content:**\n{embed_content}"

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
                full_content,  # Use the combined content here
                message.channel.name,
                message.created_at,
                f'"{message.guild.id}"',
            ]
        )
