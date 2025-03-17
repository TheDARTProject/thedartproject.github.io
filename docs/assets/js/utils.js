// utils.js

// Function to fetch data from a JSON file
export async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Function to initialize the theme based on user preference
export function initializeTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('bg-gray-900', 'text-white');
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach(card => {
            card.classList.add('bg-gray-800', 'text-white');
        });
    }
}

// Function to toggle dark mode
export function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('bg-gray-900');
    document.body.classList.toggle('bg-gray-900');
    document.body.classList.toggle('text-white');
    const cards = document.querySelectorAll('.bg-white');
    cards.forEach(card => {
        card.classList.toggle('bg-gray-800');
        card.classList.toggle('text-white');
    });
    localStorage.setItem('darkMode', isDarkMode ? 'disabled' : 'enabled');
}

// Function to format a date string
export function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}