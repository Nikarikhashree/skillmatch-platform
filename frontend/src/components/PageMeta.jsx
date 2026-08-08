import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Single page apps ship one HTML file, so the title and description never change
 * as you navigate unless something sets them. This keeps both accurate per route,
 * which is what a crawler and a shared link preview read.
 */
const META = {
  '/': {
    title: 'SkillMatch, experienced people on the right projects',
    description:
      'SkillMatch ranks open projects at small businesses and social enterprises against your skills, and shows the reasoning behind every match.'
  },
  '/browse': {
    title: 'Browse open projects | SkillMatch',
    description:
      'Short, well scoped projects at small businesses and social enterprises. See how you score against each one before you apply.'
  },
  '/join': {
    title: 'Join as a professional | SkillMatch',
    description:
      'Paste your CV and get a profile built for you, then see every open project ranked against your skills and availability.'
  },
  '/post': {
    title: 'Post a project | SkillMatch',
    description:
      'Describe the work in plain words and get a shortlist of experienced professionals, with the gaps flagged before the first call.'
  },
  '/volunteer': {
    title: 'Volunteer with us | SkillMatch',
    description:
      'Give a couple of hours a month to digital skills, employability, money advice or mentoring. Training provided, no experience needed.'
  },
  '/support': {
    title: 'Donate and sponsor | SkillMatch',
    description:
      'Fund the coordination that turns volunteer time into sessions that happen. Regular giving, programme sponsorship and corporate partnership.'
  },
  '/dashboard': {
    title: 'Impact dashboard | SkillMatch',
    description:
      'Live social impact reporting: people supported, volunteer hours, skills in demand and where the talent pool is thin.'
  }
};

const FALLBACK = META['/'];

function setMeta(name, content, attribute = 'name') {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function PageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = META[pathname] || FALLBACK;
    document.title = meta.title;
    setMeta('description', meta.description);
    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:url', window.location.href, 'property');

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [pathname]);

  return null;
}