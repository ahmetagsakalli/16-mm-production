import concurrent.futures, hashlib, http.cookiejar, json, pathlib, urllib.request, urllib.error

root = pathlib.Path(__file__).resolve().parent
base = 'https://16mm-production.vercel.app'
before = json.loads((root / 'content-before.json').read_text())
cookies = http.cookiejar.MozillaCookieJar(str(root / 'session.cookies'))
cookies.load(ignore_discard=True, ignore_expires=True)
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
with opener.open(base + '/api/admin/export', timeout=45) as response:
    after = json.load(response)
(root / 'content-after.json').write_text(json.dumps(after, ensure_ascii=False, indent=2))
(root / 'content-after.json').chmod(0o600)
def canonical(value):
    value = json.loads(json.dumps(value))
    value.pop('exportedAt', None)
    value['projects'].sort(key=lambda p: p['id'])
    for p in value['projects']:
        p['media'].sort(key=lambda m: m['id'])
    value['revisions'].sort(key=lambda r: r['id'])
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
assert canonical(before) == canonical(after), 'Production content changed; inspect before/after, do not overwrite.'
media = [m for p in after['projects'] for m in p['media']]
print(json.dumps({'contentIdentical': True, 'sha256': hashlib.sha256(canonical(after)).hexdigest(), 'projects': len(after['projects']), 'media': len(media), 'revisions': len(after['revisions'])}), flush=True)
with opener.open(base + '/api/admin/session', timeout=45) as response:
    session = json.load(response)
print('Existing admin session:', response.status, 'authenticated' if session.get('authenticated') else json.dumps({k:v for k,v in session.items() if isinstance(v,bool)}), flush=True)
paths = {m['image']['src'] for m in media if m.get('image')}
paths.update(m['src'] for m in media if m.get('src'))
paths.update(m['previewSrc'] for m in media if m.get('previewSrc'))
project = root.parents[2]
identity = json.loads((project/'src/content/identity.json').read_text())
paths.update(x['src'] for x in [identity['logo'], identity['portrait'], *identity['references']])
slides = json.loads((project/'src/content/home-slides.json').read_text())
for slide in slides:
    src = slide['image']['src']
    paths.add(src)
    paths.update(src.replace('.webp', f'-{width}.webp') for width in [640,768,1280,1920,2560])
for file in (project/'public/media/gallery/9-talking-head-bba876').rglob('*.webp'):
    paths.add('/' + str(file.relative_to(project/'public')))
paths.update('/projects/' + p['published']['slug'] for p in after['projects'] if p.get('published') and not p.get('deleted'))
paths.update('/portfolio/' + category for category in ['architecture','hotels','retail','product','lighting','food','music','exhibitions','talking-head','events'])
paths.update(['/','/contact','/blog','/admin','/sitemap.xml','/robots.txt'])
def check(path):
    try:
        with urllib.request.urlopen(urllib.request.Request(base+path, method='HEAD'), timeout=45) as r:
            expected_type = 'image/webp' if path.endswith('.webp') else 'video/mp4' if path.endswith('.mp4') else None
            if r.status != 200 or (expected_type and r.headers.get_content_type() != expected_type):
                return {'path':path, 'status':r.status,'type':r.headers.get_content_type()}
    except urllib.error.HTTPError as e:
        if path == '/portfolio/events' and e.code == 308 and e.headers.get('Location') == '/portfolio/exhibitions':
            return None
        return {'path':path, 'error':str(e)}
    except Exception as e:
        return {'path':path, 'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    failures = [x for x in pool.map(check, sorted(paths)) if x]
report = {'contentIdentical':True,'contentSha256':hashlib.sha256(canonical(after)).hexdigest(),'projects':len(after['projects']),'media':len(media),'revisions':len(after['revisions']),'checkedURLs':len(paths),'failures':failures}
(root/'verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report), flush=True)
assert not failures, 'Broken public routes/media found'
