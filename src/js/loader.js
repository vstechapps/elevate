let loaderElement = null;

/**
 * Dynamically injects the loader HTML into the document.
 */
function injectLoader() {
  const loaderDiv = document.createElement('div');
  loaderDiv.id = 'dynamicLoader';
  loaderDiv.className = 'loader-container hidden';
  loaderDiv.innerHTML = '<div class="loader"></div>';
  document.body.appendChild(loaderDiv);

  loaderElement = loaderDiv;
}

/**
 * Initializes the loader. Optionally allows setting a custom ID.
 * @param {string} [customId='dynamicLoader'] - Custom ID for the loader element.
 */
export function init(customId = 'dynamicLoader') {
  loaderElement = document.getElementById(customId);

  if (!loaderElement) {
    injectLoader();
  }
}

/**
 * Shows the loader.
 */
export function show() {
  if (!loaderElement) {
    console.error('Loader is not initialized. Call init() first.');
    return;
  }
  loaderElement.classList.remove('hidden');
}

/**
 * Hides the loader.
 */
export function hide() {
  if (!loaderElement) {
    console.error('Loader is not initialized. Call init() first.');
    return;
  }
  loaderElement.classList.add('hidden');
}