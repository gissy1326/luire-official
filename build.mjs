// LUIRE official site — static build (no dependencies)
// node build.mjs  → ./out
// microCMS: set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY. Without them, ./content/*.json is used.
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'out');
const SITE_URL = (process.env.SITE_URL || 'https://luire-official.com').replace(/\/$/, '');
const CMS_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const CMS_KEY = process.env.MICROCMS_API_KEY;

const SOCIAL = {
  youtube: 'https://www.youtube.com/channel/UCw5ZXwv92v5rFcvHebzfeTA',
  instagram: 'https://www.instagram.com/luire_maillynofficial/',
  tiktok: 'https://www.tiktok.com/@luire_official',
  x: 'https://x.com/luire_official',
};
const MEMBERS_IG = { aillyn: 'https://www.instagram.com/7aillyn/', mai: 'https://www.instagram.com/mymaihii/' };
const CONTACT_EMAIL = 'info@stanford-group.com';
const DEFAULT_ACCENT = '#E0218A';

/* ---------------- data ---------------- */
async function local(name) {
  return JSON.parse(await readFile(path.join(ROOT, 'content', `${name}.json`), 'utf8'));
}
async function cms(endpoint, query = '') {
  const url = `https://${CMS_DOMAIN}.microcms.io/api/v1/${endpoint}${query}`;
  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': CMS_KEY } });
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
  return res.json();
}
async function getList(endpoint, orders) {
  if (!CMS_DOMAIN || !CMS_KEY) return local(endpoint);
  try {
    const items = [];
    for (let offset = 0; ; offset += 100) {
      const data = await cms(endpoint, `?limit=100&offset=${offset}&orders=${orders}`);
      items.push(...data.contents);
      if (items.length >= data.totalCount) break;
    }
    return items;
  } catch (e) {
    console.warn(`[microCMS] ${e.message} → content/${endpoint}.json を使用`);
    return local(endpoint);
  }
}
async function getObject(endpoint) {
  if (!CMS_DOMAIN || !CMS_KEY) return local(endpoint);
  try {
    return { ...(await local(endpoint)), ...stripEmpty(await cms(endpoint)) };
  } catch (e) {
    console.warn(`[microCMS] ${e.message} → content/${endpoint}.json を使用`);
    return local(endpoint);
  }
}
function stripEmpty(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''));
}

/* ---------------- helpers ---------------- */
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s = '') => esc(s).replace(/\r?\n/g, '<br>');
const first = (v) => (Array.isArray(v) ? v[0] : v) || '';
const jst = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3);
const ymd = (iso) => { const d = jst(iso); return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`; };
const dayKey = (iso) => ymd(iso).replace(/\./g, '');
const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dow = (iso) => WEEK[jst(iso).getUTCDay()];
const todayKey = dayKey(new Date().toISOString());
const pad2 = (n) => String(n).padStart(2, '0');
const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((c || '').trim());
const season = (iso) => { const m = jst(iso).getUTCMonth() + 1; return m >= 3 && m <= 5 ? 'Spring' : m <= 8 && m >= 6 ? 'Summer' : m >= 9 && m <= 11 ? 'Autumn' : 'Winter'; };
function img(media, w) {
  if (!media || !media.url) return '';
  if (/microcms-assets\.io/.test(media.url)) return `${media.url}?w=${w}&fm=webp&q=80`;
  return media.url;
}
function ytId(url = '') {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
const isExternal = (u) => /^https?:\/\//.test(u);

/* ---------------- icons ---------------- */
const ICON = {
  youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9 L15 12 L10 15 Z" fill="currentColor"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M14 3 V15.5 A4 4 0 1 1 10 11.5"/><path d="M14 3 C14.5 6 16.5 8 20 8"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4 L20 20 M20 4 L4 20"/></svg>',
};
const snsLinks = () => `<div class="sns">
<a href="${SOCIAL.youtube}" target="_blank" rel="noopener" aria-label="YouTube">${ICON.youtube}</a>
<a href="${SOCIAL.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a>
<a href="${SOCIAL.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">${ICON.tiktok}</a>
<a href="${SOCIAL.x}" target="_blank" rel="noopener" aria-label="X">${ICON.x}</a>
</div>`;

const NAV = [
  ['Live', '/live/'],
  ['News', '/news/'],
  ['Discography', '/discography/'],
  ['Profile', '/#profile'],
  ['Movie', '/movie/'],
];
const nav = (current) => NAV.map(([l, h]) => `<a href="${h}" class="cl"${current === h ? ' aria-current="page"' : ''}>${l}</a>`).join('\n');

/* ---------------- layout ---------------- */
function layout({ title, description, pathname, body, accent, current, jsonld, ogImage }) {
  const fullTitle = title ? `${title} | LUIRE Official Site` : 'LUIRE Official Site | ルイール オフィシャルサイト';
  const desc = description || 'AILLYN & MAIによるR&Bユニット・LUIRE（ルイール）のオフィシャルサイト。最新リリース、ライブ、ニュース、プロフィール、MVを掲載。';
  const url = SITE_URL + pathname;
  const og = ogImage ? (isExternal(ogImage) ? ogImage : SITE_URL + ogImage) : `${SITE_URL}/images/ogp.jpg`;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${pathname === '/' ? 'website' : 'article'}">
<meta property="og:site_name" content="LUIRE Official Site">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@luire_official">
<meta name="theme-color" content="#F3EEE5">
<link rel="icon" href="/images/favicon-32.png" sizes="32x32">
<link rel="icon" href="/images/icon.png" sizes="512x512">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Oswald:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>:root{--accent:${accent}}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<a href="#main" class="sr">本文へスキップ</a>
<header class="site-header">
<div class="in">
<a href="/" class="logo" aria-label="LUIRE トップへ"><img src="/images/logo_black.png" alt="LUIRE" width="1400" height="262"></a>
<nav class="gnav" aria-label="メインメニュー">
${nav(current)}
</nav>
${snsLinks()}
</div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
<div class="wrap in">
<img src="/images/logo_white.png" alt="LUIRE" class="flogo" width="1400" height="262">
<nav aria-label="フッターメニュー">
${NAV.map(([l, h]) => `<a href="${h}" class="cl">${l}</a>`).join('\n')}
</nav>
${snsLinks()}
<div class="contact">お仕事のご依頼・お問い合わせ<br>STANFORD Inc.　<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div>
<div class="copy cl">© ${new Date().getFullYear()} STANFORD Inc. All Rights Reserved.</div>
</div>
</footer>
</body>
</html>
`;
}

/* ---------------- parts ---------------- */
const secHead = (tag, title, sub, moreHref, id = '') => `<div class="sec-head">
<div class="t"><${tag} class="cl"${id ? ` id="${id}"` : ''}>${title}</${tag}><span class="bd sub">${sub}</span></div>
${moreHref ? `<a href="${moreHref}" class="cl more">View All →</a>` : ''}
</div>`;

function liveItem(l, past) {
  const ticket = l.ticketUrl && !past ? `<a href="${esc(l.ticketUrl)}" class="btn solid" target="_blank" rel="noopener">Ticket ↗</a>` : past ? '<span class="cl past-tag">Finished</span>' : '';
  const sub = [l.venue, l.time].filter(Boolean).map(esc).join('　');
  return `<li class="live-item">
<div class="cl live-date">${ymd(l.date)}<small>${dow(l.date)}</small></div>
<div><h3>${esc(l.title)}</h3>${sub ? `<p>${sub}</p>` : ''}${l.lineup ? `<p>${esc(l.lineup)}</p>` : ''}${l.note ? `<p>${nl2br(l.note)}</p>` : ''}</div>
<div>${ticket}</div>
</li>`;
}
const comingSoon = () => `<div class="empty"><div class="cl">Coming Soon</div><div>次の出演情報は近日公開</div></div>`;

const newsItem = (n) => `<li><a href="/news/${esc(n.id)}/">
<span class="cl news-date">${ymd(n.date || n.publishedAt)}</span><span class="cl tag">${esc(first(n.category) || 'INFO')}</span><span class="news-title">${esc(n.title)}</span>
</a></li>`;

function relCard(r) {
  return `<article class="rel">
<a href="/discography/${esc(r.id)}/"><img class="jk" src="${esc(img(r.jacket, 800))}" alt="${esc(r.title)}" loading="lazy" width="800" height="800"></a>
<div class="cl no" style="color:${isHex(r.color) && r.color.toLowerCase() !== '#141210' ? r.color : 'var(--accent)'}">No.${pad2(r.number || 0)} — ${esc(first(r.type))}</div>
<h3 class="cl">${esc(r.title)}</h3>
<div class="date">${ymd(r.releaseDate)} Release</div>
<div class="btns">
${r.streamingUrl ? `<a href="${esc(r.streamingUrl)}" class="btn solid" target="_blank" rel="noopener">Buy / Streaming</a>` : ''}
<a href="/discography/${esc(r.id)}/" class="btn">Detail</a>
</div>
</article>`;
}

function mvCard(m) {
  const id = ytId(m.youtubeUrl);
  if (!id) return '';
  return `<div class="mv">
<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(m.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
<h3>${esc(m.title)}</h3>
</div>`;
}

/* ---------------- pages ---------------- */
async function main() {
  const [releases, news, lives, movies, profile] = await Promise.all([
    getList('release', '-releaseDate'),
    getList('news', '-date'),
    getList('live', 'date'),
    getList('movie', '-date'),
    getObject('profile'),
  ]);
  releases.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  news.sort((a, b) => new Date(b.date || b.publishedAt) - new Date(a.date || a.publishedAt));
  lives.sort((a, b) => new Date(a.date) - new Date(b.date));
  movies.sort((a, b) => new Date(b.date || b.publishedAt) - new Date(a.date || a.publishedAt));

  const latest = releases[0];
  const accent = latest && isHex(latest.color) ? latest.color.trim() : DEFAULT_ACCENT;
  const upcoming = lives.filter((l) => dayKey(l.date) >= todayKey);
  const past = lives.filter((l) => dayKey(l.date) < todayKey).reverse();

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(ROOT, 'public'), OUT, { recursive: true });
  const write = async (p, html) => {
    const file = path.join(OUT, p, p.endsWith('.html') || p.endsWith('.xml') || p.endsWith('.txt') ? '' : 'index.html');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
  };
  const urls = [];

  /* TOP */
  const coverImg = latest ? img(latest.cover, 1800) || '/images/group.jpg' : '/images/group.jpg';
  const watch = movies[0];
  const top = `
<section class="wrap cover" aria-label="Cover">
<div class="cover-meta cl"><span>[ルイール] Black Music &amp; Fashion</span><span>${latest ? `Vol.${pad2(latest.number || releases.length)} — ${season(latest.releaseDate)} ${jst(latest.releaseDate).getUTCFullYear()}` : ''}</span></div>
<h1 class="sr">LUIRE（ルイール）オフィシャルサイト</h1>
<img class="masthead" src="/images/logo_black.png" alt="LUIRE" width="1400" height="262">
<div class="cover-photo">
<div class="cover-img">
<img src="${esc(coverImg)}" alt="LUIRE — AILLYN &amp; MAI" width="1400" height="934" fetchpriority="high">
${latest ? `<div class="badge"><span class="cl s">New Issue</span><span class="cl b">No.${pad2(latest.number || releases.length)}</span><span class="cl s">Out Now</span></div>` : ''}
</div>
${latest ? `<div class="lines-l">
<p class="cl cover-title">${esc(latest.title)}</p>
${latest.catch ? `<p class="cover-catch">${esc(latest.catch)}<br>${esc(first(latest.type))} ${ymd(latest.releaseDate)} OUT</p>` : ''}
<div class="cover-btns">
${latest.streamingUrl ? `<a href="${esc(latest.streamingUrl)}" class="btn solid" target="_blank" rel="noopener">Listen ↗</a>` : ''}
${watch ? `<a href="${esc(watch.youtubeUrl)}" class="btn" target="_blank" rel="noopener">Watch MV ↗</a>` : ''}
</div>
</div>` : ''}
<div class="lines-r" aria-hidden="true">
<div class="cl">Cover Girls<br>AILLYN &amp; MAI</div>
<div class="cl">Executive Producer<br>DJ HASEBE</div>
<div class="jp">ASH&amp;DIAMOND<br>iTunes R&amp;B/ソウル TOP10</div>
</div>
</div>
</section>

<section class="wrap sec" id="live" aria-labelledby="h-live">
${secHead('h2', 'Live', 'Schedule', '/live/', 'h-live')}
${upcoming.length ? `<ul class="live-list">${upcoming.slice(0, 3).map((l) => liveItem(l, false)).join('')}</ul>` : comingSoon()}
</section>

<section class="wrap sec" id="news" aria-labelledby="h-news">
${secHead('h2', 'News', 'LUIRE TIMES', '/news/', 'h-news')}
<ul class="news-list">${news.slice(0, 5).map(newsItem).join('')}</ul>
</section>

<section class="wrap sec" id="discography" aria-labelledby="h-disco">
${secHead('h2', 'Discography', 'Back Numbers', '/discography/', 'h-disco')}
<div class="rel-grid" style="margin-top:36px">${releases.slice(0, 3).map(relCard).join('')}</div>
</section>

<section class="wrap sec" id="profile" aria-labelledby="h-profile">
${secHead('h2', 'Profile', 'Cover Girls', '', 'h-profile')}
<p class="intro">${nl2br(profile.intro || '')}</p>
<div class="members">
${[['AILLYN', 'アイリン', profile.aillynPhoto, profile.aillynText, MEMBERS_IG.aillyn], ['MAI', 'マイ', profile.maiPhoto, profile.maiText, MEMBERS_IG.mai]]
  .map(([n, k, p, t, ig]) => `<div class="member">
<img src="${esc(img(p, 1000))}" alt="${n}" loading="lazy" width="934" height="1168">
<div class="member-head"><div class="n"><h3 class="bd">${n}</h3><span class="cl kana">${k}</span></div><a href="${ig}" class="cl more" target="_blank" rel="noopener">Instagram ↗</a></div>
${t ? `<p>${nl2br(t)}</p>` : ''}
</div>`).join('')}
</div>
</section>

<section class="wrap sec" id="movie" aria-labelledby="h-movie">
${secHead('h2', 'Movie', 'On Screen', '/movie/', 'h-movie')}
<div class="mv-grid" style="margin-top:36px">${movies.slice(0, 2).map(mvCard).join('')}</div>
</section>`;

  const groupLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: 'LUIRE',
    alternateName: 'ルイール',
    url: SITE_URL + '/',
    image: SITE_URL + '/images/ogp.jpg',
    genre: 'R&B',
    description: 'AILLYN & MAIによるR&Bユニット',
    member: [{ '@type': 'Person', name: 'AILLYN' }, { '@type': 'Person', name: 'MAI' }],
    sameAs: Object.values(SOCIAL),
    album: releases.map((r) => ({ '@type': 'MusicAlbum', name: r.title, datePublished: ymd(r.releaseDate).replace(/\./g, '-'), url: `${SITE_URL}/discography/${r.id}/` })),
  };
  await write('/', layout({ pathname: '/', body: top, accent, current: '/', jsonld: groupLd }));
  urls.push('/');

  /* LIVE */
  await write('/live/', layout({
    title: 'Live', pathname: '/live/', accent, current: '/live/',
    description: 'LUIRE（ルイール）のライブ・イベント出演スケジュール。',
    body: `<section class="wrap page-top">
${secHead('h1', 'Live', 'Schedule', '')}
${upcoming.length ? `<ul class="live-list">${upcoming.map((l) => liveItem(l, false)).join('')}</ul>` : comingSoon()}
${past.length ? `<div class="sec">${secHead('h2', 'Archive', 'Past Shows', '')}<ul class="live-list">${past.map((l) => liveItem(l, true)).join('')}</ul></div>` : ''}
</section>`,
  }));
  urls.push('/live/');

  /* NEWS */
  await write('/news/', layout({
    title: 'News', pathname: '/news/', accent, current: '/news/',
    description: 'LUIRE（ルイール）の最新ニュース。',
    body: `<section class="wrap page-top">${secHead('h1', 'News', 'LUIRE TIMES', '')}<ul class="news-list">${news.map(newsItem).join('')}</ul></section>`,
  }));
  urls.push('/news/');
  for (const n of news) {
    const p = `/news/${n.id}/`;
    const thumb = n.thumbnail ? `<img src="${esc(img(n.thumbnail, 1200))}" alt="" style="width:100%;height:auto;margin-bottom:32px">` : '';
    const text = (n.body || '').replace(/<[^>]+>/g, '').slice(0, 110);
    await write(p, layout({
      title: n.title, pathname: p, accent, current: '/news/', description: text, ogImage: n.thumbnail ? img(n.thumbnail, 1200) : '',
      body: `<article class="wrap"><div class="article">
<div class="crumb cl"><a href="/">Top</a> / <a href="/news/">News</a></div>
<div class="meta"><span class="cl news-date">${ymd(n.date || n.publishedAt)}</span><span class="cl tag">${esc(first(n.category) || 'INFO')}</span></div>
<h1>${esc(n.title)}</h1>
${thumb}
<div class="prose">${n.body || ''}</div>
<div class="back"><a href="/news/" class="btn">← News 一覧へ</a></div>
</div></article>`,
    }));
    urls.push(p);
  }

  /* DISCOGRAPHY */
  await write('/discography/', layout({
    title: 'Discography', pathname: '/discography/', accent, current: '/discography/',
    description: 'LUIRE（ルイール）のディスコグラフィ。',
    body: `<section class="wrap page-top">${secHead('h1', 'Discography', 'Back Numbers', '')}<div class="rel-grid" style="margin-top:36px">${releases.map(relCard).join('')}</div></section>`,
  }));
  urls.push('/discography/');
  for (const r of releases) {
    const p = `/discography/${r.id}/`;
    const own = isHex(r.color) ? r.color.trim() : accent;
    const mv = movies.find((m) => (m.title || '').toLowerCase().includes((r.title || '').toLowerCase()));
    await write(p, layout({
      title: r.title, pathname: p, accent: own, current: '/discography/', ogImage: img(r.jacket, 1200),
      description: `LUIRE ${first(r.type)}「${r.title}」${ymd(r.releaseDate)} Release`,
      body: `<section class="wrap page-top">
<div class="crumb cl"><a href="/">Top</a> / <a href="/discography/">Discography</a></div>
<div class="rel-detail">
<img class="jk" src="${esc(img(r.jacket, 1200))}" alt="${esc(r.title)}" width="1200" height="1200">
<div>
<div class="cl no" style="font-size:14px;letter-spacing:.14em;color:${own.toLowerCase() === '#141210' ? 'var(--ink)' : own}">No.${pad2(r.number || 0)} — ${esc(first(r.type))}</div>
<h1 class="cl">${esc(r.title)}</h1>
<div>${ymd(r.releaseDate)} Release</div>
${r.streamingUrl ? `<p style="margin:24px 0"><a href="${esc(r.streamingUrl)}" class="btn solid" target="_blank" rel="noopener">Buy / Streaming ↗</a></p>` : ''}
<div class="prose">${r.description || ''}</div>
${r.credit ? `<div class="credit">${nl2br(r.credit)}</div>` : ''}
</div>
</div>
${mv ? `<div class="sec">${secHead('h2', 'Music Video', esc(r.title), '')}<div class="mv-grid" style="margin-top:36px;grid-template-columns:1fr;max-width:860px">${mvCard(mv)}</div></div>` : ''}
<div class="back"><a href="/discography/" class="btn">← Discography 一覧へ</a></div>
</section>`,
    }));
    urls.push(p);
  }

  /* MOVIE */
  await write('/movie/', layout({
    title: 'Movie', pathname: '/movie/', accent, current: '/movie/',
    description: 'LUIRE（ルイール）のミュージックビデオ・映像。',
    body: `<section class="wrap page-top">${secHead('h1', 'Movie', 'On Screen', '')}<div class="mv-grid" style="margin-top:36px">${movies.map(mvCard).join('')}</div>
<p style="margin-top:40px"><a href="${SOCIAL.youtube}" class="btn" target="_blank" rel="noopener">YouTube Channel ↗</a></p></section>`,
  }));
  urls.push('/movie/');

  /* 404 */
  await write('404.html', layout({
    title: 'Not Found', pathname: '/404', accent, current: '',
    body: `<section class="wrap page-top">${secHead('h1', '404', 'Not Found', '')}<p style="margin:32px 0">お探しのページは見つかりませんでした。</p><a href="/" class="btn solid">Top へ戻る</a></section>`,
  }));

  /* sitemap / robots */
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>
`);
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(`built ${urls.length} pages → out/  (data: ${CMS_DOMAIN && CMS_KEY ? 'microCMS' : 'content/*.json'}, accent ${accent})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
