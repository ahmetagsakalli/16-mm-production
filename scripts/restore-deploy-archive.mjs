import { get } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, mkdir, mkdtemp, open, rename, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { createGunzip } from 'node:zlib';
export async function restoreDeployArchive(root, manifest) {
  const archive = manifest.archive;
  if (archive.format !== '16mm-concatenated-gzip-v1') throw new Error('Unsupported media archive format');
  const groups = new Map();
  for (const file of manifest.files) {
    const destination = resolve(root, file.path);
    if (!relative(root, destination).startsWith('public/media/gallery/')) throw new Error('Invalid deployment media path');
    const group = groups.get(file.sha256) || []; group.push(file); groups.set(file.sha256, group);
  }
  const temporary = await mkdtemp(join(tmpdir(), '16mm-deploy-media-'));
  const packed = join(temporary, 'gallery.gz');
  try {
    const blob = await get(archive.pathname, { access: 'private' });
    if (!blob || blob.statusCode !== 200) throw new Error('Deployment media archive was not found');
    const hash = createHash('sha256');
    await pipeline(Readable.fromWeb(blob.stream), new Transform({ transform(chunk, _encoding, callback) { hash.update(chunk); callback(null, chunk); } }), createWriteStream(packed));
    if ((await stat(packed)).size !== archive.bytes || hash.digest('hex') !== archive.sha256) throw new Error('Deployment archive checksum mismatch');
    let index = 0, count = 0, bytes = 0, fileHash = createHash('sha256');
    let file = await open(join(temporary, 'object'), 'w');
    try {
      for await (const chunk of createReadStream(packed).pipe(createGunzip())) {
        let offset = 0;
        while (offset < chunk.length) {
          const object = archive.objects[index];
          if (!object) throw new Error('Unexpected bytes in deployment archive');
          const end = Math.min(chunk.length, offset + object.bytes - bytes);
          const part = chunk.subarray(offset, end); offset = end; bytes += part.length;
          fileHash.update(part); await file.writeFile(part);
          if (bytes === object.bytes) {
            await file.close();
            if (fileHash.digest('hex') !== object.sha256) throw new Error('Deployment media checksum mismatch');
            for (const entry of groups.get(object.sha256) || []) {
              const destination = join(root, entry.path); await mkdir(dirname(destination), { recursive: true });
              await copyFile(join(temporary, 'object'), `${destination}.restoring`); await rename(`${destination}.restoring`, destination); count++;
            }
            index++; bytes = 0; fileHash = createHash('sha256');
            if (index < archive.objects.length) file = await open(join(temporary, 'object'), 'w');
          }
        }
      }
      if (index !== archive.objects.length || bytes !== 0 || count !== manifest.files.length) throw new Error('Incomplete deployment media archive');
      console.log(`Private media archive restored: ${count} files, all checksums verified.`);
    } finally { await file.close().catch(() => {}); }
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
