import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: string;
    label?: string;
}

const Input: React.FC<InputProps> = ({ icon, label, className = '', ...props }) => {
    return (
        <div className="space-y-2 w-full">
            {label && (
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl">
                        {icon}
                    </span>
                )}
                <input
                    {...props}
                    className={`
                        w-full bg-background/50 dark:bg-surface/30 border border-secondary/10 
                        rounded-xl font-body backdrop-blur-sm transition-all outline-none
                        text-primary placeholder:text-primary/40 
                        focus:ring-2 focus:ring-secondary/30 focus:border-secondary
                        ${icon ? 'pl-12 pr-4' : 'px-4'} 
                        py-4 
                        ${className}
                    `}
                />
            </div>
        </div>
    );
};

export default Input;
