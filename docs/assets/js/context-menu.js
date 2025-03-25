// context-menu.js

export function setupContextMenu() {
    // Create the context menu element
    const contextMenu = document.createElement('div');
    contextMenu.id = 'custom-context-menu';
    contextMenu.classList.add('hidden');
    document.body.appendChild(contextMenu);

    // Site pages structure - flattened without categories
    const sitePages = [
        { label: 'Home Page', url: '/CDA-Project/index.html' },
        { label: 'Dashboard', url: '/CDA-Project/pages/dashboard.html' },
        { label: 'Threat Map', url: '/CDA-Project/pages/threat-map.html' },
        { label: 'Intel Reports', url: '/CDA-Project/pages/intelligence.html' },
        { label: 'Discord App', url: '/CDA-Project/pages/cda-monitor-app.html' },
        { label: 'Info Center', url: '/CDA-Project/pages/info.html' },
        { label: 'Resource Center', url: '/CDA-Project/pages/resources.html' },
        { label: 'Frequent Questions', url: '/CDA-Project/pages/faq.html' },
        { label: 'Latest News', url: '/CDA-Project/pages/news.html' },
        { label: 'Changelog', url: '/CDA-Project/pages/changelog.html' },
        { label: 'Status', url: '/CDA-Project/pages/status.html' },
        { label: 'Project Roadmap', url: '/CDA-Project/pages/roadmap.html' }
    ];

    // Base menu items configuration
    const baseMenuItems = [
        {
            label: 'Back',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>',
            action: () => window.history.back()
        },
        {
            label: 'Forward',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
            action: () => window.history.forward()
        },
        { type: 'separator' },
        {
            label: 'Site Navigation',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>',
            hasSubmenu: true,
            submenuItems: sitePages
        },
        { type: 'separator' },
        {
            label: 'Refresh',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" /></svg>',
            action: () => window.location.reload()
        },
        {
            label: 'View Page Source',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
            action: () => window.open(window.location.href, '_blank').document.write('<pre>' + document.documentElement.outerHTML.replace(/</g, '&lt;') + '</pre>')
        }
    ];

    // Function to get chart name from canvas ID
    function getChartName(canvasId) {
        const chartNames = {
            'timelineChart': 'Attacks Over Time',
            'methodsChart': 'Attack Methods Distribution',
            'surfacesChart': 'Attack Surfaces',
            'regionsChart': 'Suspected Regions of Origin',
            'vectorsChart': 'Attack Vectors Analysis',
            'statusChart': 'URL Status Comparison',
            'behaviourChart': 'Behaviour Types Distribution',
            'methodGoalChart': 'Method vs Goal Matrix',
            'goalsChart': 'Attack Goal Distribution',
            'AccountTypeChart': 'Account Type Distribution',
            'finalDomainsChart': 'Final Domains Distribution',
            'serverCasesChart': 'Cases by Server',
            'averageTimeChart': 'Average Time Till Compromise'
        };
        return chartNames[canvasId] || 'Chart';
    }

    // Function to get watermark position based on chart ID
    function getWatermarkPosition(canvasId) {
        const positions = {
            'timelineChart': 'top-right',
            'methodsChart': 'top-left',
            'surfacesChart': 'top-right',
            'regionsChart': 'top-left',
            'vectorsChart': 'top-right',
            'statusChart': 'top-right',
            'behaviourChart': 'top-left',
            'methodGoalChart': 'top-left',
            'goalsChart': 'top-left',
            'AccountTypeChart': 'top-left',
            'finalDomainsChart': 'top-right',
            'serverCasesChart': 'top-left',
            'averageTimeChart': 'top-right'
        };
        return positions[canvasId] || 'top-left';
    }

    // Function to add watermark to chart image
    async function addWatermarkToChart(chart) {
        return new Promise((resolve) => {
            // Create a canvas for the final image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match the chart
            canvas.width = chart.width;
            canvas.height = chart.height;

            // Draw the original chart
            ctx.drawImage(chart, 0, 0);

            const logo = new Image();
            logo.src = '../images/watermark/CDA-Project.png';

            logo.onload = () => {
                // Set global alpha for semi-transparent logo
                ctx.globalAlpha = 0.5;

                // Get watermark position based on chart ID
                const position = getWatermarkPosition(chart.id);
                const logoWidth = 40;
                const logoHeight = 40;
                const padding = 0;

                // Calculate position
                let x, y;
                switch (position) {
                    case 'top-right':
                        x = canvas.width - logoWidth - padding;
                        y = padding;
                        break;
                    case 'top-left':
                        x = padding;
                        y = padding;
                        break;
                    case 'bottom-right':
                        x = canvas.width - logoWidth - padding;
                        y = canvas.height - logoHeight - padding;
                        break;
                    case 'bottom-left':
                        x = padding;
                        y = canvas.height - logoHeight - padding;
                        break;
                    default:
                        x = padding;
                        y = padding;
                }

                // Draw the logo
                ctx.drawImage(logo, x, y, logoWidth, logoHeight);

                // Reset global alpha
                ctx.globalAlpha = 1.0;

                resolve(canvas.toDataURL('image/png'));
            };

            // If logo fails to load, just return the original chart
            logo.onerror = () => {
                resolve(chart.toDataURL('image/png'));
            };
        });
    }

    // Chart-specific menu items
    const chartMenuItems = [
        {
            label: 'Save Chart As...',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
            action: async (chart) => {
                try {
                    // Add watermark to the chart
                    const watermarkedImage = await addWatermarkToChart(chart.canvas);
                    const chartName = getChartName(chart.canvas.id);
                    const filename = `${chartName.replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;

                    // Create download link
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = watermarkedImage;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (err) {
                    console.error('Error saving chart:', err);
                    // Fallback to original chart if watermark fails
                    const link = document.createElement('a');
                    link.download = 'chart.png';
                    link.href = chart.toBase64Image();
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        },
        {
            label: 'Copy Chart',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>',
            action: async (chart) => {
                try {
                    // Add watermark to the chart
                    const watermarkedImage = await addWatermarkToChart(chart.canvas);

                    // Copy to clipboard
                    const blob = await fetch(watermarkedImage).then(res => res.blob());
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                } catch (err) {
                    console.error('Failed to copy image: ', err);

                    // Fallback for browsers that don't support Clipboard API
                    try {
                        const watermarkedImage = await addWatermarkToChart(chart.canvas);
                        const textArea = document.createElement('textarea');
                        textArea.value = watermarkedImage;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    } catch (fallbackErr) {
                        console.error('Fallback copy failed:', fallbackErr);
                        // Final fallback - copy original chart without watermark
                        const textArea = document.createElement('textarea');
                        textArea.value = chart.toBase64Image();
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                }
            }
        },
        { type: 'separator' }
    ];

    function buildMenuItems(target) {
        // Clear previous menu items
        contextMenu.innerHTML = '';

        let menuItems = [...baseMenuItems];

        // Check if the target is a chart canvas
        if (target.tagName === 'CANVAS' && target.chart) {
            // Add chart-specific items at the beginning
            menuItems = [...chartMenuItems, ...menuItems];
        }

        // Build the menu items
        menuItems.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.classList.add('context-menu-separator');
                contextMenu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.classList.add('context-menu-item');

                if (item.hasSubmenu) {
                    menuItem.classList.add('has-submenu');
                    menuItem.innerHTML = `
                        <span class="context-menu-icon">${item.icon}</span>
                        <span class="context-menu-label">${item.label}</span>
                        <span class="context-menu-arrow">›</span>
                    `;

                    // Create container for submenu items
                    const submenuItemsContainer = document.createElement('div');
                    submenuItemsContainer.classList.add('context-submenu-items');

                    // Build submenu items (simple list without categories)
                    item.submenuItems.forEach(page => {
                        const submenuItem = createSubmenuItem(page.label, page.url);
                        submenuItemsContainer.appendChild(submenuItem);
                    });

                    // Toggle submenu on click
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();

                        // Close all other open submenus
                        document.querySelectorAll('.context-menu-item.open').forEach(openItem => {
                            if (openItem !== menuItem) {
                                openItem.classList.remove('open');
                            }
                        });

                        // Toggle current submenu
                        menuItem.classList.toggle('open');
                    });

                    // Insert the submenu items after the menu item
                    contextMenu.appendChild(menuItem);
                    contextMenu.appendChild(submenuItemsContainer);
                } else {
                    menuItem.innerHTML = `
                        <span class="context-menu-icon">${item.icon}</span>
                        <span class="context-menu-label">${item.label}</span>
                    `;
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (target.tagName === 'CANVAS' && target.chart && item.action) {
                            item.action(target.chart);
                        } else if (item.action) {
                            item.action();
                        }
                        hideContextMenu();
                    });
                    contextMenu.appendChild(menuItem);
                }
            }
        });
    }

    function createSubmenuItem(label, url) {
        const submenuItem = document.createElement('div');
        submenuItem.classList.add('context-submenu-item');
        submenuItem.textContent = label;
        submenuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = url;
            hideContextMenu();
        });
        return submenuItem;
    }

    function showContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();

        // Close any open submenus first
        document.querySelectorAll('.context-menu-item.open').forEach(item => {
            item.classList.remove('open');
        });

        hideContextMenu();

        // Build menu items based on the target
        buildMenuItems(e.target);

        const x = e.clientX;
        const y = e.clientY;
        const menuWidth = 220;
        const menuHeight = contextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const adjustedX = x + menuWidth > windowWidth ? windowWidth - menuWidth - 5 : x;
        const adjustedY = y + menuHeight > windowHeight ? windowHeight - menuHeight - 5 : y;

        contextMenu.style.left = `${adjustedX}px`;
        contextMenu.style.top = `${adjustedY}px`;
        contextMenu.classList.remove('hidden');
    }

    function hideContextMenu() {
        contextMenu.classList.add('hidden');
    }

    // Event listeners
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e);
    });

    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    });

    contextMenu.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupContextMenu();
});