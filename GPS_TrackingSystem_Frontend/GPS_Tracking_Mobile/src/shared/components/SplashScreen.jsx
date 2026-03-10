import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#101922] transition-colors duration-500">
            <div className="flex flex-col items-center max-w-sm px-8 text-center animate-in fade-in zoom-in duration-1000">
                {/* College Image/Logo */}
                <div className="relative mb-8 group">
                    <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
                    <img
                        src="https://government-college-of-engineering-jalgaon.business.site/favicon.ico"
                        alt="College Logo"
                        className="relative w-28 h-28 object-contain drop-shadow-2xl"
                        onError={(e) => {
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/2232/2232688.png";
                        }}
                    />
                </div>

                {/* College Name */}
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">
                    Government College of Engineering
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-[0.2em] mb-12">
                    Transport System
                </p>

                {/* Loading Progress */}
                <div className="w-full max-w-[200px]">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-150 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mt-3 tracking-widest uppercase">
                        Loading {progress}%
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 left-0 right-0 text-center animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium tracking-widest uppercase">
                    Powered by GCE Tech
                </p>
            </div>
        </div>
    );
};

export default SplashScreen;
