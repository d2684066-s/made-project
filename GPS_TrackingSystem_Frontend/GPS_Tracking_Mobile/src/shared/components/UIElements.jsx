export const Badge = ({ children, color = 'blue', className = '' }) => {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        green: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
        red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
        yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
        gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles[color]} ${className}`}>
            {children}
        </span>
    );
};

export const Loader = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4'
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className={`animate-spin rounded-full border-t-blue-500 border-gray-200 dark:border-gray-700 ${sizes[size]}`}></div>
        </div>
    );
};
