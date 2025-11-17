import React, { useState } from 'react';

export default function Login({ type, onBack, onSuccess }) {
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body =
      type === 'user'
        ? { type: 'user', username: form.username, password: form.password }
        : { type: 'kiosk', kiosk_name: form.kiosk_name, password: form.password };

        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // inside handleSubmit after you get `data`
if (data.success) {
  onSuccess(data,type);  // ✅ call success handler
} else {
  setMsg("Invalid credentials");
}

    //setMsg(JSON.stringify(data, null, 2));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{type === 'user' ? '👤 User Login' : '🖥️ Kiosk Login'}</h2>

        <form style={styles.form} onSubmit={handleSubmit}>
          {type === 'user' ? (
            <input
              style={styles.input}
              placeholder="Username"
              value={form.username || ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          ) : (
            <input
              style={styles.input}
              placeholder="Kiosk Name"
              value={form.kiosk_name || ''}
              onChange={(e) => setForm({ ...form, kiosk_name: e.target.value })}
            />
          )}

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password || ''}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button style={styles.loginBtn}>Login</button>
        </form>

        <button style={styles.backBtn} onClick={onBack}>
          ⬅ Back
        </button>

        {msg && <pre style={styles.msg}>{msg}</pre>}
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
    padding: '40px 50px',
    borderRadius: '20px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    width: '350px',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
    marginBottom: '25px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px 15px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  loginBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 15px',
    fontSize: '1.1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  },
  backBtn: {
    marginTop: '20px',
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    fontSize: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  msg: {
    marginTop: '20px',
    textAlign: 'left',
    backgroundColor: '#f5f5f5',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: '#333',
  },
};
