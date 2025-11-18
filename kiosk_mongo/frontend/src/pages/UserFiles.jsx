import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserFiles() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://kiosk-project-pm6r.onrender.com";

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const kioskId = params.get("kioskId");

  useEffect(() => {
    if (!userId) return;

    async function fetchFiles() {
      try {
        const res = await fetch(`${API_BASE}/api/user/files?userId=${userId}`);
        const data = await res.json();
        setLoading(false);

        if (data.success) {
          setFiles(data.files);
        } else {
          setMsg("⚠️ Failed to fetch uploaded files.");
        }
      } catch (error) {
        console.error("Error fetching files:", error);
        setMsg("❌ Server error while loading files.");
      }
    }

    fetchFiles();
  }, [userId]);

  const handleReprint = async (fileUrl) => {
    try {
      const res = await fetch(`${API_BASE}/api/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kioskId,
          fileUrl,
          color: "black_white",
          copies: 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg("🖨️ Reprint command sent!");
      } else {
        setMsg("⚠️ Reprint failed.");
      }
    } catch (err) {
      setMsg("❌ Error sending print command.");
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📁 My Uploaded Files</h1>

        {loading && <p>Loading files...</p>}
        {msg && <p style={styles.message}>{msg}</p>}

        {!loading && files.length === 0 && (
          <p style={{ color: "#444" }}>No files uploaded yet.</p>
        )}

        <div style={styles.fileList}>
          {files.map((file) => (
            <div key={file._id} style={styles.fileItem}>
              <div>
                <p style={styles.fileName}>{file.originalName}</p>
                <p style={styles.fileDate}>
                  Uploaded: {new Date(file.createdAt).toLocaleString()}
                </p>
              </div>

              <div style={styles.actions}>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.openBtn}
                >
                  Open
                </a>

                <button
                  style={styles.printBtn}
                  onClick={() => handleReprint(file.fileUrl)}
                >
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          style={styles.back}
          onClick={() => navigate(`/panel?kioskId=${kioskId}`)}
        >
          ⬅ Back to Panel
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #1c92d2, #f2fcfe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "white",
    padding: "30px 40px",
    width: "550px",
    borderRadius: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  },
  title: { fontSize: "1.8rem", marginBottom: "20px", color: "#333" },
  message: { marginBottom: "15px", color: "green" },

  fileList: {
    maxHeight: "350px",
    overflowY: "auto",
    paddingRight: "10px",
  },

  fileItem: {
    background: "#f8f8f8",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #ddd",
  },

  fileName: { fontSize: "1.1rem", fontWeight: "500" },
  fileDate: { fontSize: "0.9rem", color: "#555" },

  actions: {
    display: "flex",
    gap: "10px",
  },
  openBtn: {
    background: "#007bff",
    padding: "8px 12px",
    borderRadius: "8px",
    color: "white",
    textDecoration: "none",
  },
  printBtn: {
    background: "#28a745",
    padding: "8px 12px",
    borderRadius: "8px",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  back: {
    marginTop: "20px",
    background: "#444",
    color: "white",
    padding: "12px",
    width: "100%",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};
