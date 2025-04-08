document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Website-Configs/refs/heads/main/Updates.json');
        if (!response.ok) {
            throw new Error('Failed to load updates data');
        }
        const updatesData = await response.json();
        renderUpdates(updatesData.updates);
    } catch (error) {
        console.error('Error loading changelog:', error);
        document.getElementById('updates-container').innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">Failed to load changelog updates. Please try again later.</p>
                    </div>
                </div>
            </div>
        `;
    }
});

function renderUpdates(updates) {
    const container = document.getElementById('updates-container');

    updates.forEach(update => {
        const updateElement = document.createElement('div');
        updateElement.className = 'mb-8';

        // Format the date to be more readable
        const dateParts = update.date.split('.');
        const formattedDate = new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        updateElement.innerHTML = `
            <!-- Update Title -->
            <h3 class="text-2xl font-semibold text-gray-800 mb-4">Update - ${formattedDate}</h3>

            <!-- Added Features -->
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="text-lg font-semibold text-indigo-600 mb-2">Added</h4>
                ${renderUpdateSection(update.added, 'added')}
            </div>

            <!-- Updated Features -->
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="text-lg font-semibold text-indigo-600 mb-2">Updated</h4>
                ${renderUpdateSection(update.updated, 'updated')}
            </div>

            <!-- Removed Features -->
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 class="text-lg font-semibold text-indigo-600 mb-2">Removed</h4>
                ${renderUpdateSection(update.removed, 'removed')}
            </div>

            <!-- Additional Notes -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-lg font-semibold text-indigo-600 mb-2">Patch Notes</h4>
                <p class="text-gray-600">${update.notes || 'No Patch Notes were written about this update.'}</p>
            </div>
        `;

        container.appendChild(updateElement);
    });
}

function renderUpdateSection(items, sectionType) {
    if (!items || items.length === 0) {
        return `<p class="text-gray-600">Nothing was ${sectionType} in this update.</p>`;
    }

    return `<ul class="text-gray-600 list-disc list-inside">${items.map(item => `
        <li>${formatUpdateText(item)}</li>
    `).join('')}</ul>`;
}

function formatUpdateText(text) {
    // Auto-bold text before first colon if it exists
    if (text.includes(':')) {
        const colonIndex = text.indexOf(':');
        const beforeColon = text.substring(0, colonIndex);
        const afterColon = text.substring(colonIndex + 1);

        // Convert markdown-style links to HTML links in the afterColon part
        const linkedText = afterColon.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank">$1</a>');

        return `<b>${beforeColon}:</b>${linkedText}`;
    }

    // Convert markdown-style links to HTML links in the entire text
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank">$1</a>');
}