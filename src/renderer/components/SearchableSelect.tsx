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

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-gray-700">
          {selectedItem
            ? `${selectedItem.name} (₹${selectedItem.unitPrice.toFixed(2)})`
            : 'Select Item'}
        </span>
        <span className="text-gray-500">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          <input
            type="text"
            placeholder="Search by name, code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <ul className="max-h-48 overflow-y-auto" role="listbox">
            {filteredItems.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 text-sm">No items found</li>
            ) : (
              filteredItems.map((item) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={item.id === selectedItemId}
                >
                  <button
                    onClick={() => handleSelect(item.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      item.id === selectedItemId
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.code} • {item.category} • ₹{item.unitPrice.toFixed(2)}
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
