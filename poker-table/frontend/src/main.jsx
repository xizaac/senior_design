import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home";
import DealerView from "./pages/DealerView";
import SpectatorView from "./pages/SpectatorView";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dealer/:sessionCode" element={<DealerView />} />
        <Route path="/spectate/:sessionCode" element={<SpectatorView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
