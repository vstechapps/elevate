let sideNav = null;
let mainContent = null;
let expandBtn = null;

/**
 * Initializes the side navigation.
 * Note: Fixed selectors from .getElementsByClassName(".name") to .querySelector(".name")
 */
export function init() {
  sideNav = document.querySelector(".sidenav");
  mainContent = document.querySelector(".main-content");

  if (!sideNav) {
    console.error('Side navigation element (.sidenav) not found.');
    return;
  }

  // get the expand button and add click event listener
  expandBtn = sideNav.querySelector(".expand-btn");
  if (expandBtn) {
    expandBtn.addEventListener("click", toggle);
  }
}

/**
 * Toggles the side navigation.
 */
export function toggle() {
  if (!sideNav || !mainContent) {
    console.error('Side navigation is not initialized. Call init() first.');
    return;
  }
  sideNav.classList.toggle('collapsed');
  mainContent.classList.toggle('collapsed');
  if(expandBtn) {
    expandBtn.innerHTML = expandBtn.innerHTML === '&laquo;' ? '&raquo;' : '&laquo;';
  }
}