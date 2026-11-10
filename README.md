# Savelink – setup and publishing guide

## What’s inside
- `server.js` – the website plus the download service (uses the free tool yt-dlp)
- `public/` – the page people see, plus `robots.txt` and `sitemap.xml` for Google
- `Dockerfile` – installs everything the server needs in one step

## 1. Try it on your computer
1. Install Node.js 18+ and yt-dlp (https://github.com/yt-dlp/yt-dlp) plus ffmpeg.
2. In this folder run: `node server.js`
3. Open http://localhost:3000 and paste a public link.

## 2. Put it online
Pick a host that runs Docker and lets you use your own domain: Render, Railway, Fly.io, or a small VPS (Hetzner, DigitalOcean, about $5/month).
1. Upload this folder (GitHub is easiest) and create a new "Web Service" from the Dockerfile.
2. The host gives you a free address and HTTPS. Test it there first.
3. Buy a domain (Namecheap, Cloudflare, Google Domains successors) and connect it in the host’s "Custom domain" settings.
Tips: free plans often sleep or block downloader apps, so a small paid VPS is more reliable. Read your host’s rules before deploying.

## 3. Get found on Google
1. Replace every `YOURDOMAIN.com` with your real domain in `public/index.html` (canonical and og:url), `public/robots.txt` and `public/sitemap.xml`. Redeploy.
2. Go to https://search.google.com/search-console and add your domain. Verify it by adding the TXT record Google gives you at your domain provider.
3. In Search Console open Sitemaps, enter `sitemap.xml` and submit.
4. Open URL Inspection, paste your home page address, and click Request indexing.
5. Do the same at https://www.bing.com/webmasters (you can import from Google). Bing also feeds DuckDuckGo and others.
6. Wait. Indexing usually takes days, and ranking takes weeks to months.

## 4. Help it rank
- Add one page per platform with its own helpful text, for example an Instagram video page and a TikTok page. Copy `index.html`, change the title, headline and text.
- Keep the site fast and mobile friendly. Add a contact email, Privacy Policy and Terms page.
- Earn links from blogs, forums and directories. This niche is very competitive, so expect it to be slow.

## 5. Keep it healthy
- Social sites change often. Rebuild or redeploy every week or two so yt-dlp stays current (the Dockerfile updates it on start).
- Built-in protections: 30 requests per 10 minutes per visitor, 3 downloads at once, 500 MB file limit, private addresses blocked. Tune them in `server.js`.
- Photos and carousels work only where yt-dlp supports them. For wider photo support, add gallery-dl later.

## Legal heads-up
Downloading can break a platform’s terms and creators’ copyright. Keep the notice in the footer, answer takedown requests quickly, and consider asking a lawyer before you grow. Some ad networks and hosts do not allow downloader sites.

## If your page is on Netlify (or any static host)
Netlify only shows files. It cannot run `server.js` or yt-dlp, so downloads fail there with an error. Two ways to fix it:
1. Simplest: deploy this whole folder on a server host (Render, Railway, a VPS) and use that address as your website.
2. Keep Netlify for the page, deploy the same folder on a server host, then set `API_BASE` near the bottom of `public/index.html` to the server address, for example `var API_BASE = "https://yourapp.onrender.com";`, and redeploy Netlify.
