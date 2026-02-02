import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { BackgroundCheckDashboard } from "./components/BackgroundCheckDashboard";
import { CaseDetailScreen } from "./components/CaseDetailScreen";
import { ExceptionQueue } from "./components/ExceptionQueue";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BackgroundCheckDashboard />} />
        <Route path="/cases/:caseId" element={<CaseDetailScreen />} />
        <Route path="/exceptions" element={<ExceptionQueue />} />
      </Routes>
    </Router>
  );
}

export default App;
