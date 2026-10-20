import React, { useState, useEffect, useRef } from 'react';

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

  // Inline styles
  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--warm-white, #f0f0f0)', // Fallback color added
    borderRadius: '5px',
    minHeight: '60px',
    marginBottom: '20px',
    border: '1px solid #ccc', // Added border for visibility
    padding: '0 15px'
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '140px',
    paddingTop: '14px',
    paddingBottom: '14px',
  };

  if (isSubmitted) {
    return (
      <div style={{ marginTop: '150px', textAlign: 'center' }} role="status" aria-live="polite">
        <h2>Thank you!</h2>
        <p>Your submission has been processed.</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          #contact-form {
            display: grid;
            grid-column-gap: 20px;
            grid-row-gap: 7px;
            grid-template-rows: auto auto;
            grid-template-columns: 1fr 1fr;
            grid-auto-columns: 1fr;
            grid-auto-flow: row;
          }

          #contact-form-name-label { grid-area: 1/1/2/2; }
          .contact-name-field      { grid-area: 2/1/3/2; }
          #contact-form-email-label{ grid-area: 1/2/2/3; }
          .contact-email-field     { grid-area: 2/2/3/3; }
          #contact-form-message-label { grid-area: 3/1/4/3; }
          .contact-message-field   { grid-area: 4/1/5/3; }
          
          /* Ensure container has size */
          .contact-recaptcha-field { 
            grid-area: 5/1/6/2; 
            min-height: 78px;
            margin-bottom: 20px;
          }
          
          #contact-form-submit {
            grid-area: 5/2/6/3;
            justify-self: end;
            height: 50px;
            padding: 0 30px;
            cursor: pointer;
          }

          @media screen and (max-width: 991px) {
            #contact-form {
              grid-template-columns: 1fr;
            }
            #contact-form-name-label { grid-area: 1/1/2/2; }
            .contact-name-field      { grid-area: 2/1/3/2; }
            #contact-form-email-label{ grid-area: 3/1/4/2; }
            .contact-email-field     { grid-area: 4/1/5/2; }
            #contact-form-message-label { grid-area: 5/1/6/2; }
            .contact-message-field   { grid-area: 6/1/7/2; }
            .contact-recaptcha-field { grid-area: 7/1/8/2; }
            
            #contact-form-submit {
              grid-area: 8/1/9/2;
              justify-self: start;
            }
          }
        `}
      </style>

      <div style={{ marginTop: '150px' }}>
        <h2 className="section-title">Contact Me</h2>
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
            style={inputStyle}
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
            style={inputStyle}
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
            style={textareaStyle}
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Hello..."
            maxLength={5000}
          />

          {/* ReCAPTCHA Container */}
          <div ref={recaptchaRef}
               className="contact-recaptcha-field"
               aria-label="reCAPTCHA verification"></div>

          <input 
            id="contact-form-submit" 
            type="submit"
            className="project-cta-button button"
            value="Submit"
          />
        </form>
      </div>
    </>
  );
};

export default ContactForm;