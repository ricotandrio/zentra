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