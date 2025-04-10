// partners.js

export async function initializeCarousel() {
    try {
        // Fetch partners data from GitHub
        const response = await fetch('https://raw.githubusercontent.com/TheDARTProject/Website-Configs/refs/heads/main/Partners.json');
        if (!response.ok) {
            throw new Error('Failed to fetch partners data');
        }
        const partners = await response.json();

        const partnersTrack = document.querySelector('.partners-track');

        // Clear any existing content
        partnersTrack.innerHTML = '';

        // Duplicate partners for seamless looping (original + copy)
        const duplicatedPartners = [...partners, ...partners];

        // Create partner logo elements
        duplicatedPartners.forEach(partner => {
            const logoContainer = document.createElement('a');
            logoContainer.href = partner.url;
            logoContainer.target = "_blank";
            logoContainer.rel = "noopener noreferrer";
            logoContainer.className = 'partner-logo';
            logoContainer.title = partner.name;
            logoContainer.setAttribute('aria-label', partner.name);

            const imgElement = document.createElement('img');
            imgElement.src = partner.image;
            imgElement.alt = `${partner.name} logo`;
            imgElement.loading = 'lazy';
            imgElement.width = 100;
            imgElement.height = 100;

            // Error handling for broken images
            imgElement.onerror = () => {
                logoContainer.classList.add('logo-error');
                logoContainer.innerHTML = `<span>${partner.name}</span>`;
            };

            logoContainer.appendChild(imgElement);
            partnersTrack.appendChild(logoContainer);
        });

        // Pause animation on hover
        const carousel = document.querySelector('.partners-carousel');
        carousel.addEventListener('mouseenter', () => {
            partnersTrack.style.animationPlayState = 'paused';
        });

        carousel.addEventListener('mouseleave', () => {
            partnersTrack.style.animationPlayState = 'running';
        });

        // Touch events for mobile
        let touchStartX = 0;
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            partnersTrack.style.animationPlayState = 'paused';
        }, {
            passive: true
        });

        carousel.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (Math.abs(touchEndX - touchStartX) < 50) {
                partnersTrack.style.animationPlayState = 'running';
            }
        }, {
            passive: true
        });

    } catch (error) {
        console.error('Error initializing partners carousel:', error);
        // Fallback: Show message in carousel container
        const carousel = document.querySelector('.partners-carousel');
        carousel.innerHTML = `
            <div class="text-center p-4 text-gray-600">
                <p>Unable to load partners. Please try again later.</p>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCarousel);