
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import Restaurants from './pages/Restaurants/Restaurants';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dish from './pages/Dish/Dish';
import Restaurant from './pages/Restaurant/Restaurant';
import RestaurantAdmin from './pages/RestaurantAdmin/RestaurantAdmin';
import MenuCategories from './pages/MenuCategories/MenuCategories';
import Profile from './pages/Profile/Profile';
import SystemAdmin from './pages/SystemAdmin/SystemAdmin';
import authService from './services/authService';
import { AUTH_CHANGE_EVENT, readSession } from './services/authSession';

function ProtectedPage({ session, roles, children }) {
  const location = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(session.user.role)) {
    return <main className="page-stub page-stub--functional"><h1>Доступ заборонено</h1></main>;
  }
  return children;
}

function App() {
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    const updateSession = () => setSession(readSession());
    window.addEventListener(AUTH_CHANGE_EVENT, updateSession);
    if (readSession()) authService.getCurrentUser().catch(() => {});
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, updateSession);
  }, []);

  return (
    <>
      <Header session={session} onLogout={authService.logout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants/:restaurantId/dishes/:dishId" element={<Dish />}/>
        <Route path="/restaurants/:restaurantId" element={<Restaurant />} />
        <Route path="/restaurant-admin" element={
          <ProtectedPage session={session} roles={['RestaurantAdmin']}><RestaurantAdmin /></ProtectedPage>
        } />
        <Route path="/restaurant-admin/categories" element={
          <ProtectedPage session={session} roles={['RestaurantAdmin']}><MenuCategories /></ProtectedPage>
        } />
        <Route path="/profile" element={
          <ProtectedPage session={session}><Profile session={session} /></ProtectedPage>
        } />
        <Route path="/admin" element={
          <ProtectedPage session={session} roles={['SystemAdmin']}><SystemAdmin currentUserId={session?.user.id} /></ProtectedPage>
        } />
      </Routes>
    </>
  );
}

export default App;
