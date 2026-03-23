import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlowType } from "./hooks/useFlowType";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Bitcoin from "./pages/Bitcoin";
import Gravity from "./pages/Gravity";
import Colorshifter from "./pages/Colorshifter";
import Email from "./pages/email/Email";
import EmailConfirm from "./pages/email/EmailConfirm";
import EmailUnsubscribe from "./pages/email/EmailUnsubscribe";
import EmailUnsubscribeConfirm from "./pages/email/EmailUnsubscribeConfirm";
import NotFound from "./pages/NotFound";

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  // Apply responsive typography (FlowType.js replacement)
  useFlowType({
    minimum: 320,
    maximum: 960,
    minFont: 20,
    maxFont: 32,
    fontRatio: 32,
    lineRatio: 1.45,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bitcoin" element={<Bitcoin />} />
            <Route path="/thing/gravity" element={<Gravity />} />
            <Route path="/thing/colorshifter" element={<Colorshifter />} />
            <Route path="/email" element={<Email />} />
            <Route path="/email/confirm" element={<EmailConfirm />} />
            <Route path="/email/unsubscribe" element={<EmailUnsubscribe />} />
            <Route path="/email/unsubscribe/confirm" element={<EmailUnsubscribeConfirm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
