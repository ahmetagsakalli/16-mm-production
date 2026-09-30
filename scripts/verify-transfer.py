#!/usr/bin/env python3
"""Verify every transferred source file, including archived local runtime files."""
import argparse
import hashlib
import json
import sqlite3
import tarfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--restore-empty-directories', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / '.transfer/manifest.json').read_text(encoding='utf-8'))
failures = []
verified = 0

def digest(stream):
    result = hashlib.sha256()
    while block := stream.read(1024 * 1024): result.update(block)
    return result.hexdigest()

def check_file(entry, stream, size):
    if size != entry['bytes'] or digest(stream) != entry['sha256']:
        failures.append(entry['path'])

archives = {}
for entry in manifest['files']:
    if entry['storage'] != 'repository':
        if entry.get('note'):  # The external root link is recorded; its target is archived.
            verified += 1
            continue
        archives.setdefault(entry['storage'], []).append(entry)
        continue
    path = root / entry.get('repositoryPath', entry['path'])
    if entry['type'] == 'symlink':
        if not path.is_symlink() or str(path.readlink()) != entry['target']: failures.append(entry['path'])
    elif not path.is_file():
        failures.append(entry['path'])
    else:
        with path.open('rb') as stream: check_file(entry, stream, path.stat().st_size)
    verified += 1

expected_archives = json.loads((root / '.transfer/archive-sha256.json').read_text())
for archive_path, entries in archives.items():
    path = root / archive_path
    if not path.is_file():
        failures.append(archive_path)
        continue
    with path.open('rb') as stream:
        if digest(stream) != expected_archives[path.name]:
            failures.append(archive_path + ' (archive hash)')
            continue
    with tarfile.open(path, 'r:gz') as archive:
        members = {member.name: member for member in archive.getmembers()}
        for entry in entries:
            member = members.get(entry['path'])
            if member is None:
                failures.append(entry['path'])
            elif entry['type'] == 'symlink':
                if not member.issym() or member.linkname != entry['target']: failures.append(entry['path'])
            elif not member.isfile():
                failures.append(entry['path'])
            else:
                with archive.extractfile(member) as stream: check_file(entry, stream, member.size)
            verified += 1
    print('Verified archive:', archive_path, flush=True)

database = sqlite3.connect('file:' + str(root / '.data/cms.sqlite') + '?mode=ro', uri=True)
if database.execute('pragma integrity_check').fetchone()[0] != 'ok': failures.append('.data/cms.sqlite')
counts = {table: database.execute(f'SELECT count(*) FROM "{table}"').fetchone()[0] for table in ['projects', 'media', 'credentials']}
database.close()

if args.restore_empty_directories:
    # Empty original project/category folders are not represented by Git trees.
    for directory in manifest['directories']:
        if directory.startswith('assets/gallery/originals/'):
            (root / directory).mkdir(parents=True, exist_ok=True)

if failures:
    print('MISSING OR CHANGED FILES:', *failures, sep='\n')
    raise SystemExit(1)
print(f'OK: {verified} source file/link records verified; database {counts}.')
