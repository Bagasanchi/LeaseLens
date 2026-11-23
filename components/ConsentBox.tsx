"use client";

import { useState } from "react";

interface ConsentBoxProps {
  title: string;
  description: string;
  defaultChecked?: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  children?: React.ReactNode;
}

export default function ConsentBox({
  title,
  description,
  defaultChecked = false,
  onChange,
  required = true,
  children,
}: ConsentBoxProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setChecked(newValue);
    onChange(newValue);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          id={`consent-${title.replace(/\s+/g, "-").toLowerCase()}`}
          checked={checked}
          onChange={handleChange}
          className="w-5 h-5 mt-0.5 text-cobalt-500 border-gray-300 rounded focus:ring-2 focus:ring-cobalt-500"
          required={required}
        />
        <div className="flex-1">
          <label
            htmlFor={`consent-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="block cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{title}</span>
              {required && <span className="text-red-500 text-sm">*</span>}
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            {children && <div className="mt-2 text-sm text-gray-500">{children}</div>}
          </label>
        </div>
      </div>
    </div>
  );
}