import requests
import json
import os
import time
import random
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
from requests.exceptions import RequestException, Timeout, SSLError, ConnectionError
import concurrent.futures
import logging
from datetime import datetime

# Ensure the logs directory exists
logs_dir = "logs"
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

# Set up logging
log_filename = f"redirect_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
log_filepath = os.path.join(logs_dir, log_filename)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_filepath),  # Log to a file in the logs folder
        logging.StreamHandler(),  # Log to the console
    ],
)

logger = logging.getLogger(__name__)


class ProxyRotator:
    """
    Rotate through a list of proxies to avoid IP bans.
    """

    def __init__(self, proxy_list=None):
        self.proxies = proxy_list or []
        self.current_index = 0
        self.failed_proxies = set()

    def add_proxies(self, proxy_list):
        """Add new proxies to the rotation."""
        self.proxies.extend([p for p in proxy_list if p not in self.proxies])

    def get_next_proxy(self):
        """Get the next working proxy."""
        if not self.proxies:
            return None

        # Try to find a working proxy
        attempts = 0
        while attempts < len(self.proxies):
            proxy = self.proxies[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.proxies)

            if proxy not in self.failed_proxies:
                return proxy

            attempts += 1

        # If all proxies failed, reset and try again
        if len(self.failed_proxies) == len(self.proxies):
            self.failed_proxies.clear()

        return self.proxies[self.current_index]

    def mark_proxy_failed(self, proxy):
        """Mark a proxy as failed."""
        self.failed_proxies.add(proxy)


class SmartRateLimiter:
    """
    Implements domain-aware rate limiting to avoid triggering anti-bot measures.
    """

    def __init__(self):
        self.domain_last_request = {}
        self.global_last_request = time.time()
        self.min_domain_interval = (
            5.0  # Minimum 5 seconds between requests to same domain
        )
        self.min_global_interval = 1.0  # Minimum 1 second between any requests

    def wait_if_needed(self, domain):
        """
        Wait if necessary to avoid hitting rate limits.
        """
        current_time = time.time()

        # Check domain-specific rate limit
        domain_wait = 0
        if domain in self.domain_last_request:
            elapsed = current_time - self.domain_last_request[domain]
            if elapsed < self.min_domain_interval:
                domain_wait = self.min_domain_interval - elapsed

        # Check global rate limit
        global_wait = 0
        elapsed = current_time - self.global_last_request
        if elapsed < self.min_global_interval:
            global_wait = self.min_global_interval - elapsed

        # Wait the longer of the two
        wait_time = max(domain_wait, global_wait)
        if wait_time > 0:
            time.sleep(wait_time)

        # Update last request times
        self.domain_last_request[domain] = time.time()
        self.global_last_request = time.time()


# Load the domains to exclude from the .env file
def load_excluded_domains():
    logger.info("Loading excluded domains from .env file...")
    excluded_domains = []
    try:
        with open("../.env", "r") as env_file:
            for line in env_file:
                if line.startswith("EXCLUDED_DOMAINS"):
                    domains = line.strip().split("=")[1].strip("\"'").split(",")
                    excluded_domains = [domain.strip() for domain in domains]
                    logger.info(f"Excluded domains loaded: {excluded_domains}")
                    break
    except FileNotFoundError:
        logger.warning(
            "Warning: .env file not found. Proceeding with empty excluded domains list."
        )
    return excluded_domains


# Load proxies from file if available
def load_proxies():
    proxy_list = []
    try:
        with open("../proxies.txt", "r") as proxy_file:
            for line in proxy_file:
                proxy = line.strip()
                if proxy:
                    proxy_list.append(proxy)
        logger.info(f"Loaded {len(proxy_list)} proxies from proxies.txt")
    except FileNotFoundError:
        logger.warning("No proxies.txt file found. Running without proxies.")
    return proxy_list


# Normalize URL to ensure consistent format
def normalize_url(url):
    """
    Normalize URL to ensure consistent format and avoid duplicate entries.
    """
    # Ensure URL has scheme
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Parse URL
    parsed = urlparse(url)

    # Normalize path
    path = parsed.path
    if not path:
        path = "/"

    # Remove trailing slashes from path except for root
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    # Convert to lowercase
    netloc = parsed.netloc.lower()

    # Remove 'www.' if present
    if netloc.startswith("www."):
        netloc = netloc[4:]

    # Reconstruct URL
    normalized = urlunparse(
        (
            parsed.scheme,
            netloc,
            path,
            parsed.params,
            parsed.query,
            "",  # Remove fragment
        )
    )

    return normalized


# Prepare URL for processing
def prepare_url(url):
    """
    Prepare URL by cleaning and normalizing it.
    """
    url = url.strip()

    # Ensure URL has scheme
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    return url


# Extract domain from a URL
def get_domain(url):
    try:
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()  # Normalize to lowercase

        # Remove 'www.' if present
        if domain.startswith("www."):
            domain = domain[4:]

        return domain
    except Exception as ex:
        logger.error(f"Error parsing URL {url}: {ex}")
        return ""


# Check if the HTML content contains client-side redirects
def check_for_html_redirects(content):
    """
    Check if the HTML content contains redirects like meta refresh or JavaScript redirects.
    """
    try:
        soup = BeautifulSoup(content, "html.parser")
        redirect_url = None

        # Check for meta refresh
        meta_refresh = soup.find(
            "meta", attrs={"http-equiv": re.compile("^refresh$", re.I)}
        )
        if meta_refresh and "content" in meta_refresh.attrs:
            content = meta_refresh["content"]
            match = re.search(r'url=([^\s"]+)', content, re.I)
            if match:
                redirect_url = match.group(1)
                logger.info(f"Found meta refresh redirect to: {redirect_url}")

        # Check for common JavaScript redirects
        scripts = soup.find_all("script")
        for script in scripts:
            if script.string:
                # Look for window.location patterns
                location_patterns = [
                    r'window\.location\.href\s*=\s*[\'"]([^\'"]+)[\'"]',
                    r'window\.location\s*=\s*[\'"]([^\'"]+)[\'"]',
                    r'location\.href\s*=\s*[\'"]([^\'"]+)[\'"]',
                    r'location\.replace\([\'"]([^\'"]+)[\'"]\)',
                ]

                for pattern in location_patterns:
                    match = re.search(pattern, script.string)
                    if match:
                        redirect_url = match.group(1)
                        logger.info(f"Found JavaScript redirect to: {redirect_url}")
                        break

                if redirect_url:
                    break

        return redirect_url
    except Exception as ex:
        logger.error(f"Error parsing HTML for redirects: {ex}")
        return None


# Get final URL using a GET request
def get_final_url_with_get(url, proxy=None, verify_ssl=True, max_retries=3):
    """
    Get the final URL after following redirects using a GET request.
    """
    logger.info(f"Following redirects with GET for URL: {url}")

    # Common user agent strings to avoid being blocked
    user_agents_list = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
    ]

    headers = {
        "User-Agent": random.choice(user_agents_list),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        "Referer": "https://www.google.com/",
    }

    proxy_dict = {}
    if proxy:
        proxy_dict = {"http": proxy, "https": proxy}

    for attempt in range(max_retries):
        try:
            # Exponential backoff for retries
            if attempt > 0:
                wait_time = 2 * (2**attempt)  # 2, 4, 8 seconds
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)

            # Use a longer timeout and stream the response
            session = requests.Session()
            response = session.get(
                url,
                headers=headers,
                proxies=proxy_dict,
                allow_redirects=True,
                timeout=20,
                stream=True,
                verify=verify_ssl,
            )

            # Consume a small part of the content to ensure redirects are followed
            content = next(response.iter_content(4096), None)

            # Check if we got a valid response
            if response.status_code == 200:
                final_url_result = response.url
                logger.info(f"Found final URL via GET: {final_url_result}")

                # Check for HTML/JavaScript redirects
                if content:
                    html_redirect = check_for_html_redirects(content)
                    if html_redirect:
                        # Resolve relative URLs
                        if not html_redirect.startswith(("http://", "https://")):
                            base_url = response.url
                            if html_redirect.startswith("/"):
                                # Absolute path
                                parsed_base = urlparse(base_url)
                                html_redirect = f"{parsed_base.scheme}://{parsed_base.netloc}{html_redirect}"
                            else:
                                # Relative path
                                html_redirect = (
                                    base_url.rstrip("/") + "/" + html_redirect
                                )

                        logger.info(f"Following HTML/JS redirect to: {html_redirect}")
                        return get_final_url_with_get(
                            html_redirect, proxy, verify_ssl, max_retries - 1
                        )

                return final_url_result
            else:
                logger.warning(f"Received status code {response.status_code} for {url}")

        except SSLError as ssl_error:
            logger.warning(
                f"SSL Error: {ssl_error}. Retrying without SSL verification..."
            )
            if verify_ssl:
                # Retry with SSL verification disabled
                return get_final_url_with_get(url, proxy, False, max_retries - 1)

        except Timeout:
            logger.warning(f"Timeout occurred for {url} on attempt {attempt + 1}")

        except ConnectionError:
            logger.warning(
                f"Connection error for {url}. Trying with http:// instead..."
            )
            if url.startswith("https://"):
                alternative_url = url.replace("https://", "http://")
                return get_final_url_with_get(
                    alternative_url, proxy, verify_ssl, max_retries - 1
                )

        except RequestException as req_error:
            logger.error(
                f"Request error on attempt {attempt + 1} for {url}. Error: {req_error}"
            )

        except Exception as ex:
            logger.error(f"Unexpected error for {url}: {ex}")

    logger.error(
        f"Failed to get final URL with GET for {url} after {max_retries} attempts"
    )
    return None


# Get final URL using a HEAD request
def get_final_url_with_head(url, proxy=None, verify_ssl=True, max_retries=3):
    """
    Get the final URL after following redirects using a HEAD request.
    """
    logger.info(f"Following redirects with HEAD for URL: {url}")

    # Common user agent strings to avoid being blocked
    user_agents_list = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0",
    ]

    headers = {
        "User-Agent": random.choice(user_agents_list),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
    }

    proxy_dict = {}
    if proxy:
        proxy_dict = {"http": proxy, "https": proxy}

    for attempt in range(max_retries):
        try:
            if attempt > 0:
                wait_time = 2 * (2**attempt)  # 2, 4, 8 seconds
                logger.info(f"Retrying HEAD request in {wait_time} seconds...")
                time.sleep(wait_time)

                # Use a shorter timeout for HEAD requests
            session = requests.Session()
            response = session.head(
                url,
                headers=headers,
                proxies=proxy_dict,
                allow_redirects=True,
                timeout=10,
                verify=verify_ssl,
            )

            # Check if we got a valid response
            if response.status_code < 400:
                final_url_result = response.url
                logger.info(f"Found final URL via HEAD: {final_url_result}")
                return final_url_result
            else:
                logger.warning(
                    f"Received status code {response.status_code} for HEAD request to {url}"
                )

        except SSLError as ssl_error:
            logger.warning(
                f"SSL Error during HEAD: {ssl_error}. Retrying without SSL verification..."
            )
            if verify_ssl:
                # Retry with SSL verification disabled
                return get_final_url_with_head(url, proxy, False, max_retries - 1)

        except Timeout:
            logger.warning(
                f"Timeout occurred for HEAD request to {url} on attempt {attempt + 1}"
            )

        except ConnectionError:
            logger.warning(
                f"Connection error for HEAD request to {url}. Trying with http:// instead..."
            )
            if url.startswith("https://"):
                alternative_url = url.replace("https://", "http://")
                return get_final_url_with_head(
                    alternative_url, proxy, verify_ssl, max_retries - 1
                )

        except RequestException as req_error:
            logger.error(
                f"Request error on HEAD attempt {attempt + 1} for {url}. Error: {req_error}"
            )

        except Exception as ex:
            logger.error(f"Unexpected error for HEAD request to {url}: {ex}")

        logger.error(
            f"Failed to get final URL with HEAD for {url} after {max_retries} attempts"
        )
        return None


# Get final URL using browser automation
def get_final_url_with_browser(url, timeout=30):
    """
    Use browser automation to handle JavaScript-heavy sites that might not
    work with simple requests.

    Requires: pip install selenium
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options
        from selenium.common.exceptions import TimeoutException, WebDriverException
    except ImportError:
        logger.error("Selenium not installed. Cannot use browser automation.")
        logger.error("To install, run: pip install selenium")
        return None

    logger.info(f"Trying with headless browser for: {url}")

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")

    # Add random user agent
    user_agents_list = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0",
    ]
    chrome_options.add_argument(f"user-agent={random.choice(user_agents_list)}")

    try:
        # Path to the local ChromeDriver executable
        chromedriver_path = os.path.join("driver", "chromedriver")

        # Initialize the ChromeDriver service
        service = Service(executable_path=chromedriver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.set_page_load_timeout(timeout)

        try:
            driver.get(url)
            # Wait for any JavaScript redirects to complete
            time.sleep(5)
            final_url_result = driver.current_url
            logger.info(f"Browser automation found final URL: {final_url_result}")
            return final_url_result
        except TimeoutException:
            logger.warning(f"Browser timeout for {url}")
        except WebDriverException as wd_error:
            logger.error(f"WebDriver error for {url}: {wd_error}")
        finally:
            driver.quit()
    except Exception as ex:
        logger.error(f"Browser automation setup failed: {ex}")

    return None


# Multi-method approach to get final URL
def get_final_url_multi_method(url, proxy_rotator=None, rate_limiter=None):
    """
    Try multiple methods to get the final URL after redirects.
    """
    url = prepare_url(url)
    domain = get_domain(url)

    # Apply rate limiting if enabled
    if rate_limiter and domain:
        rate_limiter.wait_if_needed(domain)

    # Get a proxy if available
    proxy = None
    if proxy_rotator:
        proxy = proxy_rotator.get_next_proxy()
        if proxy:
            logger.info(f"Using proxy: {proxy} for {url}")

    logger.info(f"Attempting to find final URL for: {url}")

    # Try GET method first (most reliable)
    final_url_result = get_final_url_with_get(url, proxy, True)
    if final_url_result:
        return normalize_url(final_url_result)

    # Try HEAD method if GET fails (faster but less reliable)
    final_url_result = get_final_url_with_head(url, proxy, True)
    if final_url_result:
        return normalize_url(final_url_result)

    # Try with browser automation as last resort (for JavaScript redirects)
    try:
        final_url_result = get_final_url_with_browser(url)
        if final_url_result:
            return normalize_url(final_url_result)
    except Exception as ex:
        logger.error(f"Browser automation failed: {ex}")

    # If all methods fail, return None
    logger.error(f"All methods failed to find final URL for {url}")
    return None


# Process a single account
def process_account(
    account_key, account_info, excluded_domains, proxy_rotator, rate_limiter
):
    """
    Process a single account and return the updated account info.
    """
    surface_url = account_info.get("SURFACE_URL")

    if not surface_url:
        logger.warning(f"No surface URL found for account {account_key}, skipping...")
        account_info["SURFACE_URL_STATUS"] = "UNKNOWN"
        return account_key, account_info

    # Clean the URL
    surface_url = surface_url.strip()

    # Skip if the surface URL domain is in the excluded domains list
    surface_domain = get_domain(surface_url)
    if not surface_domain:
        logger.warning(f"Could not parse domain from {surface_url}, skipping...")
        account_info["SURFACE_URL_STATUS"] = "UNKNOWN"
        return account_key, account_info

    if surface_domain in excluded_domains:
        logger.info(
            f"Surface URL domain {surface_domain} is excluded. Skipping account {account_key}..."
        )
        account_info["SURFACE_URL_STATUS"] = "UNKNOWN"
        return account_key, account_info

    # Try to get the final URL after redirection
    final_url_result = get_final_url_multi_method(
        surface_url, proxy_rotator, rate_limiter
    )

    if final_url_result:
        final_domain = get_domain(final_url_result)
        # Update the account with the final URL and domain
        logger.info(
            f"Updating account {account_key} with final URL: {final_url_result} and domain: {final_domain}"
        )
        account_info["FINAL_URL"] = final_url_result
        account_info["FINAL_URL_DOMAIN"] = final_domain

        # Check if FINAL_URL is different from SURFACE_URL and update statuses
        normalized_surface = normalize_url(surface_url)
        if normalized_surface != final_url_result:
            account_info["SURFACE_URL_STATUS"] = "ACTIVE"
            account_info["FINAL_URL_STATUS"] = "ACTIVE"
            account_info["REDIRECT_DETECTED"] = "TRUE"
            logger.info(
                f"FINAL_URL differs from SURFACE_URL. Set statuses to ACTIVE for account {account_key}."
            )
        else:
            account_info["SURFACE_URL_STATUS"] = "INACTIVE"
            account_info["FINAL_URL_STATUS"] = "INACTIVE"
            account_info["REDIRECT_DETECTED"] = "FALSE"
            logger.info(
                f"FINAL_URL same as SURFACE_URL. Set statuses to INACTIVE for account {account_key}."
            )

        return account_key, account_info
    else:
        logger.warning(f"No final URL found for account {account_key}")
        account_info["SURFACE_URL_STATUS"] = "INACTIVE"
        return account_key, account_info


# Process a batch of accounts
def process_batch(batch, excluded_domains, proxy_rotator, rate_limiter, results):
    """
    Process a batch of accounts.
    """
    processed_results = []

    for account_key, account_info in batch.items():
        try:
            # Call process_account and get only account_key and updated_info
            account_key, updated_info = process_account(
                account_key, account_info, excluded_domains, proxy_rotator, rate_limiter
            )

            # Determine the status based on the updated_info
            if "FINAL_URL" in updated_info:
                if updated_info.get("REDIRECT_DETECTED") == "TRUE":
                    results["updated"] += 1
                else:
                    results["skipped"] += 1
            else:
                results["failed"] += 1

            # Add to processed results
            processed_results.append((account_key, updated_info))

        except Exception as ex:
            logger.error(f"Error processing account {account_key}: {ex}")
            results["error"] += 1
            results["errors"][str(ex)] = results["errors"].get(str(ex), 0) + 1
            processed_results.append((account_key, account_info))

    return processed_results


# Save progress
def save_data(data, filename, backup=False):
    """
    Save data to a JSON file with proper error handling.
    """
    global target_file
    try:
        suffix = ".backup" if backup else ""
        target_file = f"../{filename}{suffix}.json"

        logger.info(f"Saving data to {target_file}...")
        with open(target_file, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)
        logger.info("Data successfully saved")
        return True
    except Exception as ex:
        logger.error(f"Error saving data to {target_file}: {ex}")
        # Try to save to an alternative location
        recovery_file = f"./{filename}.recovered.json"
        try:
            with open(recovery_file, "w", encoding="utf-8") as file:
                json.dump(data, file, indent=4)
            logger.info(f"Data saved to recovery file: {recovery_file}")
            return True
        except Exception as e2:
            logger.critical(f"Failed to save recovery data: {e2}")
            return False


# Main function to process the JSON file using a multithreaded approach
def process_compromised_accounts(max_workers=10, batch_size=20, max_accounts=None):
    logger.info("Starting to process compromised Discord accounts...")
    start_time = time.time()

    # Initialize result tracking
    results = {
        "total": 0,
        "updated": 0,
        "failed": 0,
        "skipped": 0,
        "error": 0,
        "errors": {},
    }

    # Load the excluded domains
    excluded_domains = load_excluded_domains()

    # Initialize the proxy rotator
    proxy_list = load_proxies()
    proxy_rotator = ProxyRotator(proxy_list) if proxy_list else None

    # Initialize the rate limiter
    rate_limiter = SmartRateLimiter()

    # Load the compromised Discord accounts data
    logger.info("Loading compromised Discord accounts from JSON file...")
    try:
        with open(
            "../Compromised-Discord-Accounts.json", "r", encoding="utf-8"
        ) as file:
            data = json.load(file)
    except FileNotFoundError:
        logger.error("Error: Compromised-Discord-Accounts.json file not found")
        return
    except json.JSONDecodeError as ex:
        logger.error(f"Error: Invalid JSON in data file: {ex}")
        return

    # Create a backup of the original data
    save_data(data, "Compromised-Discord-Accounts", backup=True)

    # Limit the number of accounts to process if specified
    if max_accounts and len(data) > max_accounts:
        logger.info(f"Limiting processing to {max_accounts} accounts")
        data = {k: data[k] for k in list(data.keys())[:max_accounts]}

    # Calculate batch information
    total_accounts = len(data)
    results["total"] = total_accounts
    total_batches = (total_accounts + batch_size - 1) // batch_size

    logger.info(f"Processing {total_accounts} accounts in {total_batches} batches")

    # Process in batches
    current_batch = 0
    processed_accounts = 0

    # Create batches of accounts
    batches = []
    temp_batch = {}
    for i, (account_key, account_info) in enumerate(data.items()):
        temp_batch[account_key] = account_info
        if len(temp_batch) >= batch_size or i == len(data) - 1:
            batches.append(temp_batch)
            temp_batch = {}

    # Process each batch
    for batch_num, batch in enumerate(batches):
        logger.info(
            f"Processing batch {batch_num + 1}/{len(batches)} ({len(batch)} accounts)"
        )
        current_batch += 1

        # Process accounts in this batch concurrently
        updated_batch = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit tasks to the executor
            future_to_account = {
                executor.submit(
                    process_account,
                    account_key,
                    account_info,
                    excluded_domains,
                    proxy_rotator,
                    rate_limiter,
                ): (account_key, account_info)
                for account_key, account_info in batch.items()
            }

            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_account):
                account_key, updated_info = future.result()
                updated_batch[account_key] = updated_info
                processed_accounts += 1

                # Log progress
                if processed_accounts % 10 == 0:
                    logger.info(
                        f"Processed {processed_accounts}/{total_accounts} accounts"
                    )

        # Update the main data dictionary
        for account_key, updated_info in updated_batch.items():
            data[account_key] = updated_info

        # Save incremental progress
        save_data(data, "Compromised-Discord-Accounts")

        # Calculate and log timing information
        elapsed = time.time() - start_time
        accounts_per_second = processed_accounts / elapsed if elapsed > 0 else 0
        estimated_remaining = (
            (total_accounts - processed_accounts) / accounts_per_second
            if accounts_per_second > 0
            else 0
        )

        logger.info(f"Batch {current_batch}/{total_batches} complete")
        logger.info(f"Processing rate: {accounts_per_second:.2f} accounts/sec")
        logger.info(f"Estimated time remaining: {estimated_remaining / 60:.2f} minutes")
        logger.info(
            f"Current success rate: {results['updated'] / processed_accounts * 100:.2f}%"
        )

    # Save the final results
    save_data(data, "Compromised-Discord-Accounts")

    # Log final statistics
    elapsed_time = time.time() - start_time
    logger.info("=== Processing Complete ===")
    logger.info(f"Total accounts processed: {results['total']}")
    logger.info(f"Successfully updated: {results['updated']}")
    logger.info(f"Failed to update: {results['failed']}")
    logger.info(f"Skipped: {results['skipped']}")
    logger.info(f"Errors: {results['error']}")
    logger.info(f"Total time: {elapsed_time:.2f} seconds")
    logger.info(
        f"Average processing rate: {results['total'] / elapsed_time:.2f} accounts/second"
    )

    if results["error"] > 0:
        logger.info("Error summary:")
        for error, count in results["errors"].items():
            logger.info(f"  - {error}: {count} occurrences")

    return data


# Run the script if executed directly
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Process compromised Discord accounts to check for URL redirects."
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=10,
        help="Maximum number of concurrent workers",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=20,
        help="Number of accounts to process in each batch",
    )
    parser.add_argument(
        "--max-accounts",
        type=int,
        default=None,
        help="Maximum number of accounts to process",
    )

    args = parser.parse_args()

    logger.info(
        f"Starting with {args.max_workers} workers, batch size {args.batch_size}"
    )
    process_compromised_accounts(
        max_workers=args.max_workers,
        batch_size=args.batch_size,
        max_accounts=args.max_accounts,
    )
