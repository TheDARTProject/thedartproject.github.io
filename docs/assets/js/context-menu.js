// context-menu.js

export function setupContextMenu() {
    // Create the context menu element
    const contextMenu = document.createElement('div');
    contextMenu.id = 'custom-context-menu';
    contextMenu.classList.add('hidden');
    document.body.appendChild(contextMenu);

    // Site pages structure - flattened without categories
    const sitePages = [{
            label: 'Home Page',
            url: '/CDA-Project/index.html'
        },
        {
            label: 'Dashboard',
            url: '/CDA-Project/pages/dashboard.html'
        },
        {
            label: 'Database',
            url: '/CDA-Project/pages/database.html'
        },
        {
            label: 'Threat Map',
            url: '/CDA-Project/pages/threat-map.html'
        },
        {
            label: 'Intel Reports',
            url: '/CDA-Project/pages/intelligence.html'
        },
        {
            label: 'Discord App',
            url: '/CDA-Project/pages/cda-monitor-app.html'
        },
        {
            label: 'Info Center',
            url: '/CDA-Project/pages/info.html'
        },
        {
            label: 'Resource Center',
            url: '/CDA-Project/pages/resources.html'
        },
        {
            label: 'Frequent Questions',
            url: '/CDA-Project/pages/faq.html'
        },
        {
            label: 'Latest News',
            url: '/CDA-Project/pages/news.html'
        },
        {
            label: 'Changelog',
            url: '/CDA-Project/pages/changelog.html'
        },
        {
            label: 'Status',
            url: '/CDA-Project/pages/status.html'
        },
        {
            label: 'Project Roadmap',
            url: '/CDA-Project/pages/roadmap.html'
        }
    ];

    // Base menu items configuration
    const baseMenuItems = [{
            label: 'Back',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>',
            action: () => window.history.back()
        },
        {
            label: 'Forward',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
            action: () => window.history.forward()
        },
        {
            type: 'separator'
        },
        {
            label: 'Site Navigation',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>',
            hasSubmenu: true,
            submenuItems: sitePages
        },
        {
            type: 'separator'
        },
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
            'serverAttackTrendsChart': 'Server-Specific Attack Trends',
            'goalsChart': 'Attack Goal Distribution',
            'AccountTypeChart': 'Account Type Distribution',
            'finalDomainsChart': 'Final Domains Distribution',
            'serverCasesChart': 'Cases by Server',
            'averageTimeChart': 'Average Time Till Compromise',
            'temporalPatternChart': 'Temporal Attack Pattern Analysis'
        };
        return chartNames[canvasId] || 'Chart';
    }

    // Function to create a high-resolution version of the chart
    async function createHighResChart(chart) {
        return new Promise((resolve) => {
            // Configuration - adjust these values as needed
            const config = {
                scaleFactor: 4,
                borderSize: 100, // in 1x pixels (will be scaled)
                watermark: {
                    width: 130, // in 1x pixels
                    height: 70, // in 1x pixels
                    topPadding: -30, // in 1x pixels
                    opacity: 1
                },
                chartName: {
                    font: 'Arial',
                    size: 24, // Base font size (for first line)
                    secondarySize: 20, // Font size for timestamp line
                    color: '#ffffff',
                    bottomPadding: 40, // Increased to accommodate two lines
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                    lineSpacing: 15 // Space between the two lines
                }
            };

            // Get the original canvas
            const sourceCanvas = chart.canvas;

            // Scale configuration values
            const scaled = {
                border: config.borderSize * config.scaleFactor,
                watermarkWidth: config.watermark.width * config.scaleFactor,
                watermarkHeight: config.watermark.height * config.scaleFactor,
                watermarkPadding: config.watermark.topPadding * config.scaleFactor,
                fontSize: config.chartName.size * config.scaleFactor,
                secondaryFontSize: config.chartName.secondarySize * config.scaleFactor,
                namePadding: config.chartName.bottomPadding * config.scaleFactor,
                lineSpacing: config.chartName.lineSpacing * config.scaleFactor
            };

            // Create a new canvas with scaled resolution plus borders
            const canvas = document.createElement('canvas');
            canvas.width = (sourceCanvas.width * config.scaleFactor) + (scaled.border * 2);
            canvas.height = (sourceCanvas.height * config.scaleFactor) + (scaled.border * 2);
            const ctx = canvas.getContext('2d');

            // Fill entire canvas with solid background color
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the original chart centered with border
            ctx.save();
            ctx.translate(scaled.border, scaled.border);
            ctx.scale(config.scaleFactor, config.scaleFactor);
            ctx.drawImage(sourceCanvas, 0, 0);
            ctx.restore();

            const logo = new Image();
            logo.src = '../images/watermark/Watermark-Logo.png';

            // Function to draw the two-line text
            const drawChartText = () => {
                const chartName = getChartName(chart.canvas.id);
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', {
                    timeZone: 'UTC',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const dateString = now.toLocaleDateString('en-GB'); // DD-MM-YYYY format

                // Set common text properties
                ctx.fillStyle = config.chartName.color;
                ctx.textAlign = 'center';

                // Add text shadow if specified
                if (config.chartName.textShadow) {
                    ctx.shadowColor = config.chartName.textShadow.split(' ')[3];
                    ctx.shadowOffsetX = parseInt(config.chartName.textShadow.split(' ')[0]);
                    ctx.shadowOffsetY = parseInt(config.chartName.textShadow.split(' ')[1]);
                    ctx.shadowBlur = parseInt(config.chartName.textShadow.split(' ')[2]);
                }

                // Calculate base Y position
                const baseY = canvas.height - scaled.namePadding;

                // First line: Chart name
                const textFont = `bold ${scaled.fontSize}px ${config.chartName.font}`;
                ctx.font = textFont;
                ctx.fillText(`${chartName} Chart`, canvas.width / 2, baseY - scaled.lineSpacing);

                // Second line: Timestamp
                ctx.font = textFont; // Re-use the same font definition
                ctx.fillText(`Generated at ${timeString} UTC on ${dateString}`, canvas.width / 2, baseY + scaled.fontSize);

                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 0;
            };

            logo.onload = () => {
                // Set global alpha for semi-transparent logo
                ctx.globalAlpha = config.watermark.opacity;

                // Position watermark at top center (accounting for border)
                const watermarkX = (canvas.width / 2) - (scaled.watermarkWidth / 2);
                const watermarkY = scaled.watermarkPadding + (scaled.border / 2);

                // Draw the logo
                ctx.drawImage(logo, watermarkX, watermarkY, scaled.watermarkWidth, scaled.watermarkHeight);

                // Reset global alpha
                ctx.globalAlpha = 1.0;

                // Draw the two-line chart text
                drawChartText();

                resolve(canvas);
            };

            // If logo fails to load, still add the chart text
            logo.onerror = () => {
                // Draw the two-line chart text
                drawChartText();

                resolve(canvas);
            };
        });
    }

    // Function to share chart
    async function shareChart(chart) {
        try {
            // First try the Web Share API if available
            if (navigator.share) {
                const highResCanvas = await createHighResChart(chart);
                const chartName = getChartName(chart.canvas.id);

                // Convert canvas to blob
                highResCanvas.toBlob(async (blob) => {
                    const file = new File([blob], `${chartName}.png`, {
                        type: 'image/png'
                    });

                    try {
                        await navigator.share({
                            title: `${chartName} Chart`,
                            text: `Check out this ${chartName} chart from CDA Project`,
                            files: [file]
                        });
                    } catch (shareError) {
                        console.log('Web Share API failed, falling back to custom share', shareError);
                        showCustomShareDialog(chart, highResCanvas);
                    }
                }, 'image/png', 1.0);
            } else {
                // Fallback to custom share dialog
                const highResCanvas = await createHighResChart(chart);
                showCustomShareDialog(chart, highResCanvas);
            }
        } catch (err) {
            console.error('Error sharing chart:', err);
            alert('Failed to share chart. Please try again or use the "Save Chart" option.');
        }
    }

    // Function to show custom share dialog
    function showCustomShareDialog(chart, canvas) {
        const chartName = getChartName(chart.canvas.id);
        const dataUrl = canvas.toDataURL('image/png');
        const pageUrl = window.location.href.split('#')[0];

        // Create share dialog
        const shareDialog = document.createElement('div');
        shareDialog.id = 'chart-share-dialog';
        shareDialog.style.position = 'fixed';
        shareDialog.style.top = '50%';
        shareDialog.style.left = '50%';
        shareDialog.style.transform = 'translate(-50%, -50%)';
        shareDialog.style.backgroundColor = document.body.classList.contains('bg-gray-900') ? '#1f2937' : 'white';
        shareDialog.style.padding = '20px';
        shareDialog.style.borderRadius = '8px';
        shareDialog.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        shareDialog.style.zIndex = '10000';
        shareDialog.style.width = '300px';
        shareDialog.style.maxWidth = '90%';

        shareDialog.innerHTML = `
            <h3 style="margin-top: 0; color: ${document.body.classList.contains('bg-gray-900') ? 'white' : 'black'}">Share ${chartName}</h3>
            <div style="display: flex; justify-content: space-around; margin: 15px 0;">
                <button class="share-option" data-platform="twitter" style="background: none; border: none; cursor: pointer;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </button>
                <button class="share-option" data-platform="facebook" style="background: none; border: none; cursor: pointer;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg>
                </button>
                <button class="share-option" data-platform="linkedin" style="background: none; border: none; cursor: pointer;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </button>
                <button class="share-option" data-platform="copy" style="background: none; border: none; cursor: pointer;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#666"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="cancel-share" style="flex: 1; padding: 8px; border: none; border-radius: 4px; background: #e5e7eb; cursor: pointer;">Cancel</button>
            </div>
        `;

        document.body.appendChild(shareDialog);

        // Add event listeners
        document.querySelectorAll('.share-option').forEach(button => {
            button.addEventListener('click', () => {
                const platform = button.getAttribute('data-platform');
                const text = `Check out this ${chartName} chart from CDA Project`;

                switch (platform) {
                    case 'twitter':
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`, '_blank');
                        break;
                    case 'facebook':
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(text)}`, '_blank');
                        break;
                    case 'linkedin':
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, '_blank');
                        break;
                    case 'copy':
                        navigator.clipboard.writeText(`${text}\n${pageUrl}`);
                        alert('Link copied to clipboard!');
                        break;
                }

                document.body.removeChild(shareDialog);
            });
        });

        document.getElementById('cancel-share').addEventListener('click', () => {
            document.body.removeChild(shareDialog);
        });

        // Close on click outside
        document.addEventListener('click', function handleOutsideClick(e) {
            if (!shareDialog.contains(e.target)) {
                document.body.removeChild(shareDialog);
                document.removeEventListener('click', handleOutsideClick);
            }
        });
    }

    // Chart-specific menu items
    const chartMenuItems = [{
            label: 'Save Chart As...',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
            action: async (chart) => {
                try {
                    // Create high-resolution version of the chart
                    const highResCanvas = await createHighResChart(chart);
                    const chartName = getChartName(chart.canvas.id);
                    const filename = `${chartName.replace(/ /g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;

                    // Create download link
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = highResCanvas.toDataURL('image/png', 1.0); // Highest quality
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (err) {
                    console.error('Error saving chart:', err);
                    // Fallback to original resolution with solid background
                    const fallbackCanvas = document.createElement('canvas');
                    fallbackCanvas.width = chart.canvas.width;
                    fallbackCanvas.height = chart.canvas.height;
                    const fallbackCtx = fallbackCanvas.getContext('2d');
                    fallbackCtx.fillStyle = '#1e293b';
                    fallbackCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
                    fallbackCtx.drawImage(chart.canvas, 0, 0);

                    const link = document.createElement('a');
                    link.download = 'chart.png';
                    link.href = fallbackCanvas.toDataURL('image/png');
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
                    // Create high-resolution version of the chart
                    const highResCanvas = await createHighResChart(chart);

                    // Convert to blob with highest quality
                    highResCanvas.toBlob(async (blob) => {
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({
                                    'image/png': blob
                                })
                            ]);
                        } catch (err) {
                            console.error('Failed to copy image: ', err);
                            throw err; // Trigger fallback
                        }
                    }, 'image/png', 1.0);
                } catch (err) {
                    console.error('Failed to copy image: ', err);

                    // Fallback for browsers that don't support Clipboard API or high-res failed
                    try {
                        const fallbackCanvas = await createHighResChart(chart);
                        const dataUrl = fallbackCanvas.toDataURL('image/png');

                        // Old-school copy method
                        const textArea = document.createElement('textarea');
                        textArea.value = dataUrl;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    } catch (fallbackErr) {
                        console.error('Fallback copy failed:', fallbackErr);

                        // Final fallback - original resolution with solid background
                        const finalCanvas = document.createElement('canvas');
                        finalCanvas.width = chart.canvas.width;
                        finalCanvas.height = chart.canvas.height;
                        const finalCtx = finalCanvas.getContext('2d');
                        finalCtx.fillStyle = '#1e293b';
                        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                        finalCtx.drawImage(chart.canvas, 0, 0);

                        const textArea = document.createElement('textarea');
                        textArea.value = finalCanvas.toDataURL('image/png');
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                }
            }
        },
        {
            label: 'Share Chart',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>',
            action: (chart) => shareChart(chart)
        },
        {
            type: 'separator'
        }
    ];

    // Image-specific menu items
    const imageMenuItems = [{
            label: 'Save Image As...',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
            action: (img) => {
                try {
                    // Create download link
                    const link = document.createElement('a');
                    const url = img.src;
                    const filename = url.substring(url.lastIndexOf('/') + 1).split('?')[0].split('#')[0];
                    link.download = filename || 'image.png';
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (err) {
                    console.error('Error saving image:', err);
                    alert('Failed to save image. Please try again.');
                }
            }
        },
        {
            label: 'Copy Image',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>',
            action: async (img) => {
                try {
                    // First try the modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.write) {
                        const response = await fetch(img.src);
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                [blob.type]: blob
                            })
                        ]);
                    } else {
                        // Fallback for older browsers
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        // Create a temporary textarea with the data URL
                        const textArea = document.createElement('textarea');
                        textArea.value = canvas.toDataURL('image/png');
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }
                } catch (err) {
                    console.error('Failed to copy image:', err);
                    alert('Failed to copy image. Please try again or use the "Save Image" option.');
                }
            }
        },
        {
            type: 'separator'
        }
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
        // Check if the target is an image
        else if (target.tagName === 'IMG') {
            // Add image-specific items at the beginning
            menuItems = [...imageMenuItems, ...menuItems];
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

                    // Only open submenu on click, not hover
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

                        // Position the submenu after it's opened
                        if (menuItem.classList.contains('open')) {
                            positionSubmenu(menuItem, submenuItemsContainer);
                        }
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
                        } else if (target.tagName === 'IMG' && item.action) {
                            item.action(target);
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

    function positionSubmenu(menuItem, submenu) {
        const menuItemRect = menuItem.getBoundingClientRect();
        const contextMenuRect = contextMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate available space
        const spaceRight = windowWidth - menuItemRect.right;
        const spaceLeft = menuItemRect.left;
        const spaceBottom = windowHeight - menuItemRect.bottom;

        // Default position (to the right)
        let submenuLeft = menuItemRect.right - contextMenuRect.left;
        let submenuTop = menuItemRect.top - contextMenuRect.top;

        // Check if submenu would go off right edge
        if (spaceRight < submenu.offsetWidth && spaceLeft >= submenu.offsetWidth) {
            // Position to the left if there's more space there
            submenuLeft = menuItemRect.left - contextMenuRect.left - submenu.offsetWidth;
        }

        // Check if submenu would go off bottom edge
        if (spaceBottom < submenu.offsetHeight) {
            // Position above if there's more space there
            submenuTop = menuItemRect.bottom - contextMenuRect.top - submenu.offsetHeight;
        }

        // Apply the calculated position
        submenu.style.left = `${submenuLeft}px`;
        submenu.style.top = `${submenuTop}px`;
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
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // First show the menu to get accurate measurements
        contextMenu.classList.remove('hidden');

        // Get the actual rendered height (now that it's visible)
        const actualMenuHeight = contextMenu.offsetHeight;
        const actualMenuWidth = contextMenu.offsetWidth;

        // Calculate if we need to adjust position
        let adjustedX = x;
        let adjustedY = y;

        // Check right edge
        if (x + actualMenuWidth > windowWidth) {
            adjustedX = windowWidth - actualMenuWidth - 5;
        }

        // Check bottom edge
        if (y + actualMenuHeight > windowHeight) {
            adjustedY = windowHeight - actualMenuHeight - 5;
        }

        // Apply the position
        contextMenu.style.left = `${adjustedX}px`;
        contextMenu.style.top = `${adjustedY}px`;
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