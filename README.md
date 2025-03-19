<div align="center">

# [CDA - Compromised Discord Accounts Project](https://thatsinewave.github.io/CDA-Project/)

![Banner](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/CDA-Project.png)

A comprehensive security dashboard designed to track and analyze malicious activities across various platforms. The CDA Project provides real-time threat monitoring, advanced analytics, and a unified processing engine to help users detect and prevent cyber threats effectively.

# README IS OUTDATED

The current state of this README file is outdated and may include incorrect or missing information.

</div>

## Enhanced Features

### Progressive Web App (PWA) Support

- **Full PWA Implementation** with:
  - Web App Manifest for native installation
  - 30+ platform-specific icons (iOS/Android/Windows)
  - Desktop/mobile screenshots for app stores
  - Dark/light theme adaptation
  - Standalone display mode
  - Dynamic risk level indicators
  - API status monitoring panel
  - Cached invite status display
  - Username character analysis
  - Last check timestamp tracking
  - Dual-layer URL validation status

### Advanced Visualization Suite

- **10 Interactive Charts** including:
  - Attack timeline with date filtering
  - Method distribution (doughnut/pie charts)
  - Geographic origin analysis
  - Behavior type classification
  - Attack vector breakdown
  - URL status comparison (surface vs final)
  - Attack surface distribution
  - Attack goal distribution
  - Compromised account status
  - Method vs goal matrix analysis
  - Non-ASCII username tracker
  - VirusTotal check timestamps
  - Regional attribution mapping
  - URL status lifecycle tracking (planned)
  - API call metrics monitoring
  - Username change history (planned)

### Intelligent Data Handling

- **Dynamic Risk Assessment** with color-coded status:
  - Real-time Active URL counter with risk level indicators (Low/Med/High/Critical)
  - Auto-updating "Most Common Attack Method" and "Top Targeted Platform" stats
  - Smart date range presets based on dataset

### Unified Processing Engine

- **All-in-One Security Tool** (`Database-Checker.py`):
  - Discord invite validation with caching
  - VirusTotal API integration
  - IP geolocation tracking
  - Non-ASCII username detection
  - Automated case number sequencing
  - Dual URL checking (Surface + Final)
  - Smart rate limiting (Discord/VirusTotal APIs)
  - Real-time data persistence
  - Comprehensive logging system

<div align="center">

## ☕ [Support my work on Ko-Fi](https://ko-fi.com/thatsinewave)

</div>

## Screenshots

### Search and Filter Section

Allows users to search by username, behavior, or attack method and filter results by attack method or date range for precise data analysis.

![Search-Filters](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/Search-Filters.png)

### Stats Cards

Provides key security metrics, such as the total compromised accounts, deleted accounts, active malicious URLs, common attack methods, and most targeted platforms.

![Stat-Cards](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/Stat-Cards.png)

### Data Glossary & Explanations  

Offers definitions and explanations for key metrics and status indicators, helping users understand the data presented on the dashboard.

![Data-Glossary](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/Data-Glossary.png)

### Timeline

Tracks the frequency of attacks over time, providing insights into trends and patterns of malicious activity for better threat analysis.

![Timeline](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/Timeline.png)

### Charts

Visual representations of key security data, showcasing trends in attack methods, compromised accounts, and targeted platforms for quick insights.

![Charts](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/Charts.png)

### Detailed Data

A comprehensive table or dataset providing in-depth information about each detected threat, allowing for thorough analysis and investigation.

![Detailed-Data](https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/.github/SCREENSHOTS/Detailed-Data.png)

## Technical Highlights

### PWA Architecture

- **Web Manifest** with:
  - 25+ icon configurations for all platforms
  - Theme color synchronization
  - Splash screen support
  - Installation metadata
- **Service Worker Ready** structure
- **App-like Navigation** with sticky elements

### Visualization Engine

- **Dynamic Theme Support**:
  - Chart recoloring for dark/light modes
  - localStorage theme persistence (Planned)
  - Automatic contrast adjustment
- **Smart Data Binding**:
  - Real-time filter propagation
  - Responsive chart destruction/regeneration
  - Percentage-based tooltip calculations

### Core Processing Engine

- **Unified Security Tool**:
  - Integrated Discord API handling
  - VirusTotal malicious URL detection
  - IPInfo geolocation services
  - Automated username normalization
  - Configurable rate limits
  - Multi-API error handling
  - Compressed Base64 URL encoding

### Advanced Data Management

- **Enhanced JSON Schema**:
  - `NON_ASCII_USERNAME` flag
  - `LAST_CHECK` timestamps
  - Dual URL status tracking
  - Automated case numbering
  - Regional attribution system
  - API call counters

### Security Infrastructure

- **Protection Mechanisms**:
  - Request throttling (20/sec Discord, 4/min VirusTotal)
  - Automatic API token validation
  - Immediate disk writes for audit trails
  - Invite status caching system
  - Automatic username synchronization
  - Multi-layer URL validation

## Complete Tool Integration

The `Database-Checker.py` tool represents a significant advancement in our threat detection capabilities, combining previously separate utilities into one powerful security engine. This Python script offers an intelligent multi-API orchestration layer that maintains optimal performance while respecting rate limits of external services.

Key capabilities include:
- **Smart API Management**: Automated token rotation and request throttling to prevent API lockouts
- **Parallel Processing**: Concurrent validation of surface and final URLs for faster analysis
- **Persistent Caching**: Memory-efficient storage of Discord invite validations to reduce API calls
- **Intelligent Retry Logic**: Exponential backoff for failed requests with customizable parameters
- **Comprehensive Reporting**: Real-time terminal output and structured JSON logging for audit trails

The tool implements a robust state machine that tracks the complete lifecycle of each malicious URL, from initial detection through validation to final disposition. Every action is meticulously logged with timestamps and attribution information, creating a detailed forensic record that can be used for trend analysis and incident response.

| Feature                      | Implementation         | Key Technologies                          |
|------------------------------|------------------------|-------------------------------------------|
| Unified Processing           | Database-Checker.py    | Requests, VirusTotal API, Discord API     |
| Data Validation              | Built-in checks        | Unicode normalization, Base64 encoding    |
| Threat Intelligence          | Integrated APIs        | IPInfo, VirusTotal, Discord API           |
| Persistent Logging           | Rotating log system    | Python logging, Immediate fsync           |
| Rate Limit Management        | Adaptive throttling    | Time.perf_counter, Request tracking       |

## Repository Structure

```markdown
├── 📂 docs/                                      # Site files
│   ├── 📜 index.html                             # Home page
│   ├── 📜 info.html                              # Information page
│   ├── 📜 dashboard.html                         # Dashboard page
│   ├── 📜 database.html                          # Database page
│   ├── 🎨 styles.css                             # Main styling
│   ├── 🎨 tailwind.min.css                       # Tailwind CSS framework
│   ├── ⚙️ script.js                              # Interactive dashboard logic
│   ├── ⚙️ servers.js                             # Server names mapping
│   ├── 🕒 dayjs.min.js                           # Date handling library
│   ├── 📊 chart.min.js                           # Chart.js for visualizations
│   ├── 📂 site-data/                             # Miscellaneous site data
│   │   ├── 📂 images/                            # Images used in the project
│   │   │   └── 🖼️ Anon.png                       # Anonymous server icon
│   │   ├── 🔗 social-share/                      # Social sharing related assets
│   │   └── 🖼️ CDA-Project.png                    # Embed image for social sharing
│   ├── 📂 icons/                                 # Various platform icons
│   │   ├── 🤖 android-icon-*.png                 # Android icons (36x36 → 192x192)
│   │   ├── 🍏 apple-icon-*.png                   # Apple icons (57x57 → 180x180)
│   │   ├── 🏁 favicon-*.png                      # Favicons (16x16 → 96x96)
│   │   ├── 🖥️ ms-icon-*.png                      # Microsoft icons (70x70 → 310x310)
│   ├── 📝 site.manifest                          # Web app manifest
├── 📂 data/                                      # Data storage
│   └── 🔒 Compromised-Discord-Accounts.json      # Main dataset of compromised accounts
└── 📂 Tools/                                     # Utility scripts
    ├── 📊 ExporterSheet.xlsx                     # Exported dataset from private Google Sheet
    ├── 🔒 Compromised-Discord-Accounts.json      # Backup copy of dataset that is used in edits
    ├── 📂 bot/                                   # Automated data collection bot
    │   └── 🤖 data_collector_bot.py              # Script for collecting data
    ├── 📂 modules/                               # Various data validation modules
    │   ├── 🔠 ascii_name_check.py                # ASCII name validation
    │   ├── 🔢 case_number_check.py               # Case number validation
    │   ├── 📂 case_sorter.py                     # Case sorting logic
    │   ├── 📥 database_importer.py               # Database import handler
    │   ├── 🔗 discord_invite_check.py            # Discord invite validation
    │   ├── ⏳ discord_rate_limit_check.py        # Discord API rate limit checker
    │   ├── 👤 discord_user_check.py              # Discord user validation
    │   ├── 🌍 ipinfo_check.py                    # IP information lookup
    │   ├── 🔀 redirect_check.py                  # URL redirection validation
    │   ├── 📊 server_counter.py                  # Server counter script
    │   ├── 🕒 timestamp_check.py                 # Timestamp validation
    │   ├── 🔍 url_check.py                       # URL validation
    │   ├── 🛡️ urlscan_check.py                   # URL scanning script
    ├── 🔑 .env                                   # Environment variables (private)
    ├── 📝 .env.example                           # Example environment file
    ├── 🔍 Compromised-Discord-Accounts.json      # Backup dataset
    ├── 📊 Database-Checker.py                    # Script for checking database entries
    ├── 📊 ExporterSheet.xlsx                     # Exported dataset from private Google Sheet
    └── 📑 Order-Of-Operations.md                 # Documentation on execution order
```

## Complete Data Schema

| Field                      | Type    | Description                                  | Example Value                          |
|----------------------------|---------|----------------------------------------------|----------------------------------------|
| CASE_NUMBER                | String  | Unique investigation identifier              | "429"                                  |
| FOUND_ON                   | Date    | Discovery date                               | "2025-02-27"                           |
| FOUND_ON_SERVER            | String  | Server where account was found               | "GAMING_HANGOUT"                       |
| DISCORD_ID                 | String  | 18-digit Discord user ID                     | "123456789012345678"                   |
| USERNAME                   | String  | Current account username                     | "game_wizard_99"                       |
| ACCOUNT_STATUS             | String  | Account status                               | "COMPROMISED"                          |
| BEHAVIOUR                  | String  | Observed malicious patterns                  | "Automated Messaging Campaigns"        |
| ATTACK_METHOD              | String  | Primary attack classification                | "Phishing Website"                     |
| ATTACK_VECTOR              | String  | Technical implementation method              | "Cloned Steam Pages"                   |
| ATTACK_GOAL                | String  | Campaign objectives                          | "Steam Accounts"                       |
| ATTACK_SURFACE             | String  | Targeted platform/service                    | "Steam"                                |
| SUSPECTED_REGION_OF_ORIGIN | String  | Suspected origin region                      | "US"                                   |
| SURFACE_URL                | String  | Initial contact URL                          | "https://example.com/fake-login"       |
| SURFACE_URL_DOMAIN         | String  | Registered domain of surface URL             | "example.com"                          |
| SURFACE_URL_STATUS         | String  | Surface URL status (ACTIVE/INACTIVE/UNKNOWN) | "ACTIVE"                               |
| FINAL_URL                  | String  | Endpoint malicious URL                       | "https://example.com/final-fake-login" |
| FINAL_URL_DOMAIN           | String  | Registered domain of final URL               | "example.com"                          |
| FINAL_URL_STATUS           | String  | Final URL status (ACTIVE/INACTIVE/UNKNOWN)   | "ACTIVE"                               |
| NON_ASCII_USERNAME         | Boolean | Unicode character detection flag             | false                                  |
| LAST_CHECK                 | String  | Last check timestamp                         | "2025-02-28T14:22:37.451089"           |

## Deployment Options

### PWA Installation

1. Visit [Live Demo](https://thatsinewave.github.io/CDA-Project/)
2. Click "Install" in browser controls (Chrome/Edge on desktop or mobile)
3. Launch as a standalone application

## Data Lifecycle

1. **Import** via XLSX-to-JSON.py
2. **Automated Collection** via Database-Checker.py
3. **API Validation** (Discord + VirusTotal)
4. **Geolocation Tagging**
5. **Username Analysis**
6. **Real-Time Dashboard Updates**

<div align="center">

## [Join my discord server](https://discord.gg/2nHHHBWNDw)

</div>

## Compliance Features

- **GDPR-ready Data Handling**:
  - Anonymous tracking IDs
  - No persistent user data
- **CSP-Compatible Structure**
- **Accessibility**:
  - Screen reader support
  - Keyboard navigation
  - Color contrast compliance
- **Extended Security**:
  - API token encryption
  - Request signature validation
  - Audit trail preservation
  - Memory-safe operations
- **Privacy Features**:
  - Anonymized logging
  - Data minimization
  - Secure token handling

## Maintenance Protocols

1. Daily automated API checks
2. Weekly log rotation
3. Monthly cache purges
4. Quarterly schema validation
5. Bi-annual rate limit audits

## Contributing

Contributions are welcome! If you would like to contribute:
1. Fork the repository.
2. Make your changes.
3. Submit a pull request.

This project welcomes contributions through:
- API service integrations
- Enhanced visualization modules
- Localization support
- Additional security checks

## License

This project is open-source and available under the [GPL-3.0 License](LICENSE)