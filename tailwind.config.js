/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1e3a8a',
                    light: '#3b82f6',
                    dark: '#1e3a8a',
                },
                sidebar: {
                    bg: '#1e3a8a',
                    text: '#f8fafc',
                    hover: '#1e40af',
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'fade-in-down': 'fadeInDown 0.3s ease-out',
                'blob': 'blob 7s infinite',
            },
            keyframes: {
                fadeIn: {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                fadeInUp: {
                    'from': { opacity: '0', transform: 'translateY(20px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    'from': { opacity: '0', transform: 'translateY(-10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                }
            }
        },
    },
    plugins: [],
}
