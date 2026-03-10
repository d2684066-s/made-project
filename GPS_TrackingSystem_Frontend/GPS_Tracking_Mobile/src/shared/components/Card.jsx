export const Card = ({ children, className = '', title, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{title}</h3>}
            {children}
        </div>
    );
};
