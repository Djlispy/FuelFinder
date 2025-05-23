document.addEventListener('DOMContentLoaded', async () => {
  const logPath = 'FuelFinder.log';

  async function fetchLastSuccessfulUpdate() {
    try {
      const res = await fetch(logPath);
      if (!res.ok) throw new Error(`Failed to fetch ${logPath}`);

      const content = await res.text();
      const lines = content.trim().split('\n').reverse();

      for (const line of lines) {
        if (line.includes('[INFO]') && line.includes("Saved") && line.includes("stores")) {
          const timestampMatch = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
          if (timestampMatch) return timestampMatch[0];
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading log:', error);
      return null;
    }
  }

  const timestamp = await fetchLastSuccessfulUpdate();
  const lastUpdatedDiv = document.getElementById('last-updated');

  if (timestamp) {
    lastUpdatedDiv.textContent = `Last updated: ${timestamp}`;
  } else {
    lastUpdatedDiv.textContent = `Last updated: N/A`;
  }
});
