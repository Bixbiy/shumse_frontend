import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';

const Portfolio = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);

  const roles = ['Full Stack Developer', 'MERN Stack Expert', 'Web Development Specialist', 'UI/UX Enthusiast'];
  const sectionRefs = {
    home: useRef(null),
    about: useRef(null),
    skills: useRef(null),
    projects: useRef(null),
    experience: useRef(null),
    services: useRef(null),
    contact: useRef(null)
  };

  // Typing animation effect
  useEffect(() => {
    let currentText = '';
    let currentIndex = 0;
    const role = roles[currentRoleIndex];

    const typingInterval = setInterval(() => {
      if (currentIndex < role.length) {
        currentText += role[currentIndex];
        setTypedText(currentText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          const deletingInterval = setInterval(() => {
            if (currentText.length > 0) {
              currentText = currentText.slice(0, -1);
              setTypedText(currentText);
            } else {
              clearInterval(deletingInterval);
              setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
            }
          }, 50);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [currentRoleIndex]);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    sectionRefs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFormSubmitted(true);
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const skills = [
    { name: 'React.js', level: 95, icon: '⚛️', category: 'Frontend' },
    { name: 'Node.js', level: 92, icon: '🟢', category: 'Backend' },
    { name: 'Express.js', level: 90, icon: '🚀', category: 'Backend' },
    { name: 'MongoDB', level: 88, icon: '🍃', category: 'Database' },
    { name: 'Tailwind CSS', level: 95, icon: '🎨', category: 'Frontend' },
    { name: 'PHP', level: 85, icon: '🐘', category: 'Backend' },
    { name: 'HTML/CSS', level: 98, icon: '📝', category: 'Frontend' },
    { name: 'JavaScript', level: 95, icon: '✨', category: 'Frontend' }
  ];

  const projects = [
    {
      title: 'Shums',
      description: 'A Modern Blogging and Community Platform with real-time features, user authentication, and rich content creation tools.',
      tech: ['React', 'Node.js', 'MongoDB', 'Express', 'Tailwind CSS'],
      image: '/C:/Users/abbas/.gemini/antigravity/brain/db4e520e-88d4-41d1-9ea3-b865af8ac95b/shums_project_mockup_1764861813923.png',
      features: ['Real-time notifications', 'Community system', 'Rich text editor', 'Story feature', 'Dark mode'],
      link: '#'
    }
  ];

  const experiences = [
    {
      year: '2023 - Present',
      title: 'Full Stack Developer',
      company: 'Freelance',
      description: 'Building modern web applications using MERN stack, delivering high-quality solutions for clients worldwide.'
    },
    {
      year: '2022 - 2023',
      title: 'Web Developer',
      company: 'Independent Projects',
      description: 'Developed and maintained multiple web applications, focusing on performance optimization and user experience.'
    },
    {
      year: '2021 - 2022',
      title: 'Learning & Growth',
      company: 'Self-taught Developer',
      description: 'Intensive learning of modern web technologies including React, Node.js, and database management.'
    }
  ];

  const services = [
    {
      icon: '💻',
      title: 'Web Development',
      description: 'Custom web application development using modern technologies like React, Node.js, and MongoDB.'
    },
    {
      icon: '🛠️',
      title: 'Web Maintenance',
      description: 'Ongoing support and maintenance for existing websites, ensuring optimal performance and security.'
    },
    {
      icon: '📱',
      title: 'Responsive Design',
      description: 'Mobile-first, responsive websites that work seamlessly across all devices and screen sizes.'
    },
    {
      icon: '⚡',
      title: 'Performance Optimization',
      description: 'Speed optimization, code refactoring, and implementation of best practices for better performance.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Bilal Ahmad - Full Stack Developer | MERN Stack Expert</title>
        <meta name="description" content="Bilal Ahmad - Expert Full Stack Developer specializing in React.js, Node.js, Express, MongoDB, and modern web technologies. Building high-quality web applications." />
      </Helmet>

      <div className="portfolio-page min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0a0a0a] dark:via-[#18181b] dark:to-[#27272a] text-black dark:text-white overflow-x-hidden">

        {/* Custom Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Bilal Ahmad
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-8">
                {['home', 'about', 'skills', 'projects', 'experience', 'services', 'contact'].map(section => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className={`capitalize text-sm font-medium hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300 relative group ${activeSection === section ? 'text-orange-500 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {section}
                    <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-pink-500 transform origin-left transition-transform duration-300 ${activeSection === section ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}></span>
                  </button>
                ))}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-5 flex flex-col justify-between">
                    <span className={`w-full h-0.5 bg-black dark:bg-white transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`w-full h-0.5 bg-black dark:bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`w-full h-0.5 bg-black dark:bg-white transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 border-t border-gray-200 dark:border-gray-800' : 'max-h-0'}`}>
            <div className="px-4 py-4 space-y-3 bg-white dark:bg-black">
              {['home', 'about', 'skills', 'projects', 'experience', 'services', 'contact'].map(section => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`block w-full text-left capitalize px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${activeSection === section ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' : ''
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section ref={sectionRefs.home} id="home" className="min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            {/* Text Content */}
            <div className="space-y-6 text-center md:text-left order-2 md:order-1">
              <div className="space-y-2">
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Hello, I'm</p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
                  Bilal Ahmad
                </h1>
                <div className="h-12 flex items-center justify-center md:justify-start">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-300">
                    <span className="inline-block min-w-[300px]">{typedText}</span>
                    <span className="animate-blink">|</span>
                  </h2>
                </div>
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                Expert in building modern, scalable web applications using React.js, Node.js, Express, MongoDB, and cutting-edge technologies. Passionate about creating exceptional digital experiences.
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button
                  onClick={() => scrollToSection('projects')}
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transform hover:-translate-y-1 transition-all duration-300"
                >
                  View My Work
                  <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-full font-semibold hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transform hover:-translate-y-1 transition-all duration-300"
                >
                  Get In Touch
                </button>
              </div>

              {/* Social Links */}
              <div className="flex gap-4 justify-center md:justify-start pt-4">
                <a
                  href="https://github.com/bixbiy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 transform hover:-translate-y-1 transition-all duration-300"
                >
                  <i className="fi fi-brands-github text-xl"></i>
                </a>
              </div>
            </div>

            {/* Profile Image */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl">
                  <img
                    src="https://via.placeholder.com/400x400/FF6B35/FFFFFF?text=BA"
                    alt="Bilal Ahmad"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center pt-2">
              <div className="w-1 h-3 bg-orange-500 rounded-full animate-scroll-down"></div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section ref={sectionRefs.about} id="about" className="py-20 px-4 sm:px-6 lg:px-8 opacity-0">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              About Me
            </h2>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  I'm Bilal Ahmad, a passionate <span className="font-semibold text-orange-500">Full Stack Developer</span> with expertise in the MERN stack and modern web technologies. I specialize in creating robust, scalable, and user-friendly web applications.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  With a strong foundation in both frontend and backend development, I bring ideas to life through clean code, intuitive design, and cutting-edge technology. My goal is to build digital solutions that make a real impact.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/10 dark:to-pink-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                    <h3 className="text-3xl font-bold text-orange-500 mb-2">15+</h3>
                    <p className="text-gray-600 dark:text-gray-400">Projects Completed</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                    <h3 className="text-3xl font-bold text-purple-500 mb-2">3+</h3>
                    <p className="text-gray-600 dark:text-gray-400">Years Experience</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎯', title: 'Mission Driven', desc: 'Focused on delivering value' },
                  { icon: '⚡', title: 'Fast Learner', desc: 'Always adapting to new tech' },
                  { icon: '🤝', title: 'Team Player', desc: 'Great at collaboration' },
                  { icon: '💡', title: 'Problem Solver', desc: 'Creative solutions' }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="font-semibold mb-1 text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section ref={sectionRefs.skills} id="skills" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black/30 opacity-0">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Skills & Expertise
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Expert proficiency in modern web development technologies and frameworks
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="group p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{skill.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{skill.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{skill.category}</p>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm font-semibold text-orange-500 mt-2">{skill.level}%</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section ref={sectionRefs.projects} id="projects" className="py-20 px-4 sm:px-6 lg:px-8 opacity-0">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Featured Project
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Showcasing my best work in web development
            </p>

            <div className="grid lg:grid-cols-1 gap-8">
              {projects.map((project, idx) => (
                <div
                  key={idx}
                  className="group bg-white dark:bg-gray-800/50 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500"
                >
                  <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Project Image */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-pink-500/10">
                      <div className="aspect-video bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">💻</div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                            Shums Platform
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="flex flex-col justify-center space-y-4">
                      <div>
                        <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      {/* Features */}
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Key Features:</h4>
                        <ul className="space-y-2">
                          {project.features.map((feature, fidx) => (
                            <li key={fidx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech, tidx) => (
                          <span
                            key={tidx}
                            className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium border border-orange-200 dark:border-orange-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="pt-4">
                        <a
                          href={project.link}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-xl hover:shadow-orange-500/50 transform hover:-translate-y-1 transition-all duration-300"
                        >
                          View Project
                          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section ref={sectionRefs.experience} id="experience" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black/30 opacity-0">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Professional Journey
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              My career path and development experience
            </p>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-pink-500 to-purple-500"></div>

              {experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className={`relative mb-12 ${idx % 2 === 0 ? 'md:pr-1/2 md:text-right' : 'md:pl-1/2 md:ml-auto'} md:w-1/2 pl-20 md:pl-0 md:pr-0`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute top-0 w-6 h-6 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full border-4 border-white dark:border-gray-900 left-5 md:left-auto ${idx % 2 === 0 ? 'md:right-[-13px]' : 'md:left-[-13px]'}`}></div>

                  <div className={`bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 ${idx % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}>
                    <span className="inline-block px-4 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-sm font-semibold mb-3">
                      {exp.year}
                    </span>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{exp.title}</h3>
                    <p className="text-orange-500 font-semibold mb-3">{exp.company}</p>
                    <p className="text-gray-600 dark:text-gray-400">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section ref={sectionRefs.services} id="services" className="py-20 px-4 sm:px-6 lg:px-8 opacity-0">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              What I Offer
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Professional web development services tailored to your needs
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="group p-8 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="text-5xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section ref={sectionRefs.contact} id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black/30 opacity-0">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Have a project in mind? Let's work together to bring your ideas to life!
            </p>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                {formSubmitted ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-500 mb-2">Thank You!</h3>
                    <p className="text-gray-600 dark:text-gray-400">Your message has been sent successfully. I'll get back to you soon!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
                        placeholder="Your Name"
                      />
                      {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
                        placeholder="your.email@example.com"
                      />
                      {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border ${formErrors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
                        placeholder="Subject"
                      />
                      {formErrors.subject && <p className="text-red-500 text-sm mt-1">{formErrors.subject}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="5"
                        className={`w-full px-4 py-3 rounded-lg border ${formErrors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none`}
                        placeholder="Your message..."
                      ></textarea>
                      {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Sending...
                        </span>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Let's Connect</h3>
                  <div className="space-y-4">
                    <a
                      href="https://github.com/bixbiy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <i className="fi fi-brands-github text-xl"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">GitHub</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">@bixbly</p>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 p-8 rounded-2xl text-white">
                  <h3 className="text-2xl font-bold mb-4">Ready to Start?</h3>
                  <p className="mb-6">I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      <span>Quick Response Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💼</span>
                      <span>Professional Service</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      <span>High-Quality Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Footer */}
        <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Brand */}
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
                  Bilal Ahmad
                </h3>
                <p className="text-gray-400">
                  Full Stack Developer specializing in modern web technologies and creating exceptional digital experiences.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <div className="space-y-2">
                  {['home', 'about', 'skills', 'projects', 'contact'].map(section => (
                    <button
                      key={section}
                      onClick={() => scrollToSection(section)}
                      className="block capitalize text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/bixbiy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                  >
                    <i className="fi fi-brands-github"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} Bilal Ahmad. All rights reserved. Built with React & Tailwind CSS.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Styles */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes scroll-down {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }

        .animate-scroll-down {
          animation: scroll-down 2s infinite;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  );
};

export default Portfolio;