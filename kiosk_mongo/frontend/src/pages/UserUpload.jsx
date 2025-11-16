import React, { useState } from "react";

export default function UserUpload({ currentUserId }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [color, setColor] = useState("black_white");
  const [copies, setCopies] = useState(1);

  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://kiosk-project-pm6r.onrender.com";

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !currentUserId) {
      setMsg("⚠️ Please select a file and ensure user is logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", currentUserId); // mandatory for backend

    try {
      setUploading(true);
      setMsg("⏳ Uploading file...");

      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (data.success) {
        setUploadSuccess(true);
        setMsg("✅ File uploaded successfully!");
        console.log("Upload response:", data);
      } else {
        setMsg(`⚠️ Failed to upload file: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setUploading(false);
      console.error("Upload error:", err);
      setMsg("❌ Error connecting to server.");
    }
  };

  // Optional: handle print (can call /api/print if needed)
  const handlePrint = async () => {
    setMsg("🖨️ Print function not implemented yet");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📤 Upload File</h1>

        {/* Upload form */}
        {!uploadSuccess && (
          <form onSubmit={handleUpload} style={styles.form}>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.fileInput}
            />
            <button type="submit" style={styles.button} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </form>
        )}

        {/* Options after upload */}
        {uploadSuccess && (
          <div style={styles.optionsBox}>
            <h3>🖨️ Print Settings (Optional)</h3>

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

            <button style={styles.printButton} onClick={handlePrint}>
              Print Now
            </button>
          </div>
        )}

        {msg && <p style={styles.message}>{msg}</p>}
      </div>
    </div>
  );
}

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
    marginTop: "25px",
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
  printButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  message: {
    marginTop: "15px",
    fontWeight: "500",
  },
};
