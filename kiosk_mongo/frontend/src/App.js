import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import KioskHome from "./pages/KioskHome";
import UserUpload from "./pages/UserUpload";

function AppWrapper() {
  const navigate = useNavigate();
  const [userType, setUserType] = React.useState(null);

  const handleLoginSuccess = (data, type) => {
    if (type === "user") {
      setUserType("user");
      navigate("/user/home");
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

      <Route path="/user/home" element={<UserHome onLogout={handleLogout} />} />

      <Route path="/kiosk/home" element={<KioskHome onLogout={handleLogout} />} />

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
