import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { hashPassword, passwordRules } from '../src/lib/cms/auth';
import { db, audit, transaction } from '../src/lib/cms/store';
// For first production setup or recovery. No credential is printed or stored in plaintext.
if (!stdin.isTTY || !stdout.isTTY)
    throw new Error('Şifre kurulumu etkileşimli terminalde çalıştırılmalı.');
const readline = createInterface({ input: stdin, output: stdout });
const answer = await readline.question('Tüm yönetici oturumlarını kapatıp yeni şifre belirlemek için EVET yazın: ');
readline.close();
if (answer !== 'EVET')
    process.exit(0);
async function hidden(prompt: string) {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    return new Promise<string>((resolve, reject) => { let value = ''; const receive = (chunk: Buffer) => { for (const char of chunk.toString()) {
        if (char === '\u0003') {
            done();
            reject(new Error('İptal edildi.'));
            return;
        }
        if (char === '\r' || char === '\n') {
            done();
            resolve(value);
            return;
        }
        if (char === '\u007f')
            value = value.slice(0, -1);
        else if (char >= ' ')
            value += char;
    } }; const done = () => { stdin.off('data', receive); stdin.setRawMode(false); stdin.pause(); stdout.write('\n'); }; stdin.on('data', receive); });
}
const password = await hidden('Yeni şifre (en az 12 karakter): ');
passwordRules(password);
if (password !== await hidden('Yeni şifre tekrar: '))
    throw new Error('Şifreler eşleşmiyor.');
const encoded = await hashPassword(password);
await transaction(async () => { await db().prepare('INSERT INTO credentials VALUES(1,?) ON CONFLICT(id) DO UPDATE SET hash=excluded.hash').run(encoded); await db().exec('DELETE FROM sessions; DELETE FROM attempts;'); await audit('auth.password.cli'); });
console.log('Yönetici şifresi güncellendi. /admin adresinden giriş yapabilirsiniz.');
