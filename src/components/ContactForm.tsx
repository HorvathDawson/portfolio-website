import React, { useState, useEffect, useRef } from 'react';
import { ContactLinks } from './ContactLinks';
import './ContactForm.css';

// Cloudflare Turnstile; the matching secret is the Worker's TURNSTILE_SECRET.
const TURNSTILE_SITE_KEY = '0x4AAAAAAFeUOlHDjf8q6XJb';
const TURNSTILE_ONLOAD = '__onTurnstileLoad';

interface Turnstile {
  render: (container: HTMLElement, params: { sitekey: string; theme?: 'light' | 'dark' | 'auto' }) => string;
  getResponse: (widgetId: string) => string | undefined;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
    [TURNSTILE_ONLOAD]?: () => void;
  }
}

// The Turnstile script is shared by every mount of the form, so load it once.
let turnstileReady: Promise<Turnstile> | null = null;

function loadTurnstile(): Promise<Turnstile> {
  turnstileReady ??= new Promise((resolve) => {
    window[TURNSTILE_ONLOAD] = () => resolve(window.turnstile!);
    const script = document.createElement('script');
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${TURNSTILE_ONLOAD}&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return turnstileReady;
}

interface ContactFormData {
  fullName: string;
  email: string;
  message: string;
}

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // The form sits at the bottom of the page, so only fetch Turnstile once
  // the form is getting close to the viewport.
  useEffect(() => {
    const container = turnstileRef.current;
    if (!container) return;

    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadTurnstile().then((turnstile) => {
        if (cancelled || turnstileWidgetId.current !== null) return;
        turnstileWidgetId.current = turnstile.render(container, { sitekey: TURNSTILE_SITE_KEY, theme: 'light' });
      });
    }, { rootMargin: '800px' });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: ContactFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Sent to the site Worker (worker/index.ts), which emails it via Cloudflare Email Routing.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const widgetId = turnstileWidgetId.current;
    const token = widgetId !== null ? window.turnstile?.getResponse(widgetId) : undefined;
    if (!token) {
      setError('Please complete the verification.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: formData.fullName, email: formData.email, message: formData.message, token }),
      });
      const result = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || !result.ok) throw new Error(result.error ?? 'There was an error submitting the form.');
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'There was an error submitting the form.');
      // Turnstile tokens are single-use, so a retry needs a fresh one.
      if (widgetId !== null) window.turnstile?.reset(widgetId);
    } finally {
      setIsSending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="contact-thanks" role="status" aria-live="polite">
        <h2>Thank you!</h2>
        <p>Your submission has been processed.</p>
      </div>
    );
  }

  return (
    <div className="contact-section">
      <div className="contact-heading">
        <h2 className="section-title">Contact Me</h2>
        <ContactLinks />
      </div>
      <form
        id="contact-form"
        onSubmit={handleSubmit}
        aria-label="Contact form"
      >
        <label id="contact-form-name-label" htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          className="form-input contact-name-field"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          placeholder="Leeroy Jenkins"
          maxLength={256}
          required
          aria-required="true"
        />

        <label id="contact-form-email-label" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          className="form-input contact-email-field"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="leeroy@example.com"
          maxLength={256}
          required
          aria-required="true"
        />

        <label id="contact-form-message-label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          className="textarea form-input contact-message-field"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Hello..."
          maxLength={5000}
        />

        <div
          ref={turnstileRef}
          className="contact-verification-field"
          aria-label="Verification"
        />

        <input
          id="contact-form-submit"
          type="submit"
          className="project-cta-button button"
          value={isSending ? 'Sending…' : 'Submit'}
          disabled={isSending}
        />

        {error && <p className="contact-error" role="alert">{error}</p>}
      </form>
    </div>
  );
};

export default ContactForm;