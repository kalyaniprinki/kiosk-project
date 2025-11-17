import React, { useState } from 'react';

export default function Login({ type, onBack, onSuccess }) {
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMsg(null);

  if (type === 'user') {
    if (!form.username || !form.password) {
      setMsg('Please enter username and password');
      return;
    }
  } else {
    if (!form.kiosk_name || !form.password) {
      setMsg('Please enter kiosk name and password');
      return;
    }
  }

  const body =
    type === 'user'
      ? { username: form.username, password: form.password }
      : { kiosk_name: form.kiosk_name, password: form.password };

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      onSuccess(data, type);
    } else {
      setMsg(data.error || 'Invalid credentials');
    }
  } catch (err) {
    console.error('Login error:', err);
    setMsg('Network or server error');
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {type === 'user' ? '👤 User Login' : '🖥️ Kiosk Login'}
        </h2>

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

          <button type="submit" style={styles.loginBtn}>
            Login
          </button>
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
    backgroundColor: '#f5f5f5',
    padding: '10px',
    borderRadius: '8px',
  },
};
