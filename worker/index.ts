/**
 * Site Worker. Static files are served from dist/ without reaching this code
 * (see run_worker_first in wrangler.jsonc); it only handles /api/*.
 *
 * POST /api/contact: checks the Cloudflare Turnstile token, then emails the
 * message through Email Routing.
 */
import { EmailMessage } from 'cloudflare:email';

interface ContactEnv extends Env {
  /** Address on the Email Routing domain that the mail is sent from. */
  CONTACT_FROM: string;
  /** Verified Email Routing destination that receives the messages. */
  CONTACT_TO: string;
  TURNSTILE_SECRET: string;
}

const LIMITS = { name: 256, email: 256, message: 5000 };

// Deliberately loose; it only has to be a plausible single address with no
// whitespace, since it ends up in the Reply-To header.
const EMAIL_PATTERN = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/;

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fail = (status: number, error: string) => json(status, { ok: false, error });

/** Base64 of UTF-8 text, wrapped at 76 columns as MIME requires. */
function base64Lines(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/.{1,76}/g, '$&\r\n');
}

/** RFC 2047 encoded-word, so any characters are safe in a header. */
const encodeHeader = (text: string) => `=?UTF-8?B?${base64Lines(text).replace(/\r\n/g, '')}?=`;

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const outcome = await res.json<{ success: boolean }>();
  return outcome.success;
}

async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method !== 'POST') return fail(405, 'Method not allowed.');
  if (!env.CONTACT_FROM || !env.CONTACT_TO || !env.TURNSTILE_SECRET) {
    return fail(503, 'The contact form is not configured yet.');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Invalid request.');
  }

  const field = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  const name = field('name').replace(/\s+/g, ' ');
  const email = field('email');
  const message = field('message');
  const token = field('token');

  if (!name || name.length > LIMITS.name) return fail(400, 'Please enter your name.');
  if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email) return fail(400, 'Please enter a valid email address.');
  if (message.length > LIMITS.message) return fail(400, 'Your message is too long.');
  if (!token) return fail(400, 'Please complete the verification.');

  let verified: boolean;
  try {
    verified = await verifyTurnstile(token, env.TURNSTILE_SECRET, request.headers.get('CF-Connecting-IP'));
  } catch (err) {
    console.error('contact form: Turnstile check failed', err);
    return fail(502, 'Verification is unavailable right now. Please try again later.');
  }
  if (!verified) return fail(403, 'Verification failed. Please try again.');

  const domain = env.CONTACT_FROM.split('@')[1];
  const raw = [
    `From: ${encodeHeader('Portfolio contact form')} <${env.CONTACT_FROM}>`,
    `To: <${env.CONTACT_TO}>`,
    `Reply-To: ${encodeHeader(name)} <${email}>`,
    `Subject: ${encodeHeader(`Portfolio message from ${name}`)}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(`From: ${name} <${email}>\n\n${message || '(no message)'}`),
  ].join('\r\n');

  try {
    await env.SEND_EMAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) {
    console.error('contact form: send failed', err);
    return fail(502, 'Your message could not be sent. Please try again later.');
  }

  return json(200, { ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env as ContactEnv);
    if (pathname.startsWith('/api/')) return fail(404, 'Not found.');
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
