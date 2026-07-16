import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Landing from "./pages/Landing";
import Setup from "./pages/Setup";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Results from "./pages/Results";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
