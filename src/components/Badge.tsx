import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "red" | "yellow";
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "green" }) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200";

  const variantStyles = {
    green:
      "bg-green-500/15 text-green-600 border border-green-500/30 dark:text-green-400 dark:border-green-500/40 hover:bg-green-500/20",
    red:
      "bg-red-500/15 text-red-600 border border-red-500/30 dark:text-red-400 dark:border-red-500/40 hover:bg-red-500/20",
    yellow:
      "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-500/40 hover:bg-yellow-500/20",
  };

  return <span className={clsx(baseStyles, variantStyles[variant])}>{children}</span>;
};

export default Badge;
