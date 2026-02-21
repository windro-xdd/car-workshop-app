import React, { useState, useRef, useEffect } from 'react';
import { Item } from '@/types';

interface SearchableSelectProps {
  items: Item[];
  selectedItemId: string;
  onSelect: (itemId: string) => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  items,
  selectedItemId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show active items in the filtered list
  const filteredItems = items.filter(
    (item) =>
      item.isActive &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedItem = items.find((item) => item.id === selectedItemId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (itemId: string) => {
    onSelect(itemId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 text-left flex justify-between items-center ${
          isOpen ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-zinc-200 hover:border-zinc-300'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedItem ? "text-zinc-900 font-medium" : "text-zinc-400"}>
          {selectedItem
            ? `${selectedItem.name} (₹${selectedItem.unitPrice.toFixed(2)})`
            : 'Select an item...'}
        </span>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-zinc-100">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
            {filteredItems.length === 0 ? (
              <li className="px-3 py-4 text-zinc-500 text-sm text-center">No items found</li>
            ) : (
              filteredItems.map((item) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={item.id === selectedItemId}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(item.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex flex-col ${
                      item.id === selectedItemId
                        ? 'bg-brand-50 text-brand-900'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 flex items-center">
                      <span className="font-mono">{item.code}</span>
                      <span className="mx-1.5">•</span>
                      <span>{item.category}</span>
                      <span className="mx-1.5">•</span>
                      <span className="font-medium text-zinc-700">₹{item.unitPrice.toFixed(2)}</span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
