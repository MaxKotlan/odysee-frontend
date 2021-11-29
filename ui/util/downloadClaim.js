export function webDownloadClaim(streamingUrl, fileName) {
  let element = document.createElement('a');
  element.setAttribute('href', `${streamingUrl}?download=true`);
  element.setAttribute('download', fileName);
  element.style.display = 'none';
  // $FlowFixMe
  document.body.appendChild(element);
  element.click();
  // $FlowFixMe
  document.body.removeChild(element);
}
