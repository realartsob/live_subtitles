// news.js
export async function initNewsTicker() {
    // RSS feed URL (using BBC News here as an example)
    const feedUrl = "http://feeds.bbci.co.uk/news/rss.xml";
    try {
      // Use AllOrigins proxy to bypass CORS restrictions
      const proxyUrl = "https://api.allorigins.hexocode.repl.co/get?disableCache=true&url=";
      const response = await fetch(proxyUrl + encodeURIComponent(feedUrl));
      const data = await response.json();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, "text/xml");
      const items = xmlDoc.querySelectorAll("item");
      const headlines = [];
      items.forEach((item, index) => {
        // Limit to the first 10 headlines
        if (index < 10) {
          const title = item.querySelector("title").textContent;
          const link = item.querySelector("link").textContent;
          headlines.push({ title, link });
        }
      });
      populateNewsTicker(headlines);
    } catch (error) {
      console.error("Error fetching RSS feed:", error);
    }
  }
  
  function populateNewsTicker(headlines) {
    const ticker = document.getElementById("newsTicker");
    if (!ticker) return;
    ticker.innerHTML = ""; // Clear any existing content
  
    const tickerContent = document.createElement("div");
    tickerContent.classList.add("ticker-content");
  
    headlines.forEach((item, index) => {
      const headlineLink = document.createElement("a");
      headlineLink.href = "#";
      headlineLink.classList.add("headline");
      headlineLink.innerText = item.title;
      // When clicked, add the news story into the chat
      headlineLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.processUserInput) {
          window.processUserInput("News: " + item.title + "\nRead more: " + item.link);
        }
      });
      tickerContent.appendChild(headlineLink);
      // Add a separator between headlines (except after the last one)
      if (index < headlines.length - 1) {
        const separator = document.createElement("span");
        separator.innerText = " | ";
        tickerContent.appendChild(separator);
      }
    });
  
    ticker.appendChild(tickerContent);
    startTickerAnimation(tickerContent);
  }
  
  function startTickerAnimation(tickerContent) {
    // This function simply adds a class that applies a continuous scroll animation (see CSS below)
    tickerContent.classList.add("scrolling");
  }
  
  // Auto-refresh the news ticker every 5 minutes
  setInterval(initNewsTicker, 300000); // 300000 ms = 5 minutes
  
  // Initialize the ticker when the DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    initNewsTicker();
  });
  