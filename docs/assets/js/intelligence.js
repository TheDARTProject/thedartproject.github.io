// intelligence.js

// Import necessary functions from utils.js
import { fetchData, formatDate } from './utils.js';

// Main data object
let accountsData = {};

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Fetch and process intelligence data
    fetchIntelligenceData();
});

// Function to fetch and process data for the intelligence page
async function fetchIntelligenceData() {
    try {
        const response = await fetchData('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
        if (!response) {
            throw new Error('Failed to fetch intelligence data');
        }
        accountsData = response;
        processIntelligenceData(accountsData);
    } catch (error) {
        console.error('Error fetching intelligence data:', error);
        alert('Failed to load intelligence data. Please check that the data file exists and is accessible.');
    }
}

// Function to process the data and generate monthly and yearly reports
function processIntelligenceData(data) {
    const monthlyReports = {};
    const yearlyReports = {};

    // Group data by month and year
    Object.values(data).forEach(account => {
        const date = new Date(account.FOUND_ON);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const yearMonth = `${year}-${date.getMonth() + 1}`;

        if (!monthlyReports[yearMonth]) {
            monthlyReports[yearMonth] = {
                year,
                month,
                cases: [],
                totalCases: 0,
                activeUrls: 0,
                commonAttackMethod: '',
                commonAttackVector: '',
                commonAttackGoal: '',
                commonAttackSurface: '',
                accountStatusDistribution: {},
                attackVectorDistribution: {},
                attackSurfaceDistribution: {}
            };
        }

        monthlyReports[yearMonth].cases.push(account);
        monthlyReports[yearMonth].totalCases++;

        if (account.FINAL_URL_STATUS === 'ACTIVE') {
            monthlyReports[yearMonth].activeUrls++;
        }

        // Calculate common attack methods, vectors, surfaces, and goals
        const attackMethods = {};
        const attackVectors = {};
        const attackSurfaces = {};
        const attackGoals = {};
        const accountStatuses = {};

        monthlyReports[yearMonth].cases.forEach(caseData => {
            attackMethods[caseData.ATTACK_METHOD] = (attackMethods[caseData.ATTACK_METHOD] || 0) + 1;
            attackVectors[caseData.ATTACK_VECTOR] = (attackVectors[caseData.ATTACK_VECTOR] || 0) + 1;
            attackSurfaces[caseData.ATTACK_SURFACE] = (attackSurfaces[caseData.ATTACK_SURFACE] || 0) + 1;
            attackGoals[caseData.ATTACK_GOAL] = (attackGoals[caseData.ATTACK_GOAL] || 0) + 1;
            accountStatuses[caseData.ACCOUNT_STATUS] = (accountStatuses[caseData.ACCOUNT_STATUS] || 0) + 1;
        });

        monthlyReports[yearMonth].commonAttackMethod = Object.keys(attackMethods).reduce((a, b) => attackMethods[a] > attackMethods[b] ? a : b);
        monthlyReports[yearMonth].commonAttackVector = Object.keys(attackVectors).reduce((a, b) => attackVectors[a] > attackVectors[b] ? a : b);
        monthlyReports[yearMonth].commonAttackSurface = Object.keys(attackSurfaces).reduce((a, b) => attackSurfaces[a] > attackSurfaces[b] ? a : b);
        monthlyReports[yearMonth].commonAttackGoal = Object.keys(attackGoals).reduce((a, b) => attackGoals[a] > attackGoals[b] ? a : b);
        monthlyReports[yearMonth].accountStatusDistribution = accountStatuses;
        monthlyReports[yearMonth].attackVectorDistribution = attackVectors;
        monthlyReports[yearMonth].attackSurfaceDistribution = attackSurfaces;
    });

    // Group monthly reports by year
    Object.keys(monthlyReports).forEach(yearMonth => {
        const year = monthlyReports[yearMonth].year;
        if (!yearlyReports[year]) {
            yearlyReports[year] = {
                year,
                totalCases: 0,
                activeUrls: 0,
                commonAttackMethod: '',
                commonAttackVector: '',
                commonAttackGoal: '',
                commonAttackSurface: '',
                accountStatusDistribution: {},
                attackVectorDistribution: {},
                attackSurfaceDistribution: {}
            };
        }

        yearlyReports[year].totalCases += monthlyReports[yearMonth].totalCases;
        yearlyReports[year].activeUrls += monthlyReports[yearMonth].activeUrls;

        // Calculate common attack methods, vectors, surfaces, and goals for the year
        const attackMethods = {};
        const attackVectors = {};
        const attackSurfaces = {};
        const attackGoals = {};
        const accountStatuses = {};

        Object.keys(monthlyReports).forEach(ym => {
            if (monthlyReports[ym].year === year) {
                monthlyReports[ym].cases.forEach(caseData => {
                    attackMethods[caseData.ATTACK_METHOD] = (attackMethods[caseData.ATTACK_METHOD] || 0) + 1;
                    attackVectors[caseData.ATTACK_VECTOR] = (attackVectors[caseData.ATTACK_VECTOR] || 0) + 1;
                    attackSurfaces[caseData.ATTACK_SURFACE] = (attackSurfaces[caseData.ATTACK_SURFACE] || 0) + 1;
                    attackGoals[caseData.ATTACK_GOAL] = (attackGoals[caseData.ATTACK_GOAL] || 0) + 1;
                    accountStatuses[caseData.ACCOUNT_STATUS] = (accountStatuses[caseData.ACCOUNT_STATUS] || 0) + 1;
                });
            }
        });

        yearlyReports[year].commonAttackMethod = Object.keys(attackMethods).reduce((a, b) => attackMethods[a] > attackMethods[b] ? a : b);
        yearlyReports[year].commonAttackVector = Object.keys(attackVectors).reduce((a, b) => attackVectors[a] > attackVectors[b] ? a : b);
        yearlyReports[year].commonAttackSurface = Object.keys(attackSurfaces).reduce((a, b) => attackSurfaces[a] > attackSurfaces[b] ? a : b);
        yearlyReports[year].commonAttackGoal = Object.keys(attackGoals).reduce((a, b) => attackGoals[a] > attackGoals[b] ? a : b);
        yearlyReports[year].accountStatusDistribution = accountStatuses;
        yearlyReports[year].attackVectorDistribution = attackVectors;
        yearlyReports[year].attackSurfaceDistribution = attackSurfaces;
    });

    // Sort the monthly reports by the FOUND_ON date of the cases (newest first)
    const sortedMonthlyReports = Object.entries(monthlyReports).sort((a, b) => {
        const latestDateA = new Date(Math.max(...a[1].cases.map(caseData => new Date(caseData.FOUND_ON))));
        const latestDateB = new Date(Math.max(...b[1].cases.map(caseData => new Date(caseData.FOUND_ON))));
        return latestDateB - latestDateA; // Sort in descending order (newest first)
    });

    // Render the reports
    renderIntelligenceReports(sortedMonthlyReports, yearlyReports);
}

// Function to render the reports on the page
function renderIntelligenceReports(sortedMonthlyReports, yearlyReports) {
    const container = document.getElementById('intelligenceReports');
    container.innerHTML = '';

    let currentYear = null;

    // Render the sorted monthly reports
    sortedMonthlyReports.forEach(([yearMonth, report]) => {
        const year = report.year;

        // Add a yearly report box if the year changes
        if (year !== currentYear) {
            if (currentYear !== null) {
                const yearlyReport = yearlyReports[currentYear];
                const yearlyBox = document.createElement('div');
                yearlyBox.className = 'bg-gray-50 p-6 rounded-lg shadow-lg col-span-2';
                yearlyBox.innerHTML = `
                    <h3 class="text-2xl font-bold text-indigo-700 mb-4">Yearly Report - ${currentYear}</h3>
                    <p class="text-gray-600">Total Cases: ${yearlyReport.totalCases}</p>
                    <p class="text-gray-600">Active URLs: ${yearlyReport.activeUrls}</p>
                    <p class="text-gray-600">Most Common Attack Method: ${yearlyReport.commonAttackMethod}</p>
                    <p class="text-gray-600">Most Common Attack Vector: ${yearlyReport.commonAttackVector}</p>
                    <p class="text-gray-600">Most Common Attack Surface: ${yearlyReport.commonAttackSurface}</p>
                    <p class="text-gray-600">Most Common Attack Goal: ${yearlyReport.commonAttackGoal}</p>
                    <div class="mt-4">
                        <h4 class="text-lg font-semibold text-gray-700">Account Status Distribution</h4>
                        <ul class="text-gray-600">
                            ${Object.entries(yearlyReport.accountStatusDistribution).map(([status, count]) => `<li>${status}: ${count}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="mt-4">
                        <h4 class="text-lg font-semibold text-gray-700">Attack Vector Distribution</h4>
                        <ul class="text-gray-600">
                            ${Object.entries(yearlyReport.attackVectorDistribution).map(([vector, count]) => `<li>${vector}: ${count}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="mt-4">
                        <h4 class="text-lg font-semibold text-gray-700">Attack Surface Distribution</h4>
                        <ul class="text-gray-600">
                            ${Object.entries(yearlyReport.attackSurfaceDistribution).map(([surface, count]) => `<li>${surface}: ${count}</li>`).join('')}
                        </ul>
                    </div>
                `;
                container.appendChild(yearlyBox);
            }

            currentYear = year;
        }

        // Add a monthly report box
        const monthlyBox = document.createElement('div');
        monthlyBox.className = 'bg-gray-50 p-6 rounded-lg shadow-lg';
        monthlyBox.innerHTML = `
            <h3 class="text-xl font-bold text-indigo-700 mb-4">${report.month} ${report.year}</h3>
            <p class="text-gray-600">Total Cases: ${report.totalCases}</p>
            <p class="text-gray-600">Active URLs: ${report.activeUrls}</p>
            <p class="text-gray-600">Most Common Attack Method: ${report.commonAttackMethod}</p>
            <p class="text-gray-600">Most Common Attack Vector: ${report.commonAttackVector}</p>
            <p class="text-gray-600">Most Common Attack Surface: ${report.commonAttackSurface}</p>
            <p class="text-gray-600">Most Common Attack Goal: ${report.commonAttackGoal}</p>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Account Status Distribution</h4>
                <ul class="text-gray-600">
                    ${Object.entries(report.accountStatusDistribution).map(([status, count]) => `<li>${status}: ${count}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Attack Vector Distribution</h4>
                <ul class="text-gray-600">
                    ${Object.entries(report.attackVectorDistribution).map(([vector, count]) => `<li>${vector}: ${count}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Attack Surface Distribution</h4>
                <ul class="text-gray-600">
                    ${Object.entries(report.attackSurfaceDistribution).map(([surface, count]) => `<li>${surface}: ${count}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Summary</h4>
                <p class="text-gray-600">${generateSummaryText(report)}</p>
            </div>
        `;
        container.appendChild(monthlyBox);
    });

    // Add the last yearly report box
    if (currentYear !== null) {
        const yearlyReport = yearlyReports[currentYear];
        const yearlyBox = document.createElement('div');
        yearlyBox.className = 'bg-gray-50 p-6 rounded-lg shadow-lg col-span-2';
        yearlyBox.innerHTML = `
            <h3 class="text-2xl font-bold text-indigo-900 mb-4">Yearly Report - ${currentYear}</h3>
            <p class="text-gray-600">Total Cases: ${yearlyReport.totalCases}</p>
            <p class="text-gray-600">Active URLs: ${yearlyReport.activeUrls}</p>
            <p class="text-gray-600">Most Common Attack Method: ${yearlyReport.commonAttackMethod}</p>
            <p class="text-gray-600">Most Common Attack Vector: ${yearlyReport.commonAttackVector}</p>
            <p class="text-gray-600">Most Common Attack Surface: ${yearlyReport.commonAttackSurface}</p>
            <p class="text-gray-600">Most Common Attack Goal: ${yearlyReport.commonAttackGoal}</p>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Account Status Distribution</h4>
                <ul class="text-gray-600">
                    ${Object.entries(yearlyReport.accountStatusDistribution).map(([status, count]) => `<li>${status}: ${count}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Attack Vector Distribution</h4>
                <ul class="text-gray-600">
                    ${Object.entries(yearlyReport.attackVectorDistribution).map(([vector, count]) => `<li>${vector}: ${count}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-4">
                <h4 class="text-lg font-semibold text-gray-700">Attack Surface Distribution</h4>
                <ul class="text-gray-600">
                    ${Object.entries(yearlyReport.attackSurfaceDistribution).map(([surface, count]) => `<li>${surface}: ${count}</li>`).join('')}
                </ul>
            </div>
        `;
        container.appendChild(yearlyBox);
    }
}

// Function to generate a summary text for the monthly report
function generateSummaryText(report) {
    return `In ${report.month} ${report.year}, there were ${report.totalCases} reported cases of compromised Discord accounts.
            The most common attack method was ${report.commonAttackMethod}, targeting ${report.commonAttackSurface} platforms,
            with the primary goal of ${report.commonAttackGoal}. ${report.activeUrls} active malicious URLs were identified during this period.`;
}