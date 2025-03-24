import json


# Load the JSON file
def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


# Save the updated JSON back to file
def save_json(data, file_path):
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


# Update the JSON structure
def update_json(data):
    for account, details in data.items():
        # Add ACCOUNT_TYPE if not present
        if "ACCOUNT_TYPE" not in details:
            index = list(details.keys()).index("ACCOUNT_STATUS") + 1
            details = insert_field(details, index, "ACCOUNT_TYPE", "User Accounts")

        # Add FOUND_ON_SERVER if not present
        if "FOUND_ON_SERVER" not in details:
            index = list(details.keys()).index("FOUND_ON") + 1
            details = insert_field(details, index, "FOUND_ON_SERVER", "ANONYMOUS_SERVER_2")

        # Set ACCOUNT_STATUS to COMPROMISED if empty
        if "ACCOUNT_STATUS" in details and details["ACCOUNT_STATUS"].strip() == "":
            details["ACCOUNT_STATUS"] = "COMPROMISED"

        data[account] = details

    return data


# Function to insert a field at a specific position
def insert_field(dictionary, index, key, value):
    items = list(dictionary.items())
    items.insert(index, (key, value))
    return dict(items)


# Main execution
if __name__ == "__main__":
    file_path = "../Compromised-Discord-Accounts.json"
    json_data = load_json(file_path)
    updated_data = update_json(json_data)
    save_json(updated_data, file_path)
    print("JSON file updated successfully.")
