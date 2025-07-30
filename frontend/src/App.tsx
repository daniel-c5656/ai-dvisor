import Login from './Login';
import './App.css';
import Navbar from './Navbar';
import Signup from './Signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import Dashboard from './Dashboard';
import Planpage from './Planpage';
import Profile from './Profile';
import ProtectedRoute from './ProtectedRoute';

function App() {

  return (
    <>

      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Homepage/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/signup' element={<Signup/>} />
          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<Dashboard/>} />
            <Route path='/plans/:planId' element={<Planpage />} />
            <Route path='/profile' element={<Profile />}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
