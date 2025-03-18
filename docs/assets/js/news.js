// news.js

document.addEventListener("DOMContentLoaded", function() {
    const newsContainer = document.getElementById("news-container");
    const loadingSpinner = document.getElementById("loading-spinner");
    const placeholderImage = "https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/docs/images/site-images/Placeholder.png";
    const rssFeedUrl = "https://www.digitalvocano.com/cybersecurity/rss/latest-posts";

    // Show loading spinner and hide news container
    loadingSpinner.classList.remove("hidden");
    newsContainer.classList.add("hidden");

    // Function to generate article cards
    function createArticleCard(article) {
        const articleCard = document.createElement("div");
        articleCard.className = "bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col dark:bg-gray-800 dark:text-gray-200";

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

        articleCard.innerHTML = `
      <img src="${articleImage}" alt="${articleTitle}" class="w-full h-48 object-cover rounded-t-lg mb-4" onerror="this.src='${placeholderImage}'">
      <h3 class="text-xl font-semibold text-indigo-600 mb-2 dark:text-indigo-400">${articleTitle}</h3>
      <p class="text-gray-600 mb-4 flex-grow dark:text-gray-300">${articleDescription}</p>
      <div class="flex justify-between items-center text-sm text-gray-500 mb-4 dark:text-gray-400">
        <span>${articleDate}</span>
        <span>By ${articleAuthor}</span>
      </div>
      <a href="${articleLink}" target="_blank" rel="noopener noreferrer" class="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors dark:bg-indigo-700 dark:hover:bg-indigo-600">
        Read More
      </a>
    `;

        return articleCard;
    }

    // Fetch and parse the RSS feed
    async function fetchNews() {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`);
            const data = await response.json();

            if (data.status === "ok" && data.items) {
                // Clear the container before adding new articles
                newsContainer.innerHTML = "";

                // Sort articles by date (newest first)
                const sortedArticles = data.items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

                // Generate article cards and append them to the container
                sortedArticles.forEach((article) => {
                    const articleCard = createArticleCard(article);
                    newsContainer.appendChild(articleCard);
                });

                // Hide loading spinner and show news container
                loadingSpinner.classList.add("hidden");
                newsContainer.classList.remove("hidden");
            } else {
                throw new Error("Failed to fetch news articles.");
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            loadingSpinner.classList.add("hidden");
            newsContainer.innerHTML = `<p class="text-red-500 dark:text-red-400">Failed to load news articles. Please try again later.</p>`;
            newsContainer.classList.remove("hidden");
        }
    }

    // Fetch news on page load
    fetchNews();
});