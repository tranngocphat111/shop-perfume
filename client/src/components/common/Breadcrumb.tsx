import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();

  const handleClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="mb-6 text-sm">
      <ol className="flex items-center space-x-2 text-gray-600">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.path || item.onClick ? (
                <button
                  onClick={() => handleClick(item)}
                  className="hover:text-black transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-black font-medium">{item.label}</span>
              )}
            </li>
            {index < items.length - 1 && <li>/</li>}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

