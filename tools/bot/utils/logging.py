import os
import logging
from datetime import datetime

LOGS_DIR = "bot_logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)


def get_server_log_folder(guild_id):
    server_log_folder = os.path.join(LOGS_DIR, str(guild_id))
    if not os.path.exists(server_log_folder):
        os.makedirs(server_log_folder)
    return server_log_folder


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
