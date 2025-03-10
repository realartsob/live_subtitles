import { convertRssToJson } from './api.js';

let rssFeeds = ["https://feeds.bbci.co.uk/news/rss.xml"]; // default feed

export async function initNewsTicker() {
  // Merge headlines from all feeds
  let allHeadlines = [];
  const fetchPromises = rssFeeds.map(feedUrl => fetchFeedHeadlines(feedUrl));
  const results = await Promise.all(fetchPromises);
  results.forEach(headlines => {
    if (headlines && headlines.length) {
      allHeadlines = allHeadlines.concat(headlines);
    }
  });
  populateNewsTicker(allHeadlines);
}

async function fetchFeedHeadlines(feedUrl) {
  try {
    // Fetch and convert the RSS feed to JSON using the rss2json API.
    // The call now limits the results to 5 items per feed.
    const data = await convertRssToJson(feedUrl, 5);
    if (data.status !== "ok") {
      console.error("Error fetching feed via rss2json:", data);
      return [];
    }
    const items = data.items;
    const headlines = [];
    items.forEach(item => {
      headlines.push({
        title: item.title,
        link: item.link
      });
    });
    return headlines;
  } catch (error) {
    console.error("Error fetching RSS feed using rss2json:", feedUrl, error);
    return [];
  }
}

function populateNewsTicker(headlines) {
  const ticker = document.getElementById("newsTicker");
  if (!ticker) return;
  ticker.innerHTML = "";

  const tickerContent = document.createElement("div");
  tickerContent.classList.add("ticker-content");

  if (headlines.length === 0) {
    tickerContent.innerText = "No headlines available.";
  } else {
    headlines.forEach((item, index) => {
      const headlineLink = document.createElement("a");
      headlineLink.href = "#";
      headlineLink.classList.add("headline");
      headlineLink.innerText = item.title;
      // On click, add the news story into the chat
      headlineLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.processUserInput) {
          window.processUserInput("News: " + item.title + "\nRead more: " + item.link);
        }
      });
      tickerContent.appendChild(headlineLink);
      if (index < headlines.length - 1) {
        const separator = document.createElement("span");
        separator.innerText = " | ";
        tickerContent.appendChild(separator);
      }
    });
  }

  ticker.appendChild(tickerContent);
  startTickerAnimation(tickerContent);
}

function startTickerAnimation(tickerContent) {
  // Restart animation by forcing reflow
  tickerContent.style.animation = "none";
  tickerContent.offsetHeight; // force reflow
  tickerContent.style.animation = "";
  tickerContent.classList.add("scrolling");
}

// RSS Feed list management
export function renderRssFeedList() {
  const feedListContainer = document.getElementById("rssFeedList");
  if (!feedListContainer) return;
  feedListContainer.innerHTML = "";
  rssFeeds.forEach((feedUrl, index) => {
    const feedItem = document.createElement("div");
    feedItem.classList.add("feed-item");
    feedItem.innerText = feedUrl;
    const removeBtn = document.createElement("button");
    removeBtn.innerText = "Remove";
    removeBtn.addEventListener("click", () => {
      rssFeeds.splice(index, 1);
      renderRssFeedList();
      initNewsTicker();
    });
    feedItem.appendChild(removeBtn);
    feedListContainer.appendChild(feedItem);
  });
}

export function initRssFeedControls() {
  const addBtn = document.getElementById("addRssFeedBtn");
  const feedInput = document.getElementById("rssFeedInput");
  if (addBtn && feedInput) {
    addBtn.addEventListener("click", () => {
      const newFeedUrl = feedInput.value.trim();
      if (newFeedUrl) {
        rssFeeds.push(newFeedUrl);
        feedInput.value = "";
        renderRssFeedList();
        initNewsTicker();
      }
    });
  }
  renderRssFeedList();
}

// Auto-refresh the ticker every 5 minutes
setInterval(initNewsTicker, 300000);

document.addEventListener("DOMContentLoaded", () => {
  initRssFeedControls();
  initNewsTicker();
});
