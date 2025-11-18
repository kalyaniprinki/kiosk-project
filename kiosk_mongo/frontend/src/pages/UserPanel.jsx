import React from "react";
import { useNavigate } from "react-router-dom";

export default function UserPanel() {
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const kioskId = params.get("kioskId");
  const userId = localStorage.getItem("USER_ID");

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
            onClick={() => navigate(`/connect?kioskId=${kioskId}`)}
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
