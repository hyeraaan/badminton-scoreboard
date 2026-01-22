import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>404</h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '40px' }}>
                Page Not Found
            </p>
            <Link
                href="/"
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#2563eb',
                    color: '#white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1.2rem'
                }}
            >
                Go Home
            </Link>
        </div>
    );
}
