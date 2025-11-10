import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";

export default function KioskHome() {
  const kioskId = "KIOSK12345"; // Example ID
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Waiting for user to scan QR...");

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:4000", {
    transports: ["websocket"],
    });


    // join the kiosk room
    socket.emit("joinKiosk", kioskId);

    // listen for user connection event
    socket.on("userConnectedMessage", (msg) => {
      setStatus("📲 " + msg + " — Please upload your file from your phone!");
      setConnected(true); // hide QR once connected
    });

    return () => socket.disconnect();
  }, []);
const frontendURL = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🖨️ Kiosk Dashboard</h1>
        <p style={styles.subtitle}>{status}</p>

        {/* Show QR only when not connected */}
        {!connected && (
          <>
          
            <QRCodeCanvas
              value={`${frontendURL}/connect?kiosk=${kioskId}`}
              size={220}
              includeMargin={true}
            />
            <p style={styles.footer}>Kiosk ID: {kioskId}</p>
          </>
        )}

        {/* After connection, show nice animation/text */}
        {connected && (
          <div style={styles.connectedBox}>
            <h2 style={{ color: "#4CAF50", marginBottom: "10px" }}>✅ Connected</h2>
            <p>Waiting for your file to upload...</p>
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
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
    width: "420px",
  },
  title: { fontSize: "2rem", marginBottom: "15px" },
  subtitle: { fontSize: "1.2rem", color: "#444", minHeight: "40px" },
  footer: { marginTop: "20px", fontSize: "1rem", color: "#666" },
  connectedBox: {
    marginTop: "30px",
    padding: "20px",
    borderRadius: "15px",
    backgroundColor: "#f0f9f0",
    border: "1px solid #c8e6c9",
  },
};
