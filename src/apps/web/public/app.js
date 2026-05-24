const logEl = document.getElementById('log');

function log(message) {
  const time = new Date().toLocaleTimeString();
  logEl.innerHTML += `[${time}] ${message}<br/>`;
  logEl.scrollTop = logEl.scrollHeight;
}

async function triggerMarketAnalysisWorker() {
  try {
    const res = await fetch("http://localhost:3000/workers/market-analysis", {
      method: "GET",
    });
    if (res.ok) {
      const data = await res.json();
      log(`Market analysis worker triggered successfully: ${JSON.stringify(data)}`);
    } else {
      log(`Failed to trigger market analysis worker: ${res.statusText}`);
    }
  } catch (err) {
    log(`Error triggering market analysis worker: ${err.message}`);
  }
}

async function sendRequest() {
  const method = document.getElementById('method').value;
  const url = document.getElementById('url').value;
  const headersInput = document.getElementById('headers').value;
  const bodyInput = document.getElementById('body').value;

  let headers = {};
  let body = undefined;

  try {
    headers = headersInput ? JSON.parse(headersInput) : {};
  } catch (e) {
    log('Invalid headers JSON');
    return;
  }

  try {
    if (method !== 'GET') {
      body = bodyInput ? JSON.stringify(JSON.parse(bodyInput)) : undefined;
    }
  } catch (e) {
    log('Invalid body JSON');
    return;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await res.text();

    log(`
      [${method}] ${url}
      Status: ${res.status}
      Response: ${text}
    `);
  } catch (err) {
    log(`Request failed: ${err.message}`);
  }
}

async function emitCustom() {
  const eventName = document.getElementById('eventName').value;
  const payloadInput = document.getElementById('payload').value;

  let payload;

  try {
    payload = JSON.parse(payloadInput);
  } catch (e) {
    log('Invalid JSON payload');
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/dev/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: eventName,
        data: payload
      })
    });

    const result = await res.json();
    log(`Event emitted: ${JSON.stringify(result)}`);
  } catch (err) {
    log(`Error emitting event: ${err.message}`);
  }
}