// Malicious Servers Page Script
document.addEventListener('DOMContentLoaded', async function() {
    // Load the servers data
    const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Active-Discord-Servers.json');
    const serversData = await response.json();

    // Count stats
    let totalServers = 0;
    let activeServers = 0;
    let takenDownServers = 0;

    // Update stats counters
    for (const serverKey in serversData) {
        totalServers++;
        if (serversData[serverKey].SERVER_STATUS === 'ACTIVE') {
            activeServers++;
        } else {
            takenDownServers++;
        }
    }

    // Update stats display
    document.getElementById('totalServers').textContent = totalServers;
    document.getElementById('activeServers').textContent = activeServers;
    document.getElementById('takenDownServers').textContent = takenDownServers;

    // Create server cards
    const serversContainer = document.getElementById('serversContainer');

    for (const serverKey in serversData) {
        const server = serversData[serverKey];

        // Determine status badge color
        let statusBadgeClass = '';
        if (server.SERVER_STATUS === 'ACTIVE') {
            statusBadgeClass = 'bg-green-100 text-green-800';
        } else {
            statusBadgeClass = 'bg-red-100 text-red-800';
        }

        // Create server card
        const serverCard = document.createElement('div');
        serverCard.className = 'bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow';
        serverCard.innerHTML = `
            <div class="flex flex-col md:flex-row gap-6">
                <!-- Server Banner (if available) -->
                <div class="w-full md:w-1/3">
                    ${server.BANNER ?
                        `<img src="https://cdn.discordapp.com/banners/${server.GUILD_ID}/${server.BANNER}.png?size=1024"
                              alt="Server banner"
                              class="w-full h-48 object-cover rounded-lg mb-4"
                              onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/NOT-LOADED.png'">` :
                        `<img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/NOT-LOADED.png"
                              alt="No banner"
                              class="w-full h-48 object-cover rounded-lg mb-4">`}

                    <!-- Server Icon -->
                    <div class="flex items-center gap-4">
                        ${server.ICON ?
                            `<img src="https://cdn.discordapp.com/icons/${server.GUILD_ID}/${server.ICON}.png?size=256"
                                  alt="Server icon"
                                  class="w-16 h-16 rounded-full"
                                  onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-LOADED.png'">` :
                            `<img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-LOADED.png"
                                  alt="No icon"
                                  class="w-16 h-16 rounded-full">`}

                        <div>
                            <h3 class="text-xl font-bold text-indigo-700">${server.GUILD_NAME || 'Unknown Server'}</h3>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClass}">
                                ${server.SERVER_STATUS}
                            </span>
                            <p class="text-gray-600 text-sm">Seen ${server.SEEN_COUNT} time(s)</p>
                        </div>
                    </div>
                </div>

                <!-- Server Details -->
                <div class="w-full md:w-2/3">
                    <!-- Basic Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-500">Server ID</h4>
                            <p class="text-gray-800 font-mono">${server.GUILD_ID}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-500">Created On</h4>
                            <p class="text-gray-800">${server.GUILD_CREATION || 'Unknown'}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-500">Members</h4>
                            <p class="text-gray-800">${server.MEMBER_COUNT?.toLocaleString() || 'Unknown'} (${server.ONLINE_MEMBER_COUNT?.toLocaleString() || 'Unknown'} online)</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-500">Boost Level</h4>
                            <p class="text-gray-800">Tier ${server.PREMIUM_TIER || '0'} (${server.PREMIUM_SUBSCRIPTION_COUNT || '0'} boosts)</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-500">Verification Level</h4>
                            <p class="text-gray-800">${getVerificationLevelName(server.VERIFICATION_LEVEL)}</p>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-500">NSFW Level</h4>
                            <p class="text-gray-800">${getNSFWLevelName(server.NSFW_LEVEL)}</p>
                        </div>
                    </div>

                    <!-- Description -->
                    ${server.GUILD_DESCRIPTION ? `
                        <div class="mb-6">
                            <h4 class="text-sm font-medium text-gray-500 mb-1">Description</h4>
                            <p class="text-gray-800">${server.GUILD_DESCRIPTION}</p>
                        </div>
                    ` : ''}

                    <!-- Invite Info -->
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-gray-500 mb-2">Invite Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <h5 class="text-xs font-medium text-gray-500">Invite Code</h5>
                                <p class="text-gray-800 font-mono">${server.INVITE_CODE || 'None'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <h5 class="text-xs font-medium text-gray-500">Vanity URL</h5>
                                <p class="text-gray-800">${server.VANITY_URL_CODE ? `discord.gg/${server.VANITY_URL_CODE}` : 'None'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <h5 class="text-xs font-medium text-gray-500">Channel</h5>
                                <p class="text-gray-800">${server.CHANNEL?.CHANNEL_NAME || 'Unknown'} (${server.CHANNEL?.CHANNEL_ID || 'Unknown'})</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <h5 class="text-xs font-medium text-gray-500">Last Checked</h5>
                                <p class="text-gray-800">${formatDate(server.LAST_CHECK)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Invite Creator -->
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-gray-500 mb-2">Invite Creator</h4>
                        <div class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            ${server.INVITE_CREATOR?.AVATAR && server.INVITE_CREATOR?.AVATAR !== 'UNKNOWN' ?
                                `<img src="https://cdn.discordapp.com/avatars/${server.INVITE_CREATOR.USER_ID}/${server.INVITE_CREATOR.AVATAR}.png?size=256"
                                      alt="Creator avatar"
                                      class="w-10 h-10 rounded-full"
                                      onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-LOADED.png'">` :
                                `<img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-LOADED.png"
                                      alt="No avatar"
                                      class="w-10 h-10 rounded-full">`}

                            <div>
                                <p class="text-gray-800 font-medium">
                                    ${server.INVITE_CREATOR?.USERNAME !== 'UNKNOWN' ?
                                        `${server.INVITE_CREATOR.USERNAME}#${server.INVITE_CREATOR.DISCRIMINATOR}` :
                                        'Unknown User'}
                                </p>
                                <p class="text-gray-600 text-sm">
                                    ${server.INVITE_CREATOR?.USER_ID !== 'UNKNOWN' ?
                                        `ID: ${server.INVITE_CREATOR.USER_ID}` : ''}
                                </p>
                                <p class="text-gray-600 text-sm">
                                    ${server.INVITE_CREATOR?.ACCOUNT_CREATION !== 'UNKNOWN' ?
                                        `Created: ${formatDate(server.INVITE_CREATOR.ACCOUNT_CREATION)}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Features -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-500 mb-2">Server Features</h4>
                        <div class="flex flex-wrap gap-2">
                            ${server.FEATURES?.length > 0 ?
                                server.FEATURES.map(feature =>
                                    `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        ${formatFeatureName(feature)}
                                    </span>`
                                ).join('') :
                                '<p class="text-gray-600">No special features</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        serversContainer.appendChild(serverCard);
    }
});

// Helper functions
function getVerificationLevelName(level) {
    const levels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Highest'
    };
    return levels[level] || 'Unknown';
}

function getNSFWLevelName(level) {
    const levels = {
        0: 'Default',
        1: 'Explicit',
        2: 'Safe',
        3: 'Age Restricted'
    };
    return levels[level] || 'Unknown';
}

function formatFeatureName(feature) {
    return feature
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString) {
    if (!dateString || dateString === 'UNKNOWN') return 'Unknown';

    const date = new Date(dateString);
    return date.toLocaleString();
}