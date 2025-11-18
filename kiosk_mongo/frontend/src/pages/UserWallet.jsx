import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserWallet() {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://kiosk-project-pm6r.onrender.com";

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const kioskId = params.get("kioskId");

  // Fetch wallet balance and history
  useEffect(() => {
    if (!userId) return;

    async function loadWallet() {
      try {
        const res = await fetch(`${API_BASE}/api/wallet?userId=${userId}`);
        const data = await res.json();
        setLoading(false);

        if (data.success) {
          setBalance(data.balance);
          setTransactions(data.history);
        } else {
          setMsg("⚠️ Failed to load wallet.");
        }
      } catch (err) {
        console.error(err);
        setMsg("❌ Server error.");
      }
    }

    loadWallet();
  }, [userId]);

  // Recharge
  const handleRecharge = async () => {
    if (!amount || amount <= 0) {
      setMsg("⚠️ Enter valid amount.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/wallet/recharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await res.json();

      if (data.success) {
        setBalance(data.newBalance);
        setTransactions(data.history);
        setAmount("");
        setMsg("💰 Wallet recharged successfully!");
      } else {
        setMsg("❌ Recharge failed.");
      }
    } catch (err) {
      setMsg("❌ Server error.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💰 My Wallet</h1>

        {msg && <p style={styles.message}>{msg}</p>}

        {loading ? (
          <p>Loading wallet...</p>
        ) : (
          <>
            {/* Balance Box */}
            <div style={styles.balanceBox}>
              <p style={styles.balanceLabel}>Available Balance</p>
              <h2 style={styles.balance}>₹{balance}</h2>
            </div>

            {/* Recharge Box */}
            <div style={styles.rechargeBox}>
              <h3>➕ Add Money</h3>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.amountInput}
              />
              <button style={styles.rechargeBtn} onClick={handleRecharge}>
                Add Money
              </button>
            </div>

            {/* Transactions */}
            <h3 style={{ marginTop: "25px" }}>📜 Transaction History</h3>

            <div style={styles.transactionList}>
              {transactions.length === 0 && (
                <p style={{ color: "#666" }}>No transactions yet.</p>
              )}

              {transactions.map((t) => (
                <div key={t._id} style={styles.transactionItem}>
                  <p>{t.type === "credit" ? "Added" : "Used"} ₹{t.amount}</p>
                  <span style={styles.date}>
                    {new Date(t.date).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <button
              style={styles.back}
              onClick={() => navigate(`/panel?kioskId=${kioskId}`)}
            >
              ⬅ Back to Panel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #f6d365, #fda085)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "white",
    width: "480px",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  title: { fontSize: "2rem", marginBottom: "20px", color: "#333" },
  message: { color: "green", marginBottom: "15px" },

  balanceBox: {
    background: "#f1f7ff",
    padding: "20px",
    borderRadius: "15px",
    marginBottom: "20px",
    border: "1px solid #cce0ff",
  },
  balanceLabel: { fontSize: "1rem", color: "#555" },
  balance: { fontSize: "2.2rem", margin: 0, color: "#007bff" },

  rechargeBox: {
    background: "#fafafa",
    marginTop: "20px",
    padding: "20px",
    borderRadius: "15px",
    border: "1px solid #ddd",
  },
  amountInput: {
    width: "60%",
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "10px",
    border: "1px solid #ccc",
    marginBottom: "12px",
    textAlign: "center",
  },
  rechargeBtn: {
    background: "#28a745",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
  },

  transactionList: {
    maxHeight: "200px",
    padding: "10px",
    overflowY: "auto",
    background: "#fafafa",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginTop: "10px",
  },

  transactionItem: {
    padding: "10px 15px",
    marginBottom: "10px",
    background: "white",
    borderRadius: "10px",
    border: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
  },
  date: { color: "#777", fontSize: "0.8rem" },

  back: {
    marginTop: "25px",
    background: "#444",
    color: "white",
    border: "none",
    padding: "12px",
    width: "100%",
    borderRadius: "12px",
    cursor: "pointer",
  },
};
