import React from 'react';

export default function Home({ onChoose, onRegister }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🖨️ Kiosk Printing</h1>
        <p style={styles.subtitle}>Welcome! Please choose an option below.</p>

        <div style={styles.buttonContainer}>
          <button style={{ ...styles.button, backgroundColor: '#4CAF50' }} onClick={() => onChoose('kiosk')}>
            Kiosk Login
          </button>
          <button style={{ ...styles.button, backgroundColor: '#2196F3' }} onClick={() => onChoose('user')}>
            User Login
          </button>
          <button style={{ ...styles.button, backgroundColor: '#FF9800' }} onClick={onRegister}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #74ABE2, #5563DE)',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px 60px',
    borderRadius: '20px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    textAlign: 'center',
    minWidth: '300px',
  },
  title: {
    fontSize: '2.2rem',
    marginBottom: '10px',
    color: '#333',
  },
  subtitle: {
    color: '#555',
    marginBottom: '30px',
    fontSize: '1.1rem',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  button: {
    border: 'none',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '10px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  },
};
