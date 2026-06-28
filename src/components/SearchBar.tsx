'use client';

import { useRouter } from 'next/navigation';
import { IoSearchOutline } from 'react-icons/io5';

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ 
  placeholder = 'Search...'
}: SearchBarProps) {
  const router = useRouter();

  return (
    <div 
      className="relative w-full cursor-pointer" 
      onClick={() => router.push('/search')}
    >
      <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none" />
      <input
        type="text"
        readOnly
        placeholder={placeholder}
        className="w-full bg-[#16181c] text-white text-sm rounded-full pl-10 pr-4 py-2 border border-[#2f3336] cursor-pointer placeholder:text-gray-600"
      />
    </div>
  );
}
