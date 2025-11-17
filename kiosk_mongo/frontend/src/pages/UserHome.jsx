import React, { useState } from "react";
import QrScanner from "react-qr-scanner";
import { useNavigate } from "react-router-dom";

export default function UserHome({ onLogout }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const navigate = useNavigate();

  const handleScan = (result) => {
  if (!result) return;

  const scannedText = result.text;
  setScanResult(scannedText);
  setScanning(false);

  // Case 1: QR contains a full URL like:
  // https://yourapp.com/upload?kioskId=KIOSK12345
  if (scannedText.startsWith("http")) {
    const url = new URL(scannedText);
    const kioskIdParam = url.searchParams.get("kioskId");

    if (kioskIdParam) {
      localStorage.setItem("kioskId", kioskIdParam);
      navigate(`/upload?kioskId=${encodeURIComponent(kioskIdParam)}`);
    } else {
      alert("Invalid QR: No kioskId found");
    }
  }

  // Case 2: QR contains ONLY kioskId
  else {
    localStorage.setItem("kioskId", scannedText);
    navigate(`/upload?kioskId=${encodeURIComponent(scannedText)}`);
  }
};
// -------------------------

  const handleError = (err) => {
    console.error("QR Scan Error:", err);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📱 User Dashboard</h1>

        {!scanning ? (
          <>
            <p style={styles.subtitle}>
              Welcome! To start printing, please scan the QR code shown on your kiosk machine.
            </p>

            <div style={styles.actions}>
              <button style={styles.scanBtn} onClick={() => setScanning(true)}>
                🔍 Scan Kiosk QR
              </button>

              <button style={styles.logoutBtn} onClick={onLogout}>
                🚪 Logout
              </button>
            </div>

            <p style={styles.note}>
              Make sure your camera permission is enabled when scanning.
            </p>

            {scanResult && (
              <p style={{ marginTop: 20, color: "green" }}>
                ✅ Scanned Result: {scanResult}
              </p>
            )}
          </>
        ) : (
          <div>
            <h3 style={{ marginBottom: "10px" }}>📸 Scanning...</h3>
            <QrScanner
              delay={300}
              style={{ width: "100%", borderRadius: "10px" }}
              onError={handleError}
              onScan={handleScan}
            />
            <button
              style={{
                ...styles.logoutBtn,
                marginTop: "20px",
                backgroundColor: "#555",
              }}
              onClick={() => setScanning(false)}
            >
              ✖ Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #74ABE2, #5563DE)",
    fontFamily: "Segoe UI, Roboto, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "40px 50px",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
    width: "420px",
  },
  title: {
    fontSize: "2rem",
    color: "#333",
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#555",
    marginBottom: "30px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  scanBtn: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "15px 20px",
    fontSize: "1.2rem",
    borderRadius: "10px",
    cursor: "pointer",
  },
  logoutBtn: {
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    padding: "12px 20px",
    fontSize: "1.1rem",
    borderRadius: "10px",
    cursor: "pointer",
  },
  note: {
    marginTop: "25px",
    fontSize: "0.9rem",
    color: "#777",
  },
};
