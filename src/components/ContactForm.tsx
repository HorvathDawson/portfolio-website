import React, { useState, useEffect, useRef } from 'react';
import { ContactLinks } from './ContactLinks';
import './ContactForm.css';

const RECAPTCHA_SITE_KEY = '6LeBU6gqAAAAAEJDe5diUdowY2Q0cwpk0GyEdSdy';
const RECAPTCHA_ONLOAD = '__onRecaptchaLoad';

interface ReCaptcha {
  render: (container: HTMLElement, params: { sitekey: string }) => number;
  getResponse: (widgetId?: number) => string;
}

declare global {
  interface Window {
    grecaptcha?: ReCaptcha;
    [RECAPTCHA_ONLOAD]?: () => void;
  }
}

// The reCAPTCHA script is shared by every mount of the form, so load it once.
let recaptchaReady: Promise<ReCaptcha> | null = null;

function loadRecaptcha(): Promise<ReCaptcha> {
  recaptchaReady ??= new Promise((resolve) => {
    window[RECAPTCHA_ONLOAD] = () => resolve(window.grecaptcha!);
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=${RECAPTCHA_ONLOAD}&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return recaptchaReady;
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

  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  // reCAPTCHA is heavy and the form sits at the bottom of the page, so only
  // fetch it once the form is getting close to the viewport.
  useEffect(() => {
    const container = recaptchaRef.current;
    if (!container) return;

    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadRecaptcha().then((grecaptcha) => {
        if (cancelled || recaptchaWidgetId.current !== null) return;
        recaptchaWidgetId.current = grecaptcha.render(container, { sitekey: RECAPTCHA_SITE_KEY });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if reCAPTCHA is loaded and verified
    const widgetId = recaptchaWidgetId.current;
    const recaptchaResponse = widgetId !== null ? window.grecaptcha?.getResponse(widgetId) : '';
    
    if (!recaptchaResponse) {
      alert('Please complete the reCAPTCHA.');
      return;
    }

    const googleFormData = new FormData();
    // Map state keys to the Google Form entry IDs
    googleFormData.append('entry.2005620554', formData.fullName);
    googleFormData.append('entry.1045781291', formData.email);
    googleFormData.append('entry.839337160', formData.message);
    googleFormData.append('entry.670876903', recaptchaResponse);

    fetch('https://docs.google.com/forms/d/e/1FAIpQLSd-ORTakZ4IOBgNYOtuETuGr5X5I9a8xMa0kjfiJJVOyTIASg/formResponse', {
      method: 'POST',
      body: googleFormData,
      mode: 'no-cors',
    })
    .then(() => {
        setIsSubmitted(true);
    })
    .catch(() => {
        // Because of 'no-cors', errors are hard to catch, but good to have
        alert("There was an error submitting the form.");
    });
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
          placeholder="JenkinsLeeroy@gmail.com"
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
          ref={recaptchaRef}
          className="contact-recaptcha-field"
          aria-label="reCAPTCHA verification"
        />

        <input
          id="contact-form-submit"
          type="submit"
          className="project-cta-button button"
          value="Submit"
        />
      </form>
    </div>
  );
};

export default ContactForm;