import React from "react";
import { useNavigate } from "react-router-dom";

export default function UserPanel() {
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const kioskId = params.get("kioskId");
  const userId = localStorage.getItem("USER_ID"); // assume login stored this

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>👤 User Panel</h1>

        {kioskId ? (
          <p style={styles.subtitle}>
            Connected to Kiosk: <strong>{kioskId}</strong>
          </p>
        ) : (
          <p style={{ color: "red" }}>No kiosk connected.</p>
        )}

        <div style={styles.buttonList}>
          {/* Upload File */}
          <button
            style={styles.button}
            onClick={() => navigate(`/upload?kiosk=${kioskId}`)}
          >
            📤 Upload New File
          </button>

          {/* Previous Files */}
          <button
            style={styles.button}
            onClick={() =>
              navigate(`/myfiles?userId=${userId}&kioskId=${kioskId}`)
            }
          >
            📁 View Previously Uploaded Files
          </button>

          {/* Wallet */}
          <button
            style={styles.button}
            onClick={() =>
              navigate(`/wallet?userId=${userId}&kioskId=${kioskId}`)
            }
          >
            💰 Wallet
          </button>

          {/* Logout */}
          <button
            style={{ ...styles.button, backgroundColor: "#d9534f" }}
            onClick={() => navigate("/")}
          >
            🚪 Logout
          </button>
        </div>
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
    background: "linear-gradient(135deg, #3a7bd5, #00d2ff)",
    fontFamily: "Segoe UI, Roboto, sans-serif",
  },
  card: {
    background: "white",
    width: "420px",
    padding: "40px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  },
  title: { fontSize: "1.9rem", marginBottom: "10px", color: "#333" },
  subtitle: { color: "#444", marginBottom: "25px" },
  buttonList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "10px",
  },
  button: {
    backgroundColor: "#007bff",
    border: "none",
    padding: "14px",
    color: "white",
    borderRadius: "10px",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
};
