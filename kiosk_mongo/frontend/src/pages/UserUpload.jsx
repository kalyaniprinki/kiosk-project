import React, { useState } from "react";

export default function UserUpload({ currentUserId, kioskId }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  // print settings
  const [color, setColor] = useState("black_white");
  const [copies, setCopies] = useState(1);

  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://kiosk-project-pm6r.onrender.com";

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) return setMsg("⚠️ Please select a file.");
    if (!currentUserId) return setMsg("⚠️ User not logged in.");
    if (!kioskId) return setMsg("⚠️ No kiosk connected! Scan QR again.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", currentUserId);
    formData.append("kioskId", kioskId);
    formData.append("color", color);
    formData.append("copies", copies);

    try {
      setUploading(true);
      setMsg("⏳ Uploading...");

      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (data.success) {
        setMsg("✅ File uploaded successfully! Ready at kiosk.");
      } else {
        setMsg(`❌ Upload failed: ${data.error}`);
      }
    } catch (err) {
      setUploading(false);
      console.error(err);
      setMsg("❌ Error uploading file.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📤 Upload Your File</h1>

        <p style={{ color: "#444" }}>
          Connected to kiosk: <b>{kioskId || "Not Connected"}</b>
        </p>

        <form onSubmit={handleUpload} style={styles.form}>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.fileInput}
          />

          {/* print settings */}
          <div style={styles.optionsBox}>
            <div style={styles.optionsRow}>
              <label>Color:</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={styles.select}
              >
                <option value="black_white">Black & White</option>
                <option value="color">Color</option>
              </select>
            </div>

            <div style={styles.optionsRow}>
              <label>Copies:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
                style={styles.numberInput}
              />
            </div>
          </div>

          <button type="submit" style={styles.button} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload & Send to Kiosk"}
          </button>
        </form>

        {msg && <p style={styles.message}>{msg}</p>}
      </div>
    </div>
  );
}

// same styles
const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #2193b0, #6dd5ed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Segoe UI, Roboto, sans-serif",
  },
  card: {
    background: "white",
    padding: "40px 60px",
    borderRadius: "20px",
    textAlign: "center",
    width: "460px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  title: { fontSize: "1.8rem", marginBottom: "20px", color: "#333" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  fileInput: { fontSize: "1rem" },

  button: {
    backgroundColor: "#0078ff",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
  },

  optionsBox: {
    marginTop: "15px",
    padding: "15px",
    borderRadius: "15px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
  },
  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  select: {
    padding: "6px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  numberInput: {
    width: "80px",
    padding: "6px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    textAlign: "center",
  },

  message: {
    marginTop: "15px",
    fontWeight: "500",
  },
};
