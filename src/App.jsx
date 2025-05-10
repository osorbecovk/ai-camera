import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './Components/Home/Home.jsx'

function App() {
  const routes = [
    {
      id: 2,
      path: "/",
      element: <Home />
    }
  ];

  return (
    <>
      <Routes>
        {routes.map((el) => (
          <Route key={el.id} path={el.path} element={el.element} />
        ))}
      </Routes>
    </>
  );
}

export default App;
