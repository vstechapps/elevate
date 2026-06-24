import * as SidenavModule from './sidenav.js';
import * as LoaderModule from './loader.js';

// 1. Initialise all scripts as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SidenavModule.init();
  LoaderModule.init(); // Injects the default loader HTML structure automatically
  
  console.log('Sidenav and Loader initialized successfully!');
});

// 2. Expose the Sidenav API to the global window object for HTML access
window.Sidenav = {
  init: SidenavModule.init,
  toggle: SidenavModule.toggle,
};

// 3. Expose the Loader API to the global window object for HTML access
window.Loader = {
  init: LoaderModule.init,
  show: LoaderModule.show,
  hide: LoaderModule.hide,
};