const API_BASE = 'http://localhost:3000';
let currentQuery = '';
let currentLimit = 50;
let currentOffset = 0;

// Initialize date inputs with today
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterStartDate').value = today;
  document.getElementById('filterEndDate').value = today;
});

/**
 * Build LogQL query from filter form
 */
function buildLogQLQuery() {
  const source = document.getElementById('filterSource').value;
  const operation = document.getElementById('filterOperation').value;
  const requestId = document.getElementById('filterRequestId').value;
  const eventId = document.getElementById('filterEventId').value;
  const level = document.getElementById('filterLevel').value;
  const message = document.getElementById('filterMessage').value;

  let query = '';

  // Build label filters
  const labels = [];
  if (source) labels.push(`source="${source}"`);
  if (operation) labels.push(`operation="${operation}"`);
  if (requestId) labels.push(`requestId="${requestId}"`);
  if (eventId) labels.push(`eventId="${eventId}"`);

  if (labels.length > 0) {
    query = `{${labels.join(', ')}}`;
  }

  // Add level filter
  if (level) {
    if (query) query += ` | `;
    query += `level="${level}"`;
  }

  // Add message filter
  if (message) {
    if (query) query += ` | `;
    query += `message contains "${message}"`;
  }

  return query;
}

/**
 * Clear all filters
 */
function clearFilters() {
  document.getElementById('filterSource').value = '';
  document.getElementById('filterOperation').value = '';
  document.getElementById('filterRequestId').value = '';
  document.getElementById('filterEventId').value = '';
  document.getElementById('filterLevel').value = '';
  document.getElementById('filterMessage').value = '';
  document.getElementById('logsContainer').innerHTML = '';
  document.getElementById('resultCount').textContent = '0';
  currentOffset = 0;
  document.getElementById('currentOffset').value = '0';
}

/**
 * Apply filters and search logs
 */
async function applyFilters() {
  currentQuery = buildLogQLQuery();
  currentLimit = parseInt(document.getElementById('filterLimit').value) || 50;
  currentOffset = 0;
  document.getElementById('currentOffset').value = '0';

  await fetchLogs();
}

/**
 * Fetch logs from API
 */
async function fetchLogs() {
  try {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    let url = `${API_BASE}/logs/query?query=${encodeURIComponent(currentQuery)}&limit=${currentLimit}&offset=${currentOffset}`;

    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      displayLogs(result.data);
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Error fetching logs: ' + error.message);
  }
}

/**
 * Display logs in the UI
 */
function displayLogs(data) {
  const container = document.getElementById('logsContainer');
  container.innerHTML = '';

  if (data.logs.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; text-align: center;">No logs found</p>';
    document.getElementById('resultCount').textContent = '0';
    document.getElementById('currentPage').textContent = '1';
    document.getElementById('totalPages').textContent = '1';
    return;
  }

  // Display log entries
  data.logs.forEach((log) => {
    const entry = createLogEntry(log);
    container.appendChild(entry);
  });

  // Update pagination
  const totalPages = Math.ceil(data.total / data.limit);
  const currentPage = Math.floor(data.offset / data.limit) + 1;

  document.getElementById('resultCount').textContent = data.total;
  document.getElementById('currentPage').textContent = currentPage;
  document.getElementById('totalPages').textContent = totalPages;
}

/**
 * Create a log entry element
 */
function createLogEntry(log) {
  const div = document.createElement('div');
  div.className = `log-entry ${log.level}`;
  div.onclick = () => showLogDetail(log);

  const timestamp = new Date(log.timestamp).toLocaleString();

  let meta = '';
  if (log.source) meta += `<span class="meta-tag">source: ${log.source}</span>`;
  if (log.operation) meta += `<span class="meta-tag">operation: ${log.operation}</span>`;
  if (log.requestId) meta += `<span class="meta-tag">request: ${log.requestId}</span>`;
  if (log.eventId) meta += `<span class="meta-tag">event: ${log.eventId}</span>`;

  div.innerHTML = `
    <div class="log-header">
      <span class="log-level ${log.level}">${log.level}</span>
      <span class="log-timestamp">${timestamp}</span>
    </div>
    <div class="log-message">${escapeHtml(log.message)}</div>
    <div class="log-meta">${meta}</div>
  `;

  return div;
}

/**
 * Show log detail in modal
 */
function showLogDetail(log) {
  const modal = document.getElementById('logModal');
  const detail = document.getElementById('logDetail');

  const logJson = {
    timestamp: log.timestamp,
    level: log.level,
    source: log.source,
    operation: log.operation,
    requestId: log.requestId,
    eventId: log.eventId,
    message: log.message,
    metadata: log.metadata || {},
    error: log.error || null,
  };

  detail.textContent = formatJson(logJson);
  modal.style.display = 'block';
}

/**
 * Close log modal
 */
function closeLogModal() {
  document.getElementById('logModal').style.display = 'none';
}

/**
 * Go to previous page
 */
function previousPage() {
  if (currentOffset > 0) {
    currentOffset = Math.max(0, currentOffset - currentLimit);
    document.getElementById('currentOffset').value = currentOffset;
    fetchLogs();
  }
}

/**
 * Go to next page
 */
function nextPage() {
  const totalPages = parseInt(document.getElementById('totalPages').textContent);
  const currentPage = parseInt(document.getElementById('currentPage').textContent);

  if (currentPage < totalPages) {
    currentOffset += currentLimit;
    document.getElementById('currentOffset').value = currentOffset;
    fetchLogs();
  }
}

/**
 * Load and display statistics
 */
async function loadStatistics() {
  try {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    let url = `${API_BASE}/logs/stats`;

    if (startDate) url += `?startDate=${startDate}`;
    if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      displayStatistics(result.data);
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Error loading statistics: ' + error.message);
  }
}

/**
 * Display statistics
 */
function displayStatistics(stats) {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '';

  // Total logs stat
  const totalCard = document.createElement('div');
  totalCard.className = 'stat-card';
  totalCard.innerHTML = `
    <h4>📊 Total Logs</h4>
    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.total}</div>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
      ${stats.timeRange.earliest ? new Date(stats.timeRange.earliest).toLocaleString() : 'N/A'}<br/>
      to<br/>
      ${stats.timeRange.latest ? new Date(stats.timeRange.latest).toLocaleString() : 'N/A'}
    </div>
  `;
  container.appendChild(totalCard);

  // By Source stat
  if (Object.keys(stats.bySource).length > 0) {
    const sourceCard = document.createElement('div');
    sourceCard.className = 'stat-card';
    sourceCard.innerHTML = '<h4>📍 By Source</h4><div class="stat-list">';

    Object.entries(stats.bySource)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        sourceCard.innerHTML += `
          <div class="stat-item">
            <span>${source}</span>
            <span>${count}</span>
          </div>
        `;
      });

    sourceCard.innerHTML += '</div>';
    container.appendChild(sourceCard);
  }

  // By Level stat
  if (Object.keys(stats.byLevel).length > 0) {
    const levelCard = document.createElement('div');
    levelCard.className = 'stat-card';
    levelCard.innerHTML = '<h4>⚙️ By Level</h4><div class="stat-list">';

    Object.entries(stats.byLevel)
      .sort((a, b) => b[1] - a[1])
      .forEach(([level, count]) => {
        levelCard.innerHTML += `
          <div class="stat-item">
            <span>${level.toUpperCase()}</span>
            <span>${count}</span>
          </div>
        `;
      });

    levelCard.innerHTML += '</div>';
    container.appendChild(levelCard);
  }

  // By Operation stat
  if (Object.keys(stats.byOperation).length > 0) {
    const operationCard = document.createElement('div');
    operationCard.className = 'stat-card';
    operationCard.innerHTML = '<h4>🔧 By Operation</h4><div class="stat-list">';

    Object.entries(stats.byOperation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Show top 10
      .forEach(([operation, count]) => {
        operationCard.innerHTML += `
          <div class="stat-item">
            <span>${operation}</span>
            <span>${count}</span>
          </div>
        `;
      });

    if (Object.keys(stats.byOperation).length > 10) {
      operationCard.innerHTML += `<div class="stat-item"><em>...and ${Object.keys(stats.byOperation).length - 10} more</em></div>`;
    }

    operationCard.innerHTML += '</div>';
    container.appendChild(operationCard);
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById('logModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};
