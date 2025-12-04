import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 5000,
}: ToastProps) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500",
          progressBg: "bg-green-600",
          icon: "fa-check-circle",
          iconBg: "bg-green-600",
        };
      case "error":
        return {
          bg: "bg-red-500",
          progressBg: "bg-red-600",
          icon: "fa-times-circle",
          iconBg: "bg-red-600",
        };
      case "warning":
        return {
          bg: "bg-yellow-500",
          progressBg: "bg-yellow-600",
          icon: "fa-exclamation-triangle",
          iconBg: "bg-yellow-600",
        };
      case "info":
        return {
          bg: "bg-blue-500",
          progressBg: "bg-blue-600",
          icon: "fa-info-circle",
          iconBg: "bg-blue-600",
        };
    }
  };

  const styles = getToastStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`${styles.bg} text-white rounded-lg shadow-2xl overflow-hidden min-w-[320px] max-w-md`}>
          <div className="flex items-start p-4 gap-3">
            {/* Icon */}
            <div className={`${styles.iconBg} rounded-full p-2 flex-shrink-0`}>
              <i className={`fas ${styles.icon} text-lg`}></i>
            </div>

            {/* Message */}
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium leading-relaxed">{message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-2">
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Progress Bar */}
          {duration > 0 && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={`h-1 ${styles.progressBg}`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
