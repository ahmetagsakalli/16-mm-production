#!/usr/bin/env python3
"""Verify source snapshot and media byte-for-byte, without changing content."""
import argparse, hashlib, json, sqlite3
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--restore-empty-directories',action='store_true')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'.transfer/source-manifest.json').read_text())
failures=[]
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
for entry in manifest['files']:
 path=root/entry['storedAt']
 if not path.is_file() or path.stat().st_size!=entry['bytes'] or sha(path)!=entry['sha256']:failures.append(entry['path'])
for entry in manifest['archives']:
 path=root/entry['path']
 if not path.is_file() or sha(path)!=entry['sha256']:failures.append(entry['path'])
for entry in json.loads((root/'.transfer/public-files.json').read_text())['files']:
 path=root/entry['path']
 if not path.is_file() or sha(path)!=entry['sha256']:failures.append(entry['path'])
if args.restore_empty_directories:
 for directory in manifest['emptyDirectories']:(root/directory).mkdir(parents=True,exist_ok=True)
db=sqlite3.connect('file:'+str(root/'.transfer/live-cms.sqlite')+'?mode=ro',uri=True)
if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':failures.append('SQLite integrity')
if db.execute('PRAGMA foreign_key_check').fetchall():failures.append('SQLite foreign keys')
counts={t:db.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['projects','media','blog_posts','revisions','credentials']}
db.close()
if failures:
 print('Missing or changed:',*failures,sep='\n');raise SystemExit(1)
print('OK:',len(manifest['files']),'source files,',len(manifest['archives']),'complete runtime archives. Database:',counts)
for excluded in manifest['excluded']:print('Account-session exclusion:',excluded['path'],excluded['reason'])
