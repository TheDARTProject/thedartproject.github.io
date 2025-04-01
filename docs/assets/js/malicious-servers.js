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
    serversContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

    for (const serverKey in serversData) {
        const server = serversData[serverKey];

        // Determine status badge color and text
        let statusBadgeClass = '';
        let statusText = server.SERVER_STATUS;
        if (server.SERVER_STATUS === 'ACTIVE') {
            statusBadgeClass = 'bg-red-100 text-red-800';
            statusText = 'ACTIVE THREAT';
        } else {
            statusBadgeClass = 'bg-green-100 text-green-800';
            statusText = 'TAKEN DOWN';
        }

        // Create server card container
        const serverCard = document.createElement('div');
        serverCard.className = 'bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col';

        // Create card content
        serverCard.innerHTML = `
            <div class="flex flex-col gap-6 flex-1">
                <!-- Server Header -->
                <div class="flex items-center gap-4">
                    ${server.ICON ? `
                    <div class="relative flex-shrink-0">
                        <div class="blur-container relative overflow-hidden rounded-full">
                            <img src="https://cdn.discordapp.com/icons/${server.GUILD_ID}/${server.ICON}.png?size=256"
                                  alt="Server icon"
                                  class="w-20 h-20 rounded-full blur-xl transition-all duration-300"
                                  data-blurred="true"
                                  onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-FOUND.png'; this.classList.remove('blur-xl'); this.parentElement.querySelector('.nsfw-warning').classList.add('hidden')">
                            <div class="nsfw-warning absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-2 text-center rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>` : `
                    <img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-FOUND.png"
                          alt="No icon"
                          class="w-16 h-16 rounded-full flex-shrink-0">`}

                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-bold text-indigo-700 truncate">${server.GUILD_NAME || 'Unknown Server'}</h3>
                        <div class="flex flex-wrap items-center gap-2 mt-1">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}">
                                ${statusText}
                            </span>
                            <span class="text-xs text-gray-500">Seen ${server.SEEN_COUNT} time(s)</span>
                        </div>
                    </div>
                </div>

                <!-- Server Banner - Strict 16:9 container -->
                <h4 class="text-xs font-medium text-gray-500 mb-1">Server Banner</h4>
                <div class="server-image-container">
                    ${server.BANNER ? `
                    <div class="blur-container">
                        <img src="https://cdn.discordapp.com/banners/${server.GUILD_ID}/${server.BANNER}.png?size=1024"
                              alt="Server banner"
                              class="server-image blur-xl"
                              data-blurred="true"
                              onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/NOT-FOUND.png'; this.classList.remove('blur-xl'); this.parentElement.querySelector('.nsfw-warning').classList.add('hidden')">
                        <div class="nsfw-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p class="text-sm font-bold">NSFW Warning</p>
                            <p class="text-xs">This image may contain sensitive content</p>
                            <p class="text-xs mt-1">Click to view</p>
                        </div>
                    </div>` : `
                    <img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/NOT-FOUND.png"
                          alt="No banner"
                          class="server-image">`}
                </div>

                <!-- Server Splash - Strict 16:9 container -->
                ${server.SPLASH ? `
                <h4 class="text-xs font-medium text-gray-500 mb-1">Server Splash</h4>
                <div class="server-image-container">
                    <div class="blur-container">
                        <img src="https://cdn.discordapp.com/splashes/${server.GUILD_ID}/${server.SPLASH}.png?size=1024"
                              alt="Server splash"
                              class="server-image blur-xl"
                              data-blurred="true"
                              onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/NOT-FOUND.png'; this.classList.remove('blur-xl'); this.parentElement.querySelector('.nsfw-warning').classList.add('hidden')">
                        <div class="nsfw-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p class="text-sm font-bold">NSFW Warning</p>
                            <p class="text-xs">This image may contain sensitive content</p>
                            <p class="text-xs mt-1">Click to view</p>
                        </div>
                    </div>
                </div>` : `
                <h4 class="text-xs font-medium text-gray-500 mb-1">Server Splash</h4>
                <div class="server-image-container">
                    <img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/NOT-FOUND.png"
                          alt="No splash"
                          class="server-image">
                </div>`}

                <!-- Server Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- Basic Info -->
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Server ID</h4>
                        <p class="text-gray-800 font-mono text-xs truncate">${server.GUILD_ID}</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created On</h4>
                        <p class="text-gray-800 text-xs">${server.GUILD_CREATION || 'Unknown'}</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Members</h4>
                        <p class="text-gray-800 text-xs">${server.MEMBER_COUNT?.toLocaleString() || 'Unknown'} (${server.ONLINE_MEMBER_COUNT?.toLocaleString() || 'Unknown'} online)</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Boost Level</h4>
                        <p class="text-gray-800 text-xs">Tier ${server.PREMIUM_TIER || '0'} (${server.PREMIUM_SUBSCRIPTION_COUNT || '0'} boosts)</p>
                    </div>
                </div>

                <!-- Security Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Verification Level</h4>
                        <p class="text-gray-800 text-xs">${getVerificationLevelName(server.VERIFICATION_LEVEL)}</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-lg">
                        <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">NSFW Level</h4>
                        <p class="text-gray-800 text-xs">${getNSFWLevelName(server.NSFW_LEVEL)}</p>
                    </div>
                </div>

                <!-- Description -->
                ${server.GUILD_DESCRIPTION ? `
                <div class="bg-gray-50 p-2 rounded-lg">
                    <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</h4>
                    <p class="text-gray-800 text-xs line-clamp-3">${server.GUILD_DESCRIPTION}</p>
                </div>` : ''}

                <!-- Invite Info -->
                <div class="bg-gray-50 p-2 rounded-lg">
                    <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Invite Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-1">
                        <div>
                            <h5 class="text-xs text-gray-500">Invite Code</h5>
                            <p class="text-gray-800 font-mono text-xs truncate">${server.INVITE_CODE || 'None'}</p>
                        </div>
                        <div>
                            <h5 class="text-xs text-gray-500">Vanity URL</h5>
                            <p class="text-gray-800 text-xs truncate">${server.VANITY_URL_CODE ? `discord.gg/${server.VANITY_URL_CODE}` : 'None'}</p>
                        </div>
                        <div>
                            <h5 class="text-xs text-gray-500">Channel</h5>
                            <p class="text-gray-800 text-xs truncate">${server.CHANNEL?.CHANNEL_NAME || 'Unknown'} (${server.CHANNEL?.CHANNEL_ID || 'Unknown'})</p>
                        </div>
                        <div>
                            <h5 class="text-xs text-gray-500">Last Checked</h5>
                            <p class="text-gray-800 text-xs">${formatDate(server.LAST_CHECK)}</p>
                        </div>
                    </div>
                </div>

                <!-- Invite Creator -->
                ${server.INVITE_CREATOR ? `
                <div class="bg-gray-50 p-2 rounded-lg">
                    <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Invite Creator</h4>
                    <div class="flex items-center gap-2">
                        ${server.INVITE_CREATOR?.AVATAR && server.INVITE_CREATOR?.AVATAR !== 'UNKNOWN' ? `
                        <div class="relative flex-shrink-0">
                            <div class="blur-container relative overflow-hidden rounded-full">
                                <img src="https://cdn.discordapp.com/avatars/${server.INVITE_CREATOR.USER_ID}/${server.INVITE_CREATOR.AVATAR}.png?size=256"
                                      alt="Creator avatar"
                                      class="w-10 h-10 rounded-full blur-xl transition-all duration-300"
                                      data-blurred="true"
                                      onerror="this.src='https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-FOUND.png'; this.classList.remove('blur-xl'); this.parentElement.querySelector('.nsfw-warning').classList.add('hidden')">
                                <div class="nsfw-warning absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-1 text-center rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>` : `
                        <img src="https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/SQUARE-NOT-FOUND.png"
                              alt="No avatar"
                              class="w-8 h-8 rounded-full flex-shrink-0">`}

                        <div class="min-w-0">
                            <p class="text-gray-800 font-medium text-xs truncate">
                                ${server.INVITE_CREATOR?.USERNAME !== 'UNKNOWN' ?
                                    `${server.INVITE_CREATOR.USERNAME}#${server.INVITE_CREATOR.DISCRIMINATOR}` :
                                    'Unknown User'}
                            </p>
                            <p class="text-gray-600 text-xs truncate">
                                ${server.INVITE_CREATOR?.USER_ID !== 'UNKNOWN' ?
                                    `ID: ${server.INVITE_CREATOR.USER_ID}` : ''}
                            </p>
                            <p class="text-gray-600 text-xs">
                                ${server.INVITE_CREATOR?.ACCOUNT_CREATION !== 'UNKNOWN' ?
                                    `Created: ${formatDate(server.INVITE_CREATOR.ACCOUNT_CREATION)}` : ''}
                            </p>
                        </div>
                    </div>
                </div>` : ''}

                <!-- Features -->
                <div class="bg-gray-50 p-2 rounded-lg">
                    <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Server Features</h4>
                    <div class="flex flex-wrap gap-1">
                        ${server.FEATURES?.length > 0 ?
                            server.FEATURES.map(feature => `
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    ${formatFeatureName(feature)}
                                </span>`
                            ).join('') :
                            '<p class="text-gray-600 text-xs">No special features</p>'}
                    </div>
                </div>
            </div>
        `;

        serversContainer.appendChild(serverCard);
    }

    // Add click handlers for blurred images after they're added to the DOM
    document.querySelectorAll('.blur-container').forEach(container => {
        container.addEventListener('click', function() {
            const img = this.querySelector('img');
            const warning = this.querySelector('.nsfw-warning');
            const isBlurred = img.getAttribute('data-blurred') === 'true';

            if (isBlurred) {
                img.classList.remove('blur-xl');
                img.setAttribute('data-blurred', 'false');
                if (warning) warning.classList.add('hidden');
            } else {
                img.classList.add('blur-xl');
                img.setAttribute('data-blurred', 'true');
                if (warning) warning.classList.remove('hidden');
            }
        });
    });
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