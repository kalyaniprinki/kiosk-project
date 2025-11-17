import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import KioskHome from "./pages/KioskHome";

// NEW PAGES
import UserPanel from "./pages/UserPanel";
import UploadFile from "./pages/UploadFile";
import PrintFile from "./pages/PrintFile";

// Old QR-based upload route (still needed)
import UserUpload from "./pages/UserUpload";

function AppWrapper() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);

  // login success
  const handleLoginSuccess = (data, type) => {
    if (type === "user") {
      setUserType("user");
      navigate("/user/panel");   // 🟢 redirect to new panel
    } else if (type === "kiosk") {
      setUserType("kiosk");
      navigate("/kiosk/home");
    }
  };

  // logout
  const handleLogout = () => {
    setUserType(null);
    navigate("/");
  };

  return (
    <Routes>
      {/* 🏠 Home */}
      <Route
        path="/"
        element={
          <Home
            onChoose={(type) => navigate(`/login/${type}`)}
            onRegister={() => navigate("/register")}
          />
        }
      />

      {/* 👤 User Login */}
      <Route
        path="/login/user"
        element={
          <Login
            type="user"
            onBack={() => navigate("/")}
            onSuccess={(data) => handleLoginSuccess(data, "user")}
          />
        }
      />

      {/* 🖨️ Kiosk Login */}
      <Route
        path="/login/kiosk"
        element={
          <Login
            type="kiosk"
            onBack={() => navigate("/")}
            onSuccess={(data) => handleLoginSuccess(data, "kiosk")}
          />
        }
      />

      {/* 🆕 Register */}
      <Route path="/register" element={<Register onBack={() => navigate("/")} />} />

      {/* 👤 USER PANEL (Upload + Print Options) */}
      <Route
        path="/user/panel"
        element={<UserPanel onLogout={handleLogout} />}
      />

      {/* 📤 Upload File page */}
      <Route
        path="/user/upload"
        element={<UploadFile />}
      />

      {/* 🖨️ Print File page */}
      <Route
        path="/user/print"
        element={<PrintFile />}
      />

      {/* 👤 OLD: User Home (keep it if needed) */}
      <Route
        path="/user/home"
        element={<UserHome onLogout={handleLogout} />}
      />

      {/* 🖨️ Kiosk Home */}
      <Route
        path="/kiosk/home"
        element={<KioskHome onLogout={handleLogout} />}
      />

      {/* 🔗 QR-Based Connection (auto-open upload/print panel) */}
      <Route path="/connect" element={<UserUpload />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
