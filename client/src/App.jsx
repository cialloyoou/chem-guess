import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChemistrySinglePlayer from './pages/ChemistrySinglePlayer';
import ChemistryLibrary from './pages/ChemistryLibrary';
import TestRecords from './pages/TestRecords';
import ProfileBar from './components/ProfileBar';

function App() {
  return (
    <Router>
      <ProfileBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chemistry" element={<ChemistrySinglePlayer />} />
        <Route path="/library" element={<ChemistryLibrary />} />
        <Route path="/records" element={<TestRecords />} />
      </Routes>
    </Router>
  );
}

export default App;
