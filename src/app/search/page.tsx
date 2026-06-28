'use client';

import { useState, useEffect, useRef } from 'react';
import { IoSearchOutline, IoCloseOutline, IoArrowBackOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'listing';
  title: string;
  subtitle?: string;
  image?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'posts' | 'listings'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        await performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeFilter]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeFilter}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') {
      router.push(`/user/${result.id}`);
    } else if (result.type === 'post') {
      router.push(`/feed?post=${result.id}`);
    } else if (result.type === 'listing') {
      router.push(`/marketplace/${result.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black animate-fadeIn">
      {/* Header */}
      <div className="sticky top-0 bg-black border-b border-[#2f3336] p-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 text-white">
            <IoArrowBackOutline className="text-2xl" />
          </button>
          <div className="flex-1 relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, posts, or listings..."
              className="w-full bg-[#16181c] text-white text-sm rounded-full pl-10 pr-10 py-2.5 border border-[#2f3336] focus:border-blue-500 focus:outline-none placeholder:text-gray-600"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All' },
            { key: 'users', label: 'Users' },
            { key: 'posts', label: 'Posts' },
            { key: 'listings', label: 'Listings' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.key
                  ? 'bg-white text-black'
                  : 'bg-[#16181c] text-gray-400 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="text-center py-12">
            <IoSearchOutline className="mx-auto text-gray-600 text-5xl mb-3" />
            <p className="text-gray-400 text-sm">No results for "{query}"</p>
            <p className="text-gray-600 text-xs mt-1">Try different keywords</p>
          </div>
        )}

        {!loading && query.trim().length < 2 && (
          <div className="text-center py-12">
            <IoSearchOutline className="mx-auto text-gray-600 text-5xl mb-3" />
            <p className="text-gray-400 text-sm">Start typing to search</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#16181c] transition-colors border-b border-[#2f3336]"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {result.avatar || result.image ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a]">
                      <img
                        src={result.avatar || result.image}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-base">
                        {result.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-white font-medium text-sm truncate">{result.title}</p>
                    {result.verified && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {result.subtitle && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">{result.subtitle}</p>
                  )}
                  <span className="inline-block px-2 py-0.5 bg-[#16181c] text-gray-500 text-xs rounded mt-1 capitalize">{result.type}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in;
        }
      `}</style>
    </div>
  );
}
