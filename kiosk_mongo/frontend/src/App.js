import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import KioskHome from "./pages/KioskHome";

import UserPanel from "./pages/UserPanel";
import UploadFile from "./pages/UploadFile";
import PrintFile from "./pages/PrintFile";

function AppWrapper() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);

  const handleLoginSuccess = (data, type) => {
    if (type === "user") {
      setUserType("user");
      navigate("/user/panel");  // redirect to main user panel
    } else if (type === "kiosk") {
      setUserType("kiosk");
      navigate("/kiosk/home");
    }
  };

  const handleLogout = () => {
    setUserType(null);
    navigate("/");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            onChoose={(type) => navigate(`/login/${type}`)}
            onRegister={() => navigate("/register")}
          />
        }
      />

      {/* User login */}
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

      {/* Kiosk login */}
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

      <Route path="/register" element={<Register onBack={() => navigate("/")} />} />

      {/* New clean user panel */}
      <Route path="/user/panel" element={<UserPanel onLogout={handleLogout} />} />

      {/* Upload file page */}
      <Route path="/user/upload" element={<UploadFile />} />

      {/* Print file page */}
      <Route path="/user/print" element={<PrintFile />} />

      {/* Kiosk dashboard */}
      <Route path="/kiosk/home" element={<KioskHome onLogout={handleLogout} />} />

      {/* Old QR connect route (optional) */}
      <Route path="/connect" element={<UploadFile />} />
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
