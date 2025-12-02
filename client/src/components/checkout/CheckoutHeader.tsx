import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface CheckoutHeaderProps {
  breadcrumbs: Breadcrumb[];
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ breadcrumbs }) => {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm py-16 px-6 mb-6"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="text-center">
        <motion.h1
          className="text-3.5xl md:text-4.5xl lg:text-5.5xl font-normal text-black mb-4 leading-tight tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          Thanh toán
        </motion.h1>

        {/* Breadcrumb */}
        <motion.nav
          className="text-sm md:text-base flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {breadcrumbs.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            >
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-gray-600 font-normal hover:text-black transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-black font-medium text-base md:text-lg">{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="text-black">{'>'}</span>
              )}
            </motion.div>
          ))}
        </motion.nav>
      </div>
    </motion.div>
  );
};

