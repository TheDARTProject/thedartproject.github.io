// theme-loader.js

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('bg-gray-900', 'text-white');
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach(card => {
            card.classList.add('bg-gray-800', 'text-white');
        });
        // Switch to dark image
        const dashboardImage = document.getElementById('dashboard-image');
        if (dashboardImage) {
            dashboardImage.src = "https://raw.githubusercontent.com/TheDARTProject/Website-Images/main/site-images/HOME-IMAGE-DARK.png";
        }
    }
});

// Add this function to handle theme toggles
export function toggleThemeImage(isDarkMode) {
    const dashboardImage = document.getElementById('dashboard-image');
    if (!dashboardImage) return;

    if (isDarkMode) {
        dashboardImage.src = "https://raw.githubusercontent.com/TheDARTProject/Website-Images/main/site-images/HOME-IMAGE-DARK.png";
    } else {
        dashboardImage.src = "https://raw.githubusercontent.com/TheDARTProject/Website-Images/main/site-images/HOME-IMAGE-LIGHT.png";
    }
}