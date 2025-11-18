import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import KioskHome from "./pages/KioskHome";
import UserUpload from "./pages/UserUpload"; // new page for QR scan upload

// 🔁 Wrapper to allow navigation inside components
function AppWrapper() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);

  // handle login success
  const handleLoginSuccess = (data, type) => {
    if (type === "user") {
      setUserType("user");
      navigate("/user/home");
    } else if (type === "kiosk") {
      setUserType("kiosk");
      navigate("/kiosk/home");
    }
  };

  // handle logout
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

      {/* 👤 User Home */}
      <Route
        path="/user/home"
        element={<UserHome onLogout={handleLogout} />}
      />

      {/* 🖨️ Kiosk Home */}
      <Route
        path="/kiosk/home"
        element={<KioskHome onLogout={handleLogout} />}
      />

      {/* 🔗 User Upload (after scanning QR) */}
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
