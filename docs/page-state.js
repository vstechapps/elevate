export function getPageFromUrl(search = window.location.search, defaultPage = "getting-started") {
  const params = new URLSearchParams(search);
  const page = params.get("page");

  return page && page.trim() ? page.trim() : defaultPage;
}

export function setPageInUrl(page, action = "pushState") {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;

  if (action === "replaceState") {
    window.history.replaceState({}, "", nextUrl);
  } else {
    window.history.pushState({}, "", nextUrl);
  }

  return nextUrl;
}
