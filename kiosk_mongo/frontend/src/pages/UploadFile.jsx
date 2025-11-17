// UploadFile.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function UploadFile() {
  const [params] = useSearchParams();
  const kioskId = params.get('kiosk');
  const userId = params.get('user') || localStorage.getItem('userId');
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_BASE;

  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    // join kiosk room and notify
    if (kioskId) {
      socket.emit('joinKiosk', kioskId);
      socket.emit('userConnected', { kioskId, userId });
    }

    socket.on('userConnectedMessage', (payload) => {
      console.log('userConnectedMessage', payload);
      setMsg('Connected to kiosk — you can upload a file.');
    });

    // listen for kiosk acknowledgement of fileReceived (optional)
    socket.on('fileReceived', (payload) => {
      console.log('kiosk fileReceived event', payload);
    });

    return () => socket.disconnect();
  }, [kioskId, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMsg('Choose a file first');
    if (!userId) return setMsg('User not found');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', userId);
    fd.append('kioskId', kioskId);

    try {
      setMsg('Uploading...');
      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setUploaded(true);
        setUploadedInfo(data);
        setMsg('Upload successful');
      } else {
        setMsg('Upload failed: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      setMsg('Upload error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Upload File</h2>
        <p>Kiosk: <strong>{kioskId}</strong> — User: <strong>{userId}</strong></p>

        {!uploaded ? (
          <form onSubmit={handleSubmit}>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <div style={{ marginTop: 12 }}>
              <button type="submit" style={styles.button}>Upload</button>
            </div>
          </form>
        ) : (
          <div>
            <p>Uploaded: <strong>{uploadedInfo.filename}</strong></p>
            <p>FileId: {uploadedInfo.fileId}</p>
            <p><a href={uploadedInfo.fileUrl} target="_blank" rel="noreferrer">Download link</a></p>
          </div>
        )}

        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center' },
  card: { background:'white', padding: 30, borderRadius: 12, width: 520, textAlign:'center', boxShadow:'0 6px 18px rgba(0,0,0,0.12)' },
  button: { padding: '10px 16px', borderRadius: 8, border:'none', cursor:'pointer', background:'#28a745', color:'white' }
};
