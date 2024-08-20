import React from 'react';

const Page = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial, sans-serif', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '20px' }}>How We Protect Your Data</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Highlights of how we protect your data include:
            </p>
            <ul style={{ listStyleType: 'disc', marginLeft: '40px', marginBottom: '30px' }}>
                <li style={{ marginBottom: '10px' }}>We use industry best practices to ensure that we preserve your data security and privacy.</li>
                <li style={{ marginBottom: '10px' }}>All communication between your browser and our servers uses industry-standard 256-bit encryption.</li>
                <li style={{ marginBottom: '10px' }}>We have strict internal access controls and can’t see your password.</li>
                <li style={{ marginBottom: '10px' }}>Your data is stored in data centers that are protected 24/7 with biometric checkpoints, video surveillance, and other industry-standard techniques.</li>
            </ul>

            <h2 style={{ fontSize: '1.6rem', color: '#2c3e50', marginBottom: '20px' }}>Data Privacy and Security</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                Savewell does not:
            </p>
            <ul style={{ listStyleType: 'disc', marginLeft: '40px', marginBottom: '30px' }}>
                <li style={{ marginBottom: '10px' }}>Share your data.</li>
                <li style={{ marginBottom: '10px' }}>Require your social security number, your name, or any account numbers.</li>
                <li style={{ marginBottom: '10px' }}>Link to any external accounts.</li>
            </ul>

            <h2 style={{ fontSize: '1.6rem', color: '#2c3e50', marginBottom: '20px' }}>Think you’ve found a bug?</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                We’ve built Savewell from the ground up. All technology contains bugs, and the public plays a crucial role in identifying these. If you believe you’ve found a security bug or vulnerability, please email us at:
                <a href="mailto:support@savewellfinance.com" style={{ fontWeight: 'bold', color: '#007BFF', textDecoration: 'none', marginLeft: '5px' }}>support@savewellfinance.com</a>.
            </p>
        </div>
    );
}

export default Page;
