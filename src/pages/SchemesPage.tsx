import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Leaf,
  Heart,
  Home,
  Users,
  Activity,
  Search,
  Calendar,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockSchemes } from '@/data/mockData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Leaf,
  Heart,
  Home,
  Users,
  Activity,
};

const categories = ['All', 'Education', 'Agriculture', 'Women Welfare', 'Healthcare', 'Housing', 'Senior Citizens'];

export function SchemesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredSchemes = mockSchemes.filter((scheme) => {
    const matchesSearch = scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || scheme.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Government Schemes</h1>
        <p className="text-slate-600">Discover and apply for government schemes you're eligible for</p>
      </div>

      {/* Recommendation Banner */}
      <div className="mb-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Recommendations</span>
            </div>
            <h2 className="text-xl font-bold mb-1">Schemes Tailored for You</h2>
            <p className="text-blue-100 text-sm">
              Based on your profile, we've identified 4 schemes you may be eligible for
            </p>
          </div>
          <Link to={`/#scheme-engine`}>
            <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
              View Recommendations
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            placeholder="Search schemes..."
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme) => {
          const Icon = iconMap[scheme.icon] || Activity;
          return (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  {scheme.deadline && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      <Calendar className="w-3 h-3" />
                      Deadline: {format(scheme.deadline, 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">{scheme.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{scheme.description}</p>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Benefits</p>
                  <p className="text-sm text-slate-700">{scheme.benefits}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Eligibility</p>
                  <ul className="space-y-1">
                    {scheme.eligibility.slice(0, 2).map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {criteria}
                      </li>
                    ))}
                    {scheme.eligibility.length > 2 && (
                      <li className="text-xs text-blue-600">+{scheme.eligibility.length - 2} more criteria</li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                    {scheme.category}
                  </span>
                  <Button size="sm" className="text-sm" onClick={() => window.open('https://www.india.gov.in/', '_blank', 'noopener,noreferrer')}>
                    Apply Now
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No schemes found matching your criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
