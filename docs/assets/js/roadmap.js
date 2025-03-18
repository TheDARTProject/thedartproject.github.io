// roadmap.js

document.addEventListener('DOMContentLoaded', () => {
  const roadmapList = document.getElementById('roadmap-list');

  // Fetch the roadmap data from the JSON file
  fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/config/Roadmap.json')
    .then(response => response.json())
    .then(data => {
      data.roadmap.forEach(item => {
        const roadmapItem = document.createElement('div');
        roadmapItem.classList.add('bg-gray-50', 'p-6', 'rounded-lg');

        // Define status colors based on status values
        let statusColor;
        switch(item.status) {
          case 'Completed':
            statusColor = 'text-green-600';
            break;
          case 'In Progress':
            statusColor = 'text-amber-600';
            break;
          case 'Not Started':
            statusColor = 'text-gray-500';
            break;
          case 'Delayed':
            statusColor = 'text-orange-600';
            break;
          case 'On Hold':
            statusColor = 'text-red-600';
            break;
          default:
            statusColor = 'text-blue-600';
        }

        roadmapItem.innerHTML = `
          <h3 class="text-xl font-semibold text-indigo-600 mb-2">${item.name}</h3>
          <p class="text-gray-600 mb-2">${item.description}</p>
          <p class="text-gray-600"><strong>Start Date:</strong> ${item.startDate}</p>
          <p class="text-gray-600"><strong>Deadline:</strong> ${item.deadline}</p>
          <p class="text-gray-600"><strong>Status:</strong> <span class="${statusColor}">${item.status}</span></p>
        `;

        roadmapList.appendChild(roadmapItem);
      });
    })
    .catch(error => {
      console.error('Error fetching roadmap data:', error);
    });
});
