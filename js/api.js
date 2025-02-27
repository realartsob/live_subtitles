export async function loadModels() {
  try {
    const response = await fetch("https://text.pollinations.ai/models");
    const models = await response.json();
    const modelSelect = document.getElementById('modelSelect');
    let optionsHtml = "";
    models.forEach(model => {
      let optionText = model.description;
      if (model.censored === false) {
        optionText += " (uncensored)";
      }
      optionsHtml += `<option value="${model.name}">${optionText}</option>`;
    });
    modelSelect.innerHTML = optionsHtml;
    console.log("Models loaded:", models);
  } catch (error) {
    console.error("Error loading models:", error);
    document.getElementById('status').innerText = "Failed to load models.";
  }
}

export async function getAIResponse(prompt) {
  const model = document.getElementById('modelSelect').value;
  const webSearchEnabled = document.getElementById('webSearchToggle').checked;
  let finalPrompt = prompt;
  
  if (webSearchEnabled) {
    try {
      const searchResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&no_html=1&skip_disambig=1`
      );
      const searchData = await searchResponse.json();
      let searchResults = searchData.AbstractText;
      if (!searchResults || searchResults.trim() === "") {
        if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
          searchResults = searchData.RelatedTopics.slice(0, 3)
            .map(rt => rt.Text)
            .join("\n");
        }
      }
      if (!searchResults || searchResults.trim() === "") {
        searchResults = "No additional information found.";
      }
      finalPrompt = prompt + "\n\nUse the following web search summary to answer the question:\n" + searchResults;
      document.getElementById('status').innerText = "Web search completed and combined with your prompt.";
    } catch (error) {
      console.error("Web search error:", error);
      document.getElementById('status').innerText = "Web search failed; proceeding with original prompt.";
    }
  }
  
  const response = await fetch(`https://text.pollinations.ai/${model}/${encodeURIComponent(finalPrompt)}`);
  const data = await response.text();
  return data;
}

// New function: Convert an RSS feed URL to JSON using your RSS2JSON API key
export async function convertRssToJson(rssUrl, detailed = false) {
  const apiKey = "2mbclpf6gedmku79ixilmwuxtlzacdk72qop3sis";
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=${apiKey}&detailed=${detailed}`;
  try {
    // Force CORS mode in case the endpoint supports it
    const response = await fetch(endpoint, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`RSS2JSON API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error converting RSS to JSON:", error);
    throw error;
  }
}
