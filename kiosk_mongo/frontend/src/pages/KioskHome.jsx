import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";

export default function KioskHome() {
  const kioskId = "KIOSK12345"; // Example ID (unique per kiosk)
  const frontendURL = process.env.REACT_APP_FRONTEND_URL ;
  const socketURL = process.env.REACT_APP_SOCKET_URL ;

  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Waiting for user to scan QR...");
  const [fileInfo, setFileInfo] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);

  useEffect(() => {
    const socket = io(socketURL, { transports: ["websocket"] });

    // join the kiosk room
    socket.emit("joinKiosk", kioskId);

    // listen for user connection event
    socket.on("userConnectedMessage", (msg) => {
      setStatus("📲 " + msg + " — Please upload your file from your phone!");
      setConnected(true); // hide QR once connected
    });

    // listen for file received
    socket.on("fileReceived", (data) => {
      setFileInfo(data);
      setStatus(`📤 File received: ${data.filename}`);
    });

    // listen for print settings from user
    socket.on("printFile", (settings) => {
      setPrintSettings(settings);
      setStatus(`🖨️ Printing ${fileInfo?.filename || "file"} (${settings.copies} copies, ${settings.color})`);
      // Here you can trigger actual printing logic if needed
    });

    // optional: listen for print status confirmation
    socket.on("printStatus", (msg) => {
      setStatus(`✅ ${msg.status}`);
      // Reset after printing completed
      setFileInfo(null);
      setPrintSettings(null);
      setConnected(true); // still connected to allow next file
    });

    return () => socket.disconnect();
  }, [kioskId, fileInfo]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🖨️ Kiosk Dashboard</h1>
        <p style={styles.subtitle}>{status}</p>

        {/* Show QR only when no user connected */}
        {!connected && (
          <>
            <QRCodeCanvas
              value={`${frontendURL}/user/panel?kiosk=${kioskId}`}
              size={220}
              includeMargin={true}
            />
            <p style={styles.footer}>Kiosk ID: {kioskId}</p>
          </>
        )}

        {/* Show file info if received */}
        {fileInfo && (
          <div style={styles.fileBox}>
            <h3>📄 File Received</h3>
            <p><strong>{fileInfo.filename}</strong></p>
            <p>Size: {(fileInfo.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {/* Show print settings if received */}
        {printSettings && (
          <div style={styles.printBox}>
            <h3>🖨️ Print Settings</h3>
            <p>Color: <strong>{printSettings.color}</strong></p>
            <p>Copies: <strong>{printSettings.copies}</strong></p>
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
    width: "450px",
  },
  title: { fontSize: "2rem", marginBottom: "15px" },
  subtitle: { fontSize: "1.2rem", color: "#444", minHeight: "40px" },
  footer: { marginTop: "20px", fontSize: "1rem", color: "#666" },
  fileBox: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px",
    backgroundColor: "#f0f9f0",
    border: "1px solid #c8e6c9",
  },
  printBox: {
    marginTop: "15px",
    padding: "15px",
    borderRadius: "15px",
    backgroundColor: "#fff3e0",
    border: "1px solid #ffcc80",
  },
};
