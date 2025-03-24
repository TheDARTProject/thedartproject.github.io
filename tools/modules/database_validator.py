import json


def validate_json(file_name):
    try:
        # Open and read the JSON file
        with open(file_name, 'r') as file:
            json_data = file.read()

        # Try to load the JSON data
        parsed_data = json.loads(json_data)
        print("JSON is valid!")
        return True
    except json.JSONDecodeError as e:
        # If there's an error, print it
        print(f"Invalid JSON! Error: {e}")
        return False
    except FileNotFoundError:
        print(f"Error: The file '{file_name}' was not found.")
        return False


# Specify the filename here
file_name = '../Compromised-Discord-Accounts.json'

# Validate the JSON file
validate_json(file_name)
