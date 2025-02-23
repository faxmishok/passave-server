function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    // Remove the "www." prefix if present
    return url.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

module.exports = extractDomain;
