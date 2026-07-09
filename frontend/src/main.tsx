import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global fetch interceptor to inject Token Authorization header
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        init = init || {};
        init.headers = init.headers || {};
        if (init.headers instanceof Headers) {
            if (!init.headers.has('Authorization')) {
                init.headers.set('Authorization', `Token ${token}`);
            }
        } else if (Array.isArray(init.headers)) {
            const hasAuth = init.headers.some(([key]) => key.toLowerCase() === 'authorization');
            if (!hasAuth) {
                init.headers.push(['Authorization', `Token ${token}`]);
            }
        } else {
            const headersRecord = init.headers as Record<string, string>;
            const hasAuth = Object.keys(headersRecord).some(k => k.toLowerCase() === 'authorization');
            if (!hasAuth) {
                headersRecord['Authorization'] = `Token ${token}`;
            }
        }
    }
    return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
