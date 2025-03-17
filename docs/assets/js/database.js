// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    fetchData();
});

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Info button functionality
const infoButton = document.getElementById('infoButton');
if (infoButton) {
    infoButton.addEventListener('click', () => {
        window.location.href = 'info.html';
    });
}

// Function to toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('bg-gray-900');
    // Toggle classes
    document.body.classList.toggle('bg-gray-900');
    document.body.classList.toggle('text-white');
    const cards = document.querySelectorAll('.bg-white');
    cards.forEach(card => {
        card.classList.toggle('bg-gray-800');
        card.classList.toggle('text-white');
    });
    // Save state to localStorage
    localStorage.setItem('darkMode', isDarkMode ? 'disabled' : 'enabled');
}

// Function to initialize theme based on user preference
function initializeTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('bg-gray-900', 'text-white');
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach(card => {
            card.classList.add('bg-gray-800', 'text-white');
        });
    }
}

// Fetch data from JSON file
let accountsData = {};
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

async function fetchData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response.ok) throw new Error('Failed to fetch data');
        accountsData = await response.json();
        populateFilters(accountsData);
        filterData();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateFilters(data) {
    const attackMethods = new Set();
    const attackSurfaces = new Set();
    const regions = new Set();
    Object.values(data).forEach(account => {
        attackMethods.add(account.ATTACK_METHOD);
        attackSurfaces.add(account.ATTACK_SURFACE);
        regions.add(account.SUSPECTED_REGION_OF_ORIGIN);
    });
    populateDropdown('attackMethodFilter', attackMethods);
    populateDropdown('attackSurfaceFilter', attackSurfaces);
    populateDropdown('regionFilter', regions);
}

function populateDropdown(id, values) {
    const dropdown = document.getElementById(id);
    dropdown.innerHTML = '<option value="">All</option>';
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        dropdown.appendChild(option);
    });
}

function filterData() {
    const usernameFilter = document.getElementById('usernameFilter').value.toLowerCase();
    const attackMethodFilter = document.getElementById('attackMethodFilter').value;
    const attackSurfaceFilter = document.getElementById('attackSurfaceFilter').value;
    const urlStatusFilter = document.getElementById('urlStatusFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const accountStatusFilter = document.getElementById('accountStatusFilter').value;
    const regionFilter = document.getElementById('regionFilter').value;
    const nonAsciiFilter = document.getElementById('nonAsciiFilter').value;
    filteredData = Object.values(accountsData).filter(account => {
        const foundDate = new Date(account.FOUND_ON);
        const matchesUsername = !usernameFilter || account.USERNAME.toLowerCase().includes(usernameFilter);
        const matchesAttackMethod = !attackMethodFilter || account.ATTACK_METHOD === attackMethodFilter;
        const matchesAttackSurface = !attackSurfaceFilter || account.ATTACK_SURFACE === attackSurfaceFilter;
        const matchesUrlStatus = !urlStatusFilter || account.FINAL_URL_STATUS === urlStatusFilter;
        const matchesDate = (!dateFrom || new Date(account.FOUND_ON) >= new Date(dateFrom)) && (!dateTo || new Date(account.FOUND_ON) <= new Date(dateTo));
        const matchesAccountStatus = !accountStatusFilter || account.ACCOUNT_STATUS === accountStatusFilter;
        const matchesRegion = !regionFilter || account.SUSPECTED_REGION_OF_ORIGIN === regionFilter;
        const matchesNonAscii = nonAsciiFilter === "" || (nonAsciiFilter === "true" && /[^\x00-\x7F]/.test(account.USERNAME)) || (nonAsciiFilter === "false" && !/[^\x00-\x7F]/.test(account.USERNAME));
        return matchesUsername && matchesAttackMethod && matchesAttackSurface && matchesUrlStatus && matchesDate && matchesAccountStatus && matchesRegion && matchesNonAscii;
    });
    currentPage = 1;
    updateTable();
}

function updateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    pageData.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4">${account.CASE_NUMBER}</td>
          <td class="px-6 py-4">${formatDate(account.FOUND_ON)}</td>
          <td class="px-6 py-4">${account.USERNAME}</td>
          <td class="px-6 py-4">${account.ACCOUNT_STATUS}</td>
          <td class="px-6 py-4">${account.BEHAVIOUR}</td>
          <td class="px-6 py-4">${account.ATTACK_METHOD}</td>
          <td class="px-6 py-4">${account.ATTACK_SURFACE}</td>
          <td class="px-6 py-4">${account.FINAL_URL_STATUS}</td>
          <td class="px-6 py-4">${account.SUSPECTED_REGION_OF_ORIGIN}</td>
        `;
        tableBody.appendChild(row);
    });
    document.getElementById('tableInfo').textContent = `Showing ${startIndex + 1}-${Math.min(endIndex, filteredData.length)} of ${filteredData.length} entries`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredData.length;
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const caseNumber = button.getAttribute('data-case');
            showAccountDetails(caseNumber);
        });
    });
}

function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function showAccountDetails(caseNumber) {
    const account = Object.values(accountsData).find(acc => acc.CASE_NUMBER === caseNumber);
    if (!account) return;
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium text-lg mb-2">Account Information</h3>
          <p>
            <span class="font-medium">Case Number:</span> ${account.CASE_NUMBER}
          </p>
          <p>
            <span class="font-medium">Found On:</span> ${formatDate(account.FOUND_ON)}
          </p>
          <p>
            <span class="font-medium">Discord ID:</span> ${account.DISCORD_ID}
          </p>
          <p>
            <span class="font-medium">Username:</span> ${account.USERNAME}
          </p>
          <p>
            <span class="font-medium">Behaviour:</span> ${account.BEHAVIOUR}
          </p>
        </div>
        <div>
          <h3 class="font-medium text-lg mb-2">Attack Details</h3>
          <p>
            <span class="font-medium">Attack Method:</span> ${account.ATTACK_METHOD}
          </p>
          <p>
            <span class="font-medium">Attack Vector:</span> ${account.ATTACK_VECTOR}
          </p>
          <p>
            <span class="font-medium">Attack Goal:</span> ${account.ATTACK_GOAL}
          </p>
          <p>
            <span class="font-medium">Attack Surface:</span> ${account.ATTACK_SURFACE}
          </p>
          <p>
            <span class="font-medium">Suspected Origin:</span> ${account.SUSPECTED_REGION_OF_ORIGIN}
          </p>
        </div>
      </div>
      <div class="mt-4">
        <h3 class="font-medium text-lg mb-2">URLs</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">Surface URL</td>
                <td class="px-6 py-4 url-cell">
                  <a href="#" class="text-indigo-600 hover:text-indigo-900 break-all">${account.SURFACE_URL}</a>
                </td>
                <td class="px-6 py-4 domain-cell" title="${account.SURFACE_URL_DOMAIN}">${account.SURFACE_URL_DOMAIN}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.SURFACE_URL_STATUS === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                    ${account.SURFACE_URL_STATUS}
                  </span>
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">Final URL</td>
                <td class="px-6 py-4 url-cell">
                  <a href="#" class="text-indigo-600 hover:text-indigo-900 break-all">${account.FINAL_URL}</a>
                </td>
                <td class="px-6 py-4 domain-cell" title="${account.FINAL_URL_DOMAIN}">${account.FINAL_URL_DOMAIN}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.FINAL_URL_STATUS === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                    ${account.FINAL_URL_STATUS}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
}

// Event listeners for filter buttons
document.getElementById('applyFilters').addEventListener('click', filterData);
document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('usernameFilter').value = '';
    document.getElementById('attackMethodFilter').value = '';
    document.getElementById('attackSurfaceFilter').value = '';
    document.getElementById('urlStatusFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('accountStatusFilter').value = '';
    document.getElementById('regionFilter').value = '';
    document.getElementById('nonAsciiFilter').value = '';
    filterData();
});

// Pagination event listeners
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const maxPage = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        updateTable();
    }
});