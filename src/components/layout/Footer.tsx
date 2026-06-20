import { Link } from 'react-router-dom';
import {
  Shield,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Github,
  Users,
} from 'lucide-react';

const teamMembers = [
  { name: 'Ashish Kayande', role: 'Lead Developer', initials: 'AK' },
  { name: 'Snehal Singh', role: 'UI/UX & Frontend', initials: 'SS' },
  { name: 'Prisha Mishra', role: 'AI & Backend', initials: 'PM' },
];

export function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">JanSeva</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering citizens with AI-driven governance solutions for a
              transparent and efficient democracy.
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Built by <span className="text-sky-400">CodeSmiths</span>
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="GitHub" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">Dashboard</Link></li>
              <li><Link to="/file-complaint" className="text-slate-400 hover:text-white text-sm transition-colors">File Complaint</Link></li>
              <li><Link to="/track" className="text-slate-400 hover:text-white text-sm transition-colors">Track Complaint</Link></li>
              <li><Link to="/schemes" className="text-slate-400 hover:text-white text-sm transition-colors">Government Schemes</Link></li>
              <li><Link to="/analytics" className="text-slate-400 hover:text-white text-sm transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* About / Team */}
          <div id="about">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Our Team
            </h3>
            <ul className="space-y-3">
              {teamMembers.map((member) => (
                <li key={member.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-xs font-bold text-white">
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <div className="space-y-2.5">
              <a href="mailto:team@codesmiths.dev" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                <Mail className="w-4 h-4" />
                <span>team@codesmiths.dev</span>
              </a>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@janseva.gov.in</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Phone className="w-4 h-4" />
                <span>1800-200-0001</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4" />
                <span>New Delhi, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2024 JanSeva. Built by <span className="text-sky-400 font-medium">CodeSmiths</span>. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Government of India • Verified & Secure
          </p>
        </div>
      </div>
    </footer>
  );
}
