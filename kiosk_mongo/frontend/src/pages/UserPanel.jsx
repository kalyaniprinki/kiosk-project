// UserPanel.jsx
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function UserPanel() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const kioskId = params.get('kiosk');
  // user can be passed in QR or read from local storage (login)
  const userFromParam = params.get('user');
  const userId = userFromParam || localStorage.getItem('userId');

  const goUpload = () => {
    if (!userId) return alert('User not found — login first.');
    navigate(`/upload?kiosk=${encodeURIComponent(kioskId)}&user=${encodeURIComponent(userId)}`);
  };

  const goPrint = () => {
    if (!userId) return alert('User not found — login first.');
    navigate(`/print?kiosk=${encodeURIComponent(kioskId)}&user=${encodeURIComponent(userId)}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>📲 Connected to Kiosk</h1>
        <p>Kiosk ID: <strong>{kioskId || '—'}</strong></p>
        <p>User ID: <strong>{userId || '—'}</strong></p>

        <div style={{ marginTop: 20 }}>
          <button onClick={goUpload} style={styles.button}>Upload File</button>
          <button onClick={goPrint} style={{ ...styles.button, marginLeft: 12 }}>Print File</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center' },
  card: { background:'white', padding: 30, borderRadius: 12, width: 420, textAlign:'center', boxShadow:'0 6px 18px rgba(0,0,0,0.12)' },
  button: { padding: '10px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'#007bff', color:'white' }
};
