const pages = new Map();

export function registerPage(name, handler) {
  pages.set(name, handler);
}

export function navigate(pageName, ...args) {
  const handler = pages.get(pageName);
  if (handler) {
    handler(...args);
  } else {
    console.warn(`Page "${pageName}" not found.`);
  }
}

export function setActivePage(page) {
  document.querySelectorAll('.nav-item').forEach(x => {
    x.classList.toggle('active', x.dataset.page === page);
  });
}
