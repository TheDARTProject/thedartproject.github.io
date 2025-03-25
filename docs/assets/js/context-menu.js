// context-menu.js

export function setupContextMenu() {
    // Create the context menu element
    const contextMenu = document.createElement('div');
    contextMenu.id = 'custom-context-menu';
    contextMenu.classList.add('hidden');
    document.body.appendChild(contextMenu);

    // Site pages structure
    const sitePages = {
        'Main': '/CDA-Project/index.html',
        'Monitoring': {
            'Dashboard': '/CDA-Project/pages/dashboard.html',
            'Threat Map': '/CDA-Project/pages/threat-map.html',
            'Intel Reports': '/CDA-Project/pages/intelligence.html',
            'Discord App': '/CDA-Project/pages/cda-monitor-app.html'
        },
        'Resources': {
            'Info Center': '/CDA-Project/pages/info.html',
            'Resource Center': '/CDA-Project/pages/resources.html',
            'Frequent Questions': '/CDA-Project/pages/faq.html',
            'Latest News': '/CDA-Project/pages/news.html',
            'Changelog': '/CDA-Project/pages/changelog.html'
        },
        'Planning': {
            'Project Roadmap': '/CDA-Project/pages/roadmap.html'
        },
        'Legal': {
            'License': '/CDA-Project/pages/license.html',
            'Code of Conduct': '/CDA-Project/pages/code-of-conduct.html',
            'Contributions': '/CDA-Project/pages/contributing.html',
            'Security': '/CDA-Project/pages/security.html'
        }
    };

    // Menu items configuration
    const menuItems = [
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

                // Create submenu
                const submenu = document.createElement('div');
                submenu.classList.add('context-submenu', 'hidden');

                // Build submenu items
                Object.entries(item.submenuItems).forEach(([category, pages]) => {
                    if (typeof pages === 'object') {
                        const categoryHeader = document.createElement('div');
                        categoryHeader.classList.add('context-submenu-category');
                        categoryHeader.textContent = category;
                        submenu.appendChild(categoryHeader);

                        Object.entries(pages).forEach(([pageName, pageUrl]) => {
                            const submenuItem = createSubmenuItem(pageName, pageUrl);
                            submenu.appendChild(submenuItem);
                        });
                    } else {
                        const submenuItem = createSubmenuItem(category, pages);
                        submenu.appendChild(submenuItem);
                    }
                });

                menuItem.appendChild(submenu);

                // Show submenu on hover
                menuItem.addEventListener('mouseenter', (e) => {
                    e.stopPropagation();
                    showSubmenu(menuItem, submenu);
                });

                // Hide submenu when leaving menu item
                menuItem.addEventListener('mouseleave', (e) => {
                    e.stopPropagation();
                    setTimeout(() => {
                        if (!submenu.matches(':hover') && !menuItem.matches(':hover')) {
                            submenu.classList.add('hidden');
                        }
                    }, 100);
                });

                // Keep submenu visible when hovering over it
                submenu.addEventListener('mouseenter', (e) => {
                    e.stopPropagation();
                    submenu.classList.remove('hidden');
                });

                // Hide submenu when leaving it
                submenu.addEventListener('mouseleave', (e) => {
                    e.stopPropagation();
                    submenu.classList.add('hidden');
                });
            } else {
                menuItem.innerHTML = `
                    <span class="context-menu-icon">${item.icon}</span>
                    <span class="context-menu-label">${item.label}</span>
                `;
                menuItem.addEventListener('click', () => {
                    item.action();
                    hideContextMenu();
                });
            }

            contextMenu.appendChild(menuItem);
        }
    });

    function createSubmenuItem(label, url) {
        const submenuItem = document.createElement('div');
        submenuItem.classList.add('context-submenu-item');
        submenuItem.textContent = label;
        submenuItem.addEventListener('click', () => {
            window.location.href = url;
            hideContextMenu();
        });
        return submenuItem;
    }

    function showSubmenu(parentItem, submenu) {
        // Hide any other visible submenus first
        document.querySelectorAll('.context-submenu:not(.hidden)').forEach(menu => {
            if (menu !== submenu) menu.classList.add('hidden');
        });

        // Position the submenu
        const parentRect = parentItem.getBoundingClientRect();
        const submenuWidth = 220;
        const spaceRight = window.innerWidth - parentRect.right;

        // Calculate position relative to viewport
        let left = parentRect.right;
        let top = parentRect.top;

        // Adjust if submenu would go off screen
        if (left + submenuWidth > window.innerWidth) {
            left = parentRect.left - submenuWidth;
        }

        if (top + submenu.offsetHeight > window.innerHeight) {
            top = window.innerHeight - submenu.offsetHeight;
        }

        submenu.style.left = `${left}px`;
        submenu.style.top = `${top}px`;
        submenu.classList.remove('hidden');
    }

    function showContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();

        hideContextMenu();

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
        document.querySelectorAll('.context-submenu').forEach(menu => {
            menu.classList.add('hidden');
        });
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