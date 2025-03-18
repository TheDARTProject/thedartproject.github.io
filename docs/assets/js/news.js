// news.js

document.addEventListener("DOMContentLoaded", function() {
    const articleCards = document.querySelectorAll(".article-card");
    const loadingSpinner = document.getElementById("loading-spinner");
    const newsContainer = document.getElementById("news-container");
    const placeholderImage = "https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/Placeholder.png";
    const rssFeedUrl = "https://www.digitalvocano.com/cybersecurity/rss/latest-posts";
    const noNewsMessage = document.getElementById("no-news-message");

    // Show loading spinner and hide news container
    loadingSpinner.classList.remove("hidden");
    newsContainer.classList.add("hidden");

    // Function to update article card with data
    function updateArticleCard(articleCard, article) {
        const imageElement = articleCard.querySelector(".article-image");
        const titleElement = articleCard.querySelector(".article-title");
        const descriptionElement = articleCard.querySelector(".article-description");
        const dateElement = articleCard.querySelector(".article-date");
        const authorElement = articleCard.querySelector(".article-author");
        const linkElement = articleCard.querySelector(".article-link");

        const articleImage = article.enclosure?.url || placeholderImage;
        const articleTitle = article.title;
        const articleDescription = article.description.replace(/<[^>]+>/g, ""); // Remove HTML tags
        const articleLink = article.link;
        const articleDate = new Date(article.pubDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const articleAuthor = article.author || "Unknown Author";

        imageElement.src = articleImage;
        imageElement.alt = articleTitle;
        imageElement.onerror = function() {
            this.src = placeholderImage;
        };

        titleElement.textContent = articleTitle;
        descriptionElement.textContent = articleDescription;
        dateElement.textContent = articleDate;
        authorElement.textContent = `By ${articleAuthor}`;
        linkElement.href = articleLink;

        // Make the article card visible
        articleCard.classList.remove("hidden");
    }

    // Fetch and parse the RSS feed
    async function fetchNews() {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`);
            const data = await response.json();

            if (data.status === "ok" && data.items && data.items.length > 0) {
                // Sort articles by date (newest first)
                const sortedArticles = data.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

                // Get only the first 10 articles (or less if there aren't 10)
                const articlesToShow = sortedArticles.slice(0, 10);

                // Update each article card with data
                articleCards.forEach((card, index) => {
                    if (index < articlesToShow.length) {
                        updateArticleCard(card, articlesToShow[index]);
                    } else {
                        // Hide any extra cards if there are fewer than 10 articles
                        card.classList.add("hidden");
                    }
                });

                // Hide loading spinner and show news container
                loadingSpinner.classList.add("hidden");
                newsContainer.classList.remove("hidden");

                if (noNewsMessage) {
                    noNewsMessage.classList.add("hidden");
                }
            } else {
                throw new Error("No news articles found.");
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            loadingSpinner.classList.add("hidden");

            if (noNewsMessage) {
                noNewsMessage.classList.remove("hidden");
            } else {
                // Create a message if it doesn't exist
                const errorMessage = document.createElement("p");
                errorMessage.className = "text-red-500 dark:text-red-400 text-center py-8";
                errorMessage.textContent = "Failed to load news articles. Please try again later.";
                newsContainer.appendChild(errorMessage);
            }

            newsContainer.classList.remove("hidden");
        }
    }

    // Fetch news on page load
    fetchNews();
});