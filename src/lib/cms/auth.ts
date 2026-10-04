import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { cookies } from 'next/headers';
import { audit, db, transaction } from './store';
import { CmsError } from './types';
export const COOKIE = 'production16_admin';
const duration = 8 * 60 * 60 * 1000;
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function hasPassword() { return !!await db().prepare('SELECT id FROM credentials WHERE id=1').get(); }
export function localSetupAllowed(request: Request) { const url = new URL(request.url); const host = request.headers.get('host') || url.host; return process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(`http://${host}`).hostname); }
export function sameOrigin(request: Request) {
    const origin = request.headers.get('origin');
    const target = new URL(request.url);
    const expected = process.env.CMS_ORIGIN || `${target.protocol}//${request.headers.get('host') || target.host}`;
    if (!origin || origin !== expected)
        throw new CmsError('İstek kaynağı doğrulanamadı. Sayfayı yenileyin.', 403);
}
export function passwordRules(password: unknown): asserts password is string { if (typeof password !== 'string' || password.length < 12 || password.length > 128)
    throw new CmsError('Şifre 12–128 karakter uzunluğunda olmalı.'); }
export async function hashPassword(password: string) { return hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 }); }
export async function consumeAttempt(key: string) {
    await transaction(async () => {
        const now = Date.now();
        await db().prepare('DELETE FROM attempts WHERE reset_at<=?').run(now);
        const row = await db().prepare('SELECT count FROM attempts WHERE key=?').get(key);
        if (row && Number(row.count) >= 5)
            throw new CmsError('Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.', 429);
        await db().prepare('INSERT INTO attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now + 15 * 60000);
    });
}
export async function setInitialPassword(password: unknown) {
    passwordRules(password);
    const encoded = await hashPassword(password);
    await transaction(async () => {
        if (await hasPassword())
            throw new CmsError('Yönetici hesabı zaten kurulmuş.', 409);
        await db().prepare('INSERT INTO credentials VALUES(1,?)').run(encoded);
        await audit('auth.setup');
    });
}
export async function sessionValid(token: string | undefined) {
    if (!token || !/^[a-f0-9]{64}$/.test(token))
        return false;
    return !!await db().prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires>?').get(tokenHash(token), Date.now());
}
export async function authenticated() { return await sessionValid((await cookies()).get(COOKIE)?.value); }
export async function requireAdmin() { if (!await authenticated())
    throw new CmsError('Oturum sona erdi. Tekrar giriş yapın.', 401); }
export async function login(password: unknown) {
    await consumeAttempt('login');
    const row = await db().prepare('SELECT hash FROM credentials WHERE id=1').get();
    const valid = typeof password === 'string' && password.length <= 128 && row && await verify(row.hash as string, password).catch(() => false);
    if (!valid) {
        await audit('auth.failed');
        throw new CmsError('Şifre hatalı.', 401);
    }
    const token = randomBytes(32).toString('hex');
    await transaction(async () => {
        if ((await db().prepare('SELECT hash FROM credentials WHERE id=1').get())?.hash !== row.hash)
            throw new CmsError('Şifre değişti. Yeniden giriş yapın.', 401);
        await db().prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
        await db().prepare('INSERT INTO sessions VALUES(?,?)').run(tokenHash(token), Date.now() + duration);
        await db().prepare('DELETE FROM attempts WHERE key=?').run('login');
        await audit('auth.login');
    });
    (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: duration / 1000 });
}
export async function logout() { const jar = await cookies(), token = jar.get(COOKIE)?.value; if (token)
    await db().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token)); jar.delete(COOKIE); }
export async function changePassword(current: unknown, password: unknown) {
    await requireAdmin();
    await consumeAttempt('password');
    passwordRules(password);
    const row = (await db().prepare('SELECT hash FROM credentials WHERE id=1').get())!;
    if (typeof current !== 'string' || current.length > 128 || !await verify(row.hash as string, current).catch(() => false))
        throw new CmsError('Mevcut şifre hatalı.', 401);
    const encoded = await hashPassword(password);
    await transaction(async () => {
        if ((await db().prepare('SELECT hash FROM credentials WHERE id=1').get())?.hash !== row.hash)
            throw new CmsError('Şifre başka bir oturumda değişti.', 409);
        await db().prepare('UPDATE credentials SET hash=? WHERE id=1').run(encoded);
        await db().exec('DELETE FROM sessions');
        await db().prepare('DELETE FROM attempts WHERE key=?').run('password');
        await audit('auth.password');
    });
    (await cookies()).delete(COOKIE);
}
