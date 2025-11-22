import clsx from 'clsx'
import { forwardRef } from 'react'
import PropTypes from 'prop-types'

export const Button = forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
        primary: 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
        outline: 'border-2 border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white',
        ghost: 'hover:bg-slate-800 text-slate-400 hover:text-white',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-8 py-4 text-lg',
    }

    return (
        <button
            ref={ref}
            className={clsx(
                'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    )
})

Button.displayName = 'Button'
Button.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    children: PropTypes.node,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
}

export const Input = forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={clsx(
                'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all',
                className
            )}
            {...props}
        />
    )
})

Input.displayName = 'Input'
Input.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
}

export const Card = ({ className, children, ...props }) => {
    return (
        <div
            className={clsx(
                'bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

Card.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
}
