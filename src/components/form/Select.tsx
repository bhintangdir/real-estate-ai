"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "../../icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  placement?: "top" | "bottom";
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value: controlledValue,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(controlledValue || defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(controlledValue || defaultValue);
  }, [controlledValue, defaultValue]);

  // Cari label untuk nilai yang terpilih
  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label;

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    setIsOpen(false);
  };

  const placementClasses = placement === "top" ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Tombol Pemicu (Toggle) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`dropdown-toggle flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs transition focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 ${
          selectedValue
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-400"
        } ${className}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? (placement === "top" ? "rotate-0" : "rotate-180") : (placement === "top" ? "rotate-180" : "rotate-0")
          }`}
        />
      </button>

      {/* Konten Dropdown (Menu Pilihan) */}
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className={`left-0 w-full border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${placementClasses}`}
      >
        <div className="max-h-60 overflow-y-auto no-scrollbar">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            options.map((option) => (
              <DropdownItem
                key={option.value}
                onClick={() => handleSelect(option.value)}
                baseClassName={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedValue === option.value
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-medium"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                }`}
              >
                {option.label}
              </DropdownItem>
            ))
          )}
        </div>
      </Dropdown>
    </div>
  );
};

export default Select;
