import { useEffect } from 'react';

const setMeta = (selector, attrName, name, content) => {
  let el = document.head.querySelector(`${selector}[${attrName}="${name}"]`);
  if (!el) {
    el = document.createElement(selector);
    el.setAttribute(attrName, name);
    document.head.appendChild(el);
  }
  if (content !== undefined && content !== null) el.setAttribute('content', content);
  return el;
};

const SEO = ({ title, description, url, image }) => {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const descEl = setMeta('meta', 'name', 'description', description);
    const ogTitle = setMeta('meta', 'property', 'og:title', title);
    const ogDesc = setMeta('meta', 'property', 'og:description', description);
    const ogUrl = setMeta('meta', 'property', 'og:url', url);
    const ogImage = setMeta('meta', 'property', 'og:image', image);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    let createdCanonical = false;
    const prevCanonical = canonical ? canonical.getAttribute('href') : null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
      createdCanonical = true;
    }
    if (url) canonical.setAttribute('href', url);

    return () => {
      document.title = prevTitle;
      if (descEl && description === undefined) descEl.remove();
      if (createdCanonical && canonical) canonical.remove();
      if (prevCanonical && canonical) canonical.setAttribute('href', prevCanonical);
    };
  }, [title, description, url, image]);

  return null;
};

export default SEO;
