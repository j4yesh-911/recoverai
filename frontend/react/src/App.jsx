import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Recovery from "./pages/Recovery";
import Evaluation from "./pages/Evaluation";
import Audit from "./pages/Audit";


import { getDatabaseHealth } from "./api/recoverai";

const pageDetails = {
  dashboard: {
    title: "Revenue Recovery Dashboard",
    subtitle:
      "Real-time visibility into revenue at risk, autonomous interventions and recovery performance.",
  },

  recovery: {
    title: "AI Recovery Center",
    subtitle:
      "Inspect failed payments, obtain AI recommendations and execute bounded recovery workflows.",
  },

  evaluation: {
    title: "Recovery Evaluation",
    subtitle:
      "Measure financial impact across a deterministic 10,000-payment synthetic evaluation batch.",
  },

  audit: {
    title: "Audit Trail",
    subtitle:
      "Review every AI decision, policy intervention and recovery execution performed by RecoverAI.",
  },
};

function App() {
  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [
    databaseHealthy,
    setDatabaseHealthy,
  ] = useState(false);

  const checkHealth = useCallback(
    async () => {
      try {
        const response =
          await getDatabaseHealth();

        setDatabaseHealthy(
          response.data.status === "healthy"
        );
      } catch {
        setDatabaseHealthy(false);
      }
    },
    []
  );

  useEffect(() => {
    checkHealth();

    const interval = setInterval(
      checkHealth,
      10000
    );

    return () => clearInterval(interval);
  }, [checkHealth]);

  const renderPage = () => {
    switch (currentPage) {
      case "recovery":
        return <Recovery />;

      case "evaluation":
        return <Evaluation />;

      case "audit":
        return <Audit />;

      case "dashboard":
      default:
        return (
          <Dashboard
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  const details =
    pageDetails[currentPage];

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      <main className="main-area">
        <Header
          title={details.title}
          subtitle={details.subtitle}
          databaseHealthy={databaseHealthy}
        />

        {renderPage()}
      </main>
    </div>
  );
}

export default App;