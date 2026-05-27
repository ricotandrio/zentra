const responseLogEl = document.getElementById('responseLog');

/**
 * Add entry to response log
 */
function logResponse(method, url, status, response, isError = false) {
  const time = getCurrentTime();
  const statusClass = isError ? 'error' : status >= 200 && status < 300 ? 'success' : 'pending';

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const statusText = isError ? 'ERROR' : `${status}`;
  entry.innerHTML = `
    <div>
      <span class="log-time">${time}</span>
      <span class="log-method">${method}</span>
      <span style="color: #cbd5e1;">${url}</span>
      <span class="log-status ${statusClass}">${statusText}</span>
    </div>
    <div class="log-body">${typeof response === 'string' ? response : formatJson(response)}</div>
  `;

  responseLogEl.insertBefore(entry, responseLogEl.firstChild);

  // Keep only last 20 entries
  while (responseLogEl.children.length > 20) {
    responseLogEl.removeChild(responseLogEl.lastChild);
  }
}

/**
 * Clear response log
 */
function clearResponseLog() {
  responseLogEl.innerHTML = '';
}

/**
 * Download response log as text
 */
function downloadResponseLog() {
  const logs = Array.from(responseLogEl.children)
    .map((entry) => entry.textContent)
    .join('\n\n');

  downloadFile(`api-log-${new Date().toISOString()}.txt`, logs);
}

/**
 * Clear request form
 */
function clearRequest() {
  document.getElementById('method').value = 'GET';
  document.getElementById('url').value = '';
  document.getElementById('headers').value = '{ "Content-Type": "application/json" }';
  document.getElementById('body').value = '{}';
}

/**
 * Clear event form
 */
function clearEvent() {
  document.getElementById('eventName').value = '';
  document.getElementById('payload').value = '{ "symbol": "^BBCA" }';
}

/**
 * Load preset configurations
 */
function loadPreset(preset) {
  const presets = {
    ping: {
      method: 'GET',
      url: 'http://localhost:3000/health/ping',
      headers: '{ "Content-Type": "application/json" }',
      body: '{}',
    },
    marketAnalysis: {
      method: 'GET',
      url: 'http://localhost:3000/workers/market-analysis',
      headers: '{ "Content-Type": "application/json" }',
      body: '{}',
    },
    getLogs: {
      method: 'GET',
      url: 'http://localhost:3000/logs/query?query={source="system"}&limit=50',
      headers: '{ "Content-Type": "application/json" }',
      body: '{}',
    },
    getStats: {
      method: 'GET',
      url: 'http://localhost:3000/logs/stats',
      headers: '{ "Content-Type": "application/json" }',
      body: '{}',
    },
  };

  const config = presets[preset];
  if (config) {
    document.getElementById('method').value = config.method;
    document.getElementById('url').value = config.url;
    document.getElementById('headers').value = config.headers;
    document.getElementById('body').value = config.body;

    logResponse(config.method, config.url, '-', 'Preset loaded. Click "Send Request" to execute.');
  }
}

/**
 * Send HTTP request
 */
async function sendRequest() {
  const method = document.getElementById('method').value;
  const url = document.getElementById('url').value;
  const headersInput = document.getElementById('headers').value;
  const bodyInput = document.getElementById('body').value;

  // Validate URL
  if (!url) {
    logResponse('', '', '', 'Error: URL is required', true);
    return;
  }

  let headers = {};
  let body = undefined;

  try {
    headers = parseJson(headersInput) || {};
  } catch (e) {
    logResponse(method, url, '', `Error: Invalid headers JSON - ${e.message}`, true);
    return;
  }

  try {
    if (method !== 'GET' && method !== 'HEAD') {
      const parsedBody = parseJson(bodyInput);
      body = parsedBody ? JSON.stringify(parsedBody) : undefined;
    }
  } catch (e) {
    logResponse(method, url, '', `Error: Invalid body JSON - ${e.message}`, true);
    return;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await response.text();
    const json = parseJson(text);

    logResponse(method, url, response.status, json || text);
  } catch (err) {
    logResponse(method, url, '', `Error: ${err.message}`, true);
  }
}

/**
 * Emit custom event
 */
async function emitCustom() {
  const eventType = document.getElementById('eventName').value;
  const payloadInput = document.getElementById('payload').value;

  // Validate event type
  if (!eventType) {
    logResponse('POST', '/dev/events', '', 'Error: Event type is required', true);
    return;
  }

  const payload = parseJson(payloadInput);
  if (!payload) {
    logResponse('POST', '/dev/events', '', 'Error: Invalid JSON payload', true);
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/dev/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: eventType,
        data: payload,
      }),
    });

    const text = await response.text();
    const json = parseJson(text);

    logResponse('POST', `/dev/events (${eventType})`, response.status, json || text);
  } catch (err) {
    logResponse('POST', '/dev/events', '', `Error: ${err.message}`, true);
  }
}

// Log initial message
logResponse('-', '-', '-', 'API Client ready. Select a preset or enter custom request details.');
