import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WorkGrid from './components/WorkGrid';
import Process from './components/Process';
import About from './components/About';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';

function App() {
  return (
    <div className="App">
      <CustomCursor />
      <Navbar />
      <Hero />
      <WorkGrid />
      <Process />
      <About />
      <Footer />
    </div>
  );
}

export default App;
