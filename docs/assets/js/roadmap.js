// roadmap.js

document.addEventListener('DOMContentLoaded', () => {
    const roadmapItemsContainer = document.getElementById('roadmap-items');
    const roadmapEmptyState = document.getElementById('roadmap-empty');
    const filterButtonsContainer = document.querySelector('.filter-buttons');

    // Create filter buttons container if it doesn't exist
    if (!filterButtonsContainer) {
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'filter-buttons';
        document.querySelector('.container.mx-auto.px-4.py-8 > div').insertBefore(
            filtersContainer,
            document.querySelector('.roadmap-timeline')
        );
    }

    // Status color mapping
    const statusColors = {
        'Completed': 'bg-green-500',
        'In Progress': 'bg-amber-500',
        'Not Started': 'bg-gray-400',
        'Delayed': 'bg-orange-500',
        'On Hold': 'bg-red-500'
    };

    let roadmapData = [];
    let currentFilter = 'all';

    // Fetch roadmap data
    fetch('../config/Roadmap.json')
        .then(response => response.json())
        .then(data => {
            roadmapData = data.roadmap;
            createFilterButtons();
            renderRoadmapItems();
        })
        .catch(error => {
            console.error('Error fetching roadmap data:', error);
            showErrorState();
        });

    // Create filter buttons dynamically
    function createFilterButtons() {
        const filters = [{
                id: 'all',
                label: 'All Items'
            },
            {
                id: 'completed',
                label: 'Completed'
            },
            {
                id: 'in-progress',
                label: 'In Progress'
            },
            {
                id: 'planned',
                label: 'Planned'
            },
            {
                id: 'delayed',
                label: 'Delayed'
            }
        ];

        const container = document.querySelector('.filter-buttons') || document.createElement('div');
        container.className = 'filter-buttons flex flex-wrap gap-2 mb-6';

        filters.forEach(filter => {
            const button = document.createElement('button');
            button.className = `filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        filter.id === 'all'
          ? 'bg-indigo-700 text-gray-100 hover:bg-indigo-700 dark:bg-gray-700 dark:text-gray-900 dark:hover:bg-indigo-600'
          : 'bg-indigo-700 text-gray-100 hover:bg-indigo-700 dark:bg-gray-700 dark:text-gray-900 dark:hover:bg-indigo-600'
      }`;
            button.dataset.filter = filter.id;
            button.textContent = filter.label;

            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('bg-indigo-600', 'text-white', 'dark:bg-indigo-600', 'dark:text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:text-gray-200', 'dark:hover:bg-gray-600');
                });
                button.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300', 'dark:bg-gray-700', 'dark:text-gray-200', 'dark:hover:bg-gray-600');
                button.classList.add('bg-indigo-600', 'text-white', 'dark:bg-indigo-700', 'dark:text-white');
                currentFilter = filter.id;
                renderRoadmapItems();
            });

            container.appendChild(button);
        });

        // Insert container if it wasn't there originally
        if (!document.querySelector('.filter-buttons')) {
            document.querySelector('.container.mx-auto.px-4.py-8 > div').insertBefore(
                container,
                document.querySelector('.roadmap-timeline')
            );
        }
    }

    // Render roadmap items based on current filter
    function renderRoadmapItems() {
        roadmapItemsContainer.innerHTML = '';

        const filteredItems = roadmapData.filter(item => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'completed') return item.status === 'Completed';
            if (currentFilter === 'in-progress') return item.status === 'In Progress';
            if (currentFilter === 'planned') return item.status === 'Not Started';
            if (currentFilter === 'delayed') return item.status === 'Delayed' || item.status === 'On Hold';
            return true;
        });

        // Sort items by deadline (newest first)
        filteredItems.sort((a, b) => {
            const dateA = new Date(a.deadline);
            const dateB = new Date(b.deadline);
            return dateB - dateA; // Descending order
        });

        if (filteredItems.length === 0) {
            roadmapEmptyState.classList.remove('hidden');
            return;
        } else {
            roadmapEmptyState.classList.add('hidden');
        }

        filteredItems.forEach(item => {
            const statusColor = statusColors[item.status] || 'bg-blue-500';
            const statusBadgeClass = getStatusBadgeClass(item.status);

            // Use provided percentage or calculate if not provided
            let progressPercentage = item.percentage || 0;
            if (item.status === 'In Progress' && !item.percentage) {
                progressPercentage = Math.floor(Math.random() * 60) + 20; // Random between 20-80%
            } else if (item.status === 'Completed') {
                progressPercentage = 100;
            }

            // Format dates
            const formattedStartDate = formatDate(item.startDate);
            const formattedDeadline = formatDate(item.deadline);

            // Create subtasks HTML if they exist
            let subtasksHTML = '';
            if (item.subtasks && item.subtasks.length > 0) {
                subtasksHTML = `
            <div class="subtasks bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-600">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Subtasks</h4>
              <ul class="space-y-2">
                ${item.subtasks.map(subtask => `
                  <li class="subtask flex items-center ${subtask.completed ? 'completed' : ''}">
                    <input type="checkbox" ${subtask.completed ? 'checked' : ''} disabled
                      class="mr-2 h-4 w-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800">
                    <span class="text-gray-600 dark:text-gray-300 ${subtask.completed ? 'line-through' : ''}">${subtask.text}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
            }

            const roadmapItem = document.createElement('div');
            roadmapItem.className = 'roadmap-item';
            roadmapItem.dataset.status = item.status;

            roadmapItem.innerHTML = `
          <div class="roadmap-card bg-gray-50">
            <div class="flex justify-between items-start">
              <h3 class="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">${item.name}</h3>
              <span class="${statusBadgeClass}">
                ${item.status}
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-300 mb-4">${item.description}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-600">
                <p class="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                <p class="text-gray-700 dark:text-gray-200 font-medium">${formattedStartDate}</p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-600">
                <p class="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                <p class="text-gray-700 dark:text-gray-200 font-medium">${formattedDeadline}</p>
              </div>
            </div>

            ${subtasksHTML}

            ${item.status === 'In Progress' || item.status === 'Completed' ? `
              <div class="progress-container">
                <div class="progress-bar ${statusColor}" style="width: ${progressPercentage}%"></div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>${progressPercentage}% Complete</span>
                <span>${item.status === 'Completed' ? 'Done' : 'In Progress'}</span>
              </div>
            ` : ''}
          </div>
        `;

            roadmapItemsContainer.appendChild(roadmapItem);
        });
    }

    // Helper function to get status badge classes
    function getStatusBadgeClass(status) {
        switch (status) {
            case 'Completed':
                return 'status-badge status-completed';
            case 'In Progress':
                return 'status-badge status-in-progress';
            case 'Not Started':
                return 'status-badge status-not-started';
            case 'Delayed':
                return 'status-badge status-delayed';
            case 'On Hold':
                return 'status-badge status-on-hold';
            default:
                return 'status-badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function showErrorState() {
        roadmapItemsContainer.innerHTML = `
      <div class="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Failed to load roadmap data</h3>
        <p class="mt-1 text-gray-500 dark:text-gray-400">Please try refreshing the page</p>
        <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Refresh Page
        </button>
      </div>
    `;
    }
});