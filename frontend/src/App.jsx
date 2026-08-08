import { Route, Routes } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import PageMeta from './components/PageMeta.jsx';
import Chatbot from './components/Chatbot.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ProfessionalOnboarding from './pages/ProfessionalOnboarding.jsx';
import CompanyPortal from './pages/CompanyPortal.jsx';
import OpportunityBrowser from './pages/OpportunityBrowser.jsx';
import Dashboard from './pages/Dashboard.jsx';
import VolunteerSignup from './pages/VolunteerSignup.jsx';
import SupportUs from './pages/SupportUs.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <PageMeta />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<ProfessionalOnboarding />} />
          <Route path="/post" element={<CompanyPortal />} />
          <Route path="/browse" element={<OpportunityBrowser />} />
          <Route path="/volunteer" element={<VolunteerSignup />} />
          <Route path="/support" element={<SupportUs />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={
            <div className="mx-auto max-w-6xl px-5 py-20">
              <h1 className="font-display text-3xl font-bold">That page does not exist</h1>
              <p className="mt-2 text-ink-soft">Use the menu above to get back to the projects board.</p>
            </div>
          } />
        </Routes>
      </main>

      <footer className="mt-20 border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5">
          <p className="label">SkillMatch, a student project</p>
          <p className="text-sm text-ink-soft">Matching is explainable by design: every score shows its working.</p>
        </div>
      </footer>

      <Chatbot />
    </div>
  );
}