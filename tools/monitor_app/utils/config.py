import os
import json

CONFIG_DIR = "config"
SERVERS_FILE = os.path.join(CONFIG_DIR, "servers.json")


def load_server_settings():
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    if os.path.exists(SERVERS_FILE):
        with open(SERVERS_FILE, "r") as file:
            return json.load(file)
    return {}


def save_server_settings(settings):
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    with open(SERVERS_FILE, "w") as file:
        json.dump(settings, file, indent=4)


def load_owner_id():
    owner_file = os.path.join(CONFIG_DIR, "owner.json")
    if os.path.exists(owner_file):
        with open(owner_file, "r") as file:
            data = json.load(file)
            return data.get("owner_id")
    return None
