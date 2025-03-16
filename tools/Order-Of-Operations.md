<div align="center">

# Order of Operations

When manually validating and updating the database, it is important to follow the correct order of operations to ensure data consistency and accuracy. However, we recommend using the database_checker.py, our automated controller script, which ensures that all operations are performed in the correct sequence. The following sequence is provided for cases when the modules need to be run manually, due to issues with the automated controller or when only small updates require a specific module to be run (This process can also be done using the automated controller).

</div>

1. **`database_importer.py`**  
   - **Purpose**: Import new cases from the Excel sheet into the JSON database.
   - **Why First?**: This script adds new entries to the database, so it should be run first to ensure all new data is included before any further processing.

2. **`case_sorter.py`**  
   - **Purpose**: Sort the cases in the JSON file by the `FOUND_ON` date.
   - **Why Second?**: Sorting the cases by date ensures that the data is organized chronologically before any further checks or updates are applied.

3. **`case_number_check.py`**  
   - **Purpose**: Fix and reorder the `CASE_NUMBER` field in the JSON file.
   - **Why Third?**: After sorting by date, the case numbers should be reordered to reflect the new chronological order.

4. **`timestamp_check.py`**  
   - **Purpose**: Add or update the `LAST_CHECK` timestamp for each account.
   - **Why Fourth?**: This ensures that all entries have a timestamp indicating when they were last checked, which is useful for tracking updates.

5. **`ascii_name_check.py`**  
   - **Purpose**: Check if usernames contain non-ASCII characters and update the `NON_ASCII_USERNAME` field.
   - **Why Fifth?**: This check ensures that usernames are validated before further processing, such as Discord API checks.

6. **`discord_user_check.py`**  
   - **Purpose**: Verify Discord usernames against the Discord API and update the `USERNAME` and `ACCOUNT_STATUS` fields.
   - **Why Sixth?**: After validating the usernames, this script ensures that the usernames are correct and up-to-date.

7. **`discord_rate_limit_check.py`**  
   - **Purpose**: Check the rate limits for the Discord API to avoid hitting rate limits during subsequent checks.
   - **Why Seventh?**: This script should be run before any other Discord API checks to ensure that the rate limits are respected.

8. **`discord_invite_check.py`**  
   - **Purpose**: Check the validity of Discord invite links and update the `SURFACE_URL_STATUS` and `FINAL_URL_STATUS` fields.
   - **Why Eighth?**: This script checks the status of Discord invites, which should be done after ensuring that the rate limits are respected.

9. **`url_check.py`**  
   - **Purpose**: Validate and fix URLs in the `SURFACE_URL` and `FINAL_URL` fields.
   - **Why Ninth?**: This script ensures that all URLs are valid and properly formatted before any further checks, such as VirusTotal.

10. **`urlscan_check.py`**  
    - **Purpose**: Check URLs against VirusTotal to detect redirections and update the `FINAL_URL` and `FINAL_URL_STATUS` fields.
    - **Why Tenth?**: This script should be run last as it performs external API calls to URLScan, which may take time and should only be done after all other checks are complete.

11. **`ipinfo_check.py`**  
    - **Purpose**: Retrieve and update IP-related information using the IPInfo API to check and update the SUSPECTED_REGION_OF_ORIGIN field based on the IP of the `FINAL_URL`.
    - **Why Eleventh?**: This script checks the geographical location of IPs linked to Malicious URLs, ensuring the `SUSPECTED_REGION_OF_ORIGIN` is accurate before finalizing the dataset.

---

### Summary of Order:

1. **`database_importer.py`**  
2. **`case_sorter.py`**  
3. **`case_number_check.py`**  
4. **`timestamp_check.py`**  
5. **`ascii_name_check.py`**  
6. **`discord_user_check.py`**  
7. **`discord_rate_limit_check.py`**  
8. **`discord_invite_check.py`**  
9. **`url_check.py`**  
10. **`virustotal_check.py`**  
11. **`ipinfo_check.py`**

---

By following this order, you ensure that the database is consistently updated and validated, minimizing errors and maintaining data integrity.