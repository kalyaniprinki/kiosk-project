// PrintFile.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PrintFile() {
  const [params] = useSearchParams();
  const kioskId = params.get('kiosk');
  const userId = params.get('user') || localStorage.getItem('userId');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [color, setColor] = useState('black_white');
  const [copies, setCopies] = useState(1);
  const [pageRange, setPageRange] = useState('all');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!userId) return setMsg('User not found');
    fetch(`${API_BASE}/api/files/${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFiles(d.files);
        else setMsg('Failed to fetch files');
      })
      .catch((err) => setMsg('Error fetching files'));
  }, [userId]);

  const handlePrint = async () => {
    if (!selectedFileId) return setMsg('Select a file first');
    try {
      const body = { kioskId, fileId: selectedFileId, color, copies, pageRange, userId };
      const res = await fetch(`${API_BASE}/api/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Print job sent to kiosk');
      } else {
        setMsg('Print failed: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      setMsg('Print request error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Print File</h2>
        <p>Kiosk: <strong>{kioskId}</strong> — User: <strong>{userId}</strong></p>

        <div style={{ marginTop: 12 }}>
          <label>Select file</label>
          <select value={selectedFileId} onChange={(e) => setSelectedFileId(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 8 }}>
            <option value="">-- choose file --</option>
            {files.map((f) => (
              <option key={f.fileId} value={f.fileId}>
                {f.filename} — {Math.round((f.length || 0) / 1024)} KB
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Color</label>
          <select value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 8 }}>
            <option value="black_white">Black & White</option>
            <option value="color">Color</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Copies</label>
          <input type="number" min="1" max="20" value={copies} onChange={(e) => setCopies(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 8 }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Page range (e.g. 1-3 or "all")</label>
          <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 8 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={handlePrint} style={styles.button}>Print Now</button>
        </div>

        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center' },
  card: { background:'white', padding: 30, borderRadius: 12, width: 560, textAlign:'center', boxShadow:'0 6px 18px rgba(0,0,0,0.12)' },
  button: { padding: '10px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'#17a2b8', color:'white' }
};
