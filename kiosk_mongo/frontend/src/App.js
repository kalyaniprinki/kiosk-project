import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import KioskHome from "./pages/KioskHome";
import UserUpload from "./pages/UserUpload";

// ⭐ NEW PAGES
import UserPanel from "./pages/UserPanel";   // Dashboard after QR scan
import UserWallet from "./pages/UserWallet"; // Wallet page
// import UserFiles from "./pages/UserFiles"; // if needed later

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
      {/* Home */}
      <Route
        path="/"
        element={
          <Home
            onChoose={(type) => navigate(`/login/${type}`)}
            onRegister={() => navigate("/register")}
          />
        }
      />

      {/* User Login */}
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

      {/* Kiosk Login */}
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

      {/* Register */}
      <Route path="/register" element={<Register onBack={() => navigate("/")} />} />

      {/* User Home */}
      <Route path="/user/home" element={<UserHome onLogout={handleLogout} />} />

      {/* Kiosk Home */}
      <Route path="/kiosk/home" element={<KioskHome onLogout={handleLogout} />} />

      {/* Upload page (after QR scan) */}
      

      {/* ⭐ NEW ROUTES BELOW */}

      {/* User panel after QR scan */}
      <Route path="/user/panel" element={<UserPanel />} />
      
      <Route path="/connect" element={<UserUpload />} />
      {/* Wallet */}
      <Route path="/user/wallet" element={<UserWallet />} />

      {/* Files (if needed later) */}
      {/* <Route path="/user/files" element={<UserFiles />} /> */}
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
