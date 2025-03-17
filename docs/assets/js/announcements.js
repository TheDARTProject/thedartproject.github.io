// Announcements.js
document.addEventListener('DOMContentLoaded', function() {
  fetch("https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Announcement.json")
    .then(response => response.json())
    .then(data => {
      const announcementDate = data.date; // Example: "2025-03-16 13:50 GMT+2"
      const announcementText = data.text;

      // Format the version string
      const dateParts = announcementDate.match(/\d+/g);
      const CURRENT_ANNOUNCEMENT_VERSION = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}-${dateParts[3]}-${dateParts[4]}`;

      document.getElementById('announcement-text').textContent = `🔔 Update - ${announcementDate}: ${announcementText}`;

      // Check if announcement was previously closed AND if it's the same version
      const announcementClosed = localStorage.getItem('announcementClosed') === 'true';
      const lastClosedVersion = localStorage.getItem('lastClosedAnnouncementVersion');

      if (announcementClosed && lastClosedVersion === CURRENT_ANNOUNCEMENT_VERSION) {
        document.getElementById('announcement-bar').classList.add('hidden');
      } else {
        document.getElementById('announcement-bar').classList.remove('hidden');
      }

      // Close button logic
      document.getElementById('closeAnnouncement').addEventListener('click', function() {
        document.getElementById('announcement-bar').classList.add('hidden');
        localStorage.setItem('announcementClosed', 'true');
        localStorage.setItem('lastClosedAnnouncementVersion', CURRENT_ANNOUNCEMENT_VERSION);
      });
    })
    .catch(error => console.error("Error fetching announcement:", error));
});