/**
 * Common utilities shared across all pages
 */

/**
 * Navigate to external page
 */
function navigateTo(page) {
  const routes = {
    home: '../home/home.html',
    'api-client': '../api-client/api-client.html',
    logging: '../logging/logging.html',
  };

  const url = routes[page];
  if (url) {
    window.location.href = url;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format JSON with proper indentation
 */
function formatJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

/**
 * Parse JSON safely
 */
function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

/**
 * Get current time as formatted string
 */
function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

/**
 * Download text as file
 */
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error('Failed to copy:', err);
  });
}

/** 
 * Toggle visibility of card body 
 */
function toggleCard(cardId) {
  const cardBody = document.getElementById(cardId);
  if (cardBody) {
    cardBody.style.display = cardBody.style.display === 'none' ? 'block' : 'none';
  }
}