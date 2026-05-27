const logEl = document.getElementById('log');

/**
 * Log a message to the activity log
 */
function log(message) {
  const time = getCurrentTime();
  logEl.innerHTML += `[${time}] ${message}<br/>`;
  logEl.scrollTop = logEl.scrollHeight;
}

/**
 * Trigger market analysis worker
 */
async function triggerMarketAnalysisWorker() {
  try {
    const res = await fetch('http://localhost:3000/workers/market-analysis', {
      method: 'GET',
    });
    if (res.ok) {
      const data = await res.json();
      log(`✅ Market analysis worker triggered: ${JSON.stringify(data)}`);
    } else {
      log(`❌ Failed to trigger market analysis worker: ${res.statusText}`);
    }
  } catch (err) {
    log(`❌ Error triggering market analysis worker: ${err.message}`);
  }
}

// Log startup message
log('Dev panel ready. Use Quick Actions to test features or navigate to other tools.');
