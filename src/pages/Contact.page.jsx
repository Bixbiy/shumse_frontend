import { useState, useMemo, useEffect, useContext } from 'react';
import { Helmet } from "react-helmet-async";
import api from "../common/api";
import { Toaster, toast } from "react-hot-toast";
import { UserContext } from "../App";
// import Skeleton from "react-loading-skeleton"; // If you want a skeleton loader, install this package

const initialContact = { name: '', email: '', subject: '', message: '' };
const initialEditor = { name: '', email: '', qualification: '', accountType: '', message: '', agree: false };

const sanitize = (str) =>
  typeof str === "string"
    ? str.replace(/[<>'"$;]/g, "") // allow spaces!
    : str;

const ContactPage = () => {
  const { userAuth } = useContext(UserContext) || {};
  const isLoggedIn = !!userAuth?.access_token;
  const [activeTab, setActiveTab] = useState('contact');
  const [contactForm, setContactForm] = useState(initialContact);
  const [editorForm, setEditorForm] = useState(initialEditor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editorAppStatus, setEditorAppStatus] = useState(null);

  // SEO metadata
  const meta = useMemo(() => ({
    title: "Contact us & Apply for Editor | Shums",
    description: "Contact us for inquiries, collaborations, or apply to become an editor. Join our professional content team.",
    keywords: "contact, apply editor, blog, news, collaboration, editor application",
    canonical: window.location.href
  }), []);

  // Fetch user profile and editor application status if logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setContactForm(initialContact);
      setEditorForm(initialEditor);
      setProfileLoaded(true);
      setEditorAppStatus(null);
      return;
    }
    setLoadingProfile(true);
    setProfileLoaded(false);
    let userEmail = "";
    api
      .post(
        "/get-profile",
        { username: userAuth.username }
      )
      .then(({ data }) => {
        const { personal_info } = data;
        userEmail = personal_info.email || "";
        setContactForm((prev) => ({
          ...prev,
          name: personal_info.fullname || "",
          email: personal_info.email || "",
        }));
        setEditorForm((prev) => ({
          ...prev,
          name: personal_info.fullname || "",
          email: personal_info.email || "",
        }));
        // Fetch latest editor application status
        return api.get(
          `/editor-application/status?email=${encodeURIComponent(userEmail)}`
        );
      })
      .then(({ data }) => {
        setEditorAppStatus(data);
      })
      .catch(() => {
        setEditorAppStatus(null);
      })
      .finally(() => {
        setLoadingProfile(false);
        setProfileLoaded(true);
      });
    // eslint-disable-next-line
  }, [isLoggedIn, userAuth?.username]);

  // Handle input changes for both forms (sanitize input)
  const handleChange = (e, formType) => {
    const { name, value, type, checked } = e.target;
    if (formType === 'contact') {
      setContactForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : sanitize(value) }));
    } else {
      setEditorForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : sanitize(value) }));
    }
  };

  // Prevent guests from submitting
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please sign in to contact or apply.", { duration: 3000 });
      setTimeout(() => (window.location.href = "/signin"), 1200);
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);

    let endpoint = "/contact";
    let payload = contactForm;

    if (activeTab === 'editor') {
      endpoint = "/apply-editor";
      payload = editorForm;
      if (!editorForm.agree) {
        setSubmitStatus('Please agree to the terms and conditions.');
        setIsSubmitting(false);
        return;
      }
    }

    // Sanitize all string fields before sending
    Object.keys(payload).forEach((k) => {
      if (typeof payload[k] === "string") payload[k] = sanitize(payload[k]);
    });

    try {
      await api.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSubmitStatus('success');
      setContactForm(initialContact);
      setEditorForm(initialEditor);
      // Refetch application status after successful apply
      if (activeTab === "editor") {
        setLoadingProfile(true);
        const { data } = await api.get(
          `/editor-application/status?email=${encodeURIComponent(payload.email)}`
        );
        setEditorAppStatus(data);
        setLoadingProfile(false);
      }
    } catch (err) {
      setSubmitStatus(
        err?.response?.data?.error
          ? err.response.data.error
          : 'error'
      );
      // If error is 429, update status section
      if (err?.response?.status === 429 && err.response.data) {
        setEditorAppStatus({
          status: err.response.data.status,
          requestDate: err.response.data.requestDate,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Contact & Editor Application
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              Reach out for support, collaborations, or apply to join our editorial team.
            </p>
          </div>
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <button
              className={`px-6 py-3 rounded-t-lg font-semibold transition-all duration-300 ${activeTab === 'contact'
                ? 'bg-white shadow text-blue-700'
                : 'bg-gray-100 text-gray-500 hover:bg-white'}`}
              onClick={() => { setActiveTab('contact'); setSubmitStatus(null); }}
            >
              Contact Us
            </button>
            <button
              className={`px-6 py-3 rounded-t-lg font-semibold transition-all duration-300 ml-2 ${activeTab === 'editor'
                ? 'bg-white shadow text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-white'}`}
              onClick={() => { setActiveTab('editor'); setSubmitStatus(null); }}
            >
              Apply for Editor
            </button>
          </div>
          {/* Editor Application Status Section */}
          {activeTab === "editor" && isLoggedIn && editorAppStatus && editorAppStatus.status && (
            <div className="mb-8">
              <div className="p-4 bg-gradient-to-r  from-blue-600 to-pink-500 border-l-4 border-black rounded-lg mb-4">
                <div className="font-semibold text-white opacity-90 mb-1">
                  You have an already active request.
                </div>
                <div className=" text-white opacity-90 text-sm">
                  Status: <span className="capitalize">{editorAppStatus.status}</span>
                </div>
                <div className="text-white opacity-90 text-sm">
                  Last request date: {new Date(editorAppStatus.requestDate).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl p-8 sm:p-10">
            {submitStatus === 'success' && (
              <div className="mb-8 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Thank you! We'll get back to you soon.</p>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="mb-8 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>There was an error submitting your message. Please try again.</p>
              </div>
            )}
            {typeof submitStatus === 'string' && submitStatus !== 'success' && submitStatus !== 'error' && (
              <div className="mb-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{submitStatus}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Common fields */}
              <div>
                <label htmlFor="name" className="block capitalize text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={activeTab === 'contact' ? contactForm.name : editorForm.name}
                  onChange={e => handleChange(e, activeTab)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                  placeholder="John Doe"
                  disabled={isLoggedIn}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={activeTab === 'contact' ? contactForm.email : editorForm.email}
                  onChange={e => handleChange(e, activeTab)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                  placeholder="your@email.com"
                  disabled={isLoggedIn}
                />
              </div>
              {/* Contact Us fields */}
              {activeTab === 'contact' && (
                <>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={contactForm.subject}
                      onChange={e => handleChange(e, 'contact')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 appearance-none"
                    >
                      <option value="">Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Advertising">Advertising</option>
                      <option value="Content Collaboration">Content Collaboration</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={contactForm.message}
                      onChange={e => handleChange(e, 'contact')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                      placeholder="Your message here..."
                    />
                  </div>
                </>
              )}
              {/* Editor Application fields */}
              {activeTab === 'editor' && (
                <>
                  <div>
                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="qualification"
                      name="qualification"
                      type="text"
                      required
                      value={editorForm.qualification}
                      onChange={e => handleChange(e, 'editor')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                      placeholder="Your qualification (e.g., BA in Journalism)"
                    />
                  </div>
                  <div>
                    <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="accountType"
                      name="accountType"
                      required
                      value={editorForm.accountType}
                      onChange={e => handleChange(e, 'editor')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 appearance-none"
                    >
                      <option value="">Select account type</option>
                      <option value="Personal">Personal</option>
                      <option value="Professional">Professional</option>
                      <option value="Organization">Organization</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Why do you want to become an editor? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={editorForm.message}
                      onChange={e => handleChange(e, 'editor')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                      placeholder="Tell us about your motivation and experience..."
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="agree"
                      name="agree"
                      type="checkbox"
                      checked={editorForm.agree}
                      onChange={e => handleChange(e, 'editor')}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      required
                    />
                    <label htmlFor="agree" className="ml-2 block text-sm text-gray-700">
                      I agree to the <a href="/terms" className="text-indigo-600 underline hover:text-indigo-800">terms and conditions</a>
                    </label>
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingProfile || (editorAppStatus && editorAppStatus.status && activeTab === "editor")}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? "Sending..." : activeTab === 'contact' ? 'Send Message' : 'Apply Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;