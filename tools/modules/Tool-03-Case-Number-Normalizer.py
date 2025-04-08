import json
import time


def get_current_timestamp():
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())


def fix_account_numbers(file_path):
    print(
        f"[{get_current_timestamp()}] Starting to fix account numbers in the file: {file_path}"
    )

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(
            f"[{get_current_timestamp()}] Successfully loaded the data from the file."
        )
    except Exception as e:
        print(f"[{get_current_timestamp()}] Error loading the file: {e}")
        return

    total_accounts = len(data)
    updated_count = 0
    updated_data = {}

    # Iterate through the accounts and update both the keys and the ACCOUNT_NUMBER_
    for index, (old_key, account) in enumerate(data.items(), start=1):
        # Generate the new key (e.g., ACCOUNT_NUMBER_1, ACCOUNT_NUMBER_2, etc.)
        new_key = f"ACCOUNT_NUMBER_{index}"

        # Update the 'ACCOUNT_NUMBER_' field inside the account data
        account["ACCOUNT_NUMBER_"] = str(index)

        # Update the 'CASE_NUMBER' field as well
        if account["CASE_NUMBER"] != str(index):  # If the CASE_NUMBER is incorrect
            updated_count += 1
        account["CASE_NUMBER"] = str(index)

        # Add the updated account data with the new key to the updated_data dictionary
        updated_data[new_key] = account

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(updated_data, f, indent=4, ensure_ascii=False)
        print(
            f"[{get_current_timestamp()}] Successfully saved the corrected data back to the file."
        )
    except Exception as e:
        print(f"[{get_current_timestamp()}] Error saving the file: {e}")
        return

    print(f"[{get_current_timestamp()}] Found {total_accounts} accounts in the file.")
    print(f"[{get_current_timestamp()}] {updated_count} accounts were updated.")


# Run the function on the JSON file
fix_account_numbers("../Compromised-Discord-Accounts.json")
