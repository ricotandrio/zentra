const logEl = document.getElementById('log');

function log(message) {
  const time = new Date().toLocaleTimeString();
  logEl.innerHTML += `[${time}] ${message}<br/>`;
  logEl.scrollTop = logEl.scrollHeight;
}

// --- Mock triggers ---

function triggerIHSG() {
  log('Triggering IHSG worker...');
  
  setTimeout(() => {
    log('IHSG worker completed (mock)');
  }, 1000);
}

function triggerPR() {
  log('Triggering PR summary...');
  
  setTimeout(() => {
    log('PR summary generated (mock)');
  }, 1000);
}

// --- Custom event emitter (mock) ---

function emitCustom() {
  const event = document.getElementById('eventName').value;
  const payloadRaw = document.getElementById('payload').value;

  try {
    const payload = JSON.parse(payloadRaw);
    log(`Event emitted: ${event}`);
    log(`Payload: ${JSON.stringify(payload)}`);
  } catch (err) {
    log('Invalid JSON payload');
  }
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