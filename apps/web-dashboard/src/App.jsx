import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DishReviewsPage from './pages/Dish/DishReviewsPage';
import Header, { SmartMenuMark } from './components/Header/Header';
import Home from './pages/Home/Home';
import Dishes from './pages/Dishes/Dishes';
import Restaurants from './pages/Restaurants/Restaurants';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dish from './pages/Dish/Dish';
import Restaurant from './pages/Restaurant/Restaurant';
import RestaurantAdmin from './pages/RestaurantAdmin/RestaurantAdmin';
import RestaurantDishes from './pages/RestaurantAdmin/RestaurantDishes';
import MenuCategories from './pages/MenuCategories/MenuCategories';
import Profile from './pages/Profile/Profile';
import SystemAdmin from './pages/SystemAdmin/SystemAdmin';
import authService from './services/authService';
import { AUTH_CHANGE_EVENT, readSession } from './services/authSession';
import DishAvailability from './pages/RestaurantAdmin/DishAvailability';

function ProtectedPage({ session, roles, children }) {
  const location = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(session.user.role)) {
    return <main className="page-stub page-stub--functional"><h1>Доступ заборонено</h1></main>;
  }
  return children;
}

function Footer({ session, onOpenAuth }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <Link to="/" className="site-footer__brand">
            <SmartMenuMark inverted />
            <span className="site-footer__wordmark">
              Smart<span>Menu</span>
            </span>
          </Link>
          <p className="site-footer__tagline">
            Страви та ресторани, дібрані з розумом і до смаку.
          </p>
        </div>

        <div className="site-footer__col">
          <h3>Досліджувати</h3>
          <ul>
            <li><Link to="/dishes">Страви</Link></li>
            <li><Link to="/restaurants">Ресторани</Link></li>
            <li><Link to="/restaurants?nearby=true">Поруч</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3>SmartMenu</h3>
          <ul>
            <li>
              {session ? (
                <Link to="/profile">Особистий кабінет</Link>
              ) : (
                <button
                  type="button"
                  className="site-footer__link-btn"
                  onClick={() => onOpenAuth('login')}
                >
                  Особистий кабінет
                </button>
              )}
            </li>
            <li><Link to="/restaurants?nearby=true">Про сервіс</Link></li>
            <li><Link to="/restaurants?nearby=true">Допомога</Link></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        © {new Date().getFullYear()} SmartMenu.
      </div>
    </footer>
  );
}

function App() {
  const [session, setSession] = useState(readSession);
  const [authModal, setAuthModal] = useState(null);
  const [authPrefillEmail, setAuthPrefillEmail] = useState('');

  useEffect(() => {
    const updateSession = () => setSession(readSession());
    window.addEventListener(AUTH_CHANGE_EVENT, updateSession);
    if (readSession()) authService.getCurrentUser().catch(() => {});
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, updateSession);
  }, []);

  useEffect(() => {
    if (!authModal) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') setAuthModal(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [authModal]);

  return (
    <div className="app-shell">
      <Header
        session={session}
        onLogout={authService.logout}
        onOpenAuth={(mode) => setAuthModal(mode)}
      />

      <Routes>
        <Route path="/restaurants/:restaurantId/dishes/:dishId/reviews" element={<DishReviewsPage session={session} onOpenAuth={setAuthModal} />} />
        <Route path="/" element={<Home session={session} onOpenAuth={setAuthModal} />} />
        <Route path="/dishes" element={<Dishes />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants/:restaurantId/dishes/:dishId" element={<Dish session={session} onOpenAuth={setAuthModal} />} />
        <Route path="/restaurants/:restaurantId" element={<Restaurant session={session} onOpenAuth={setAuthModal} />} />
        <Route path="/restaurant-admin" element={
          <ProtectedPage session={session} roles={['RestaurantAdmin']}><RestaurantAdmin /></ProtectedPage>
        } />
        <Route path="/restaurant-admin/categories" element={
          <ProtectedPage session={session} roles={['RestaurantAdmin']}><MenuCategories session={session} /></ProtectedPage>
        } />
        <Route path="/restaurant-admin/dishes" element={
          <ProtectedPage session={session} roles={['RestaurantAdmin']}><RestaurantDishes session={session} /></ProtectedPage>
        } />
        <Route path="/profile" element={
          <ProtectedPage session={session}><Profile session={session} onLogout={authService.logout} /></ProtectedPage>
        } />
        <Route path="/admin" element={
          <ProtectedPage session={session} roles={['SystemAdmin']}><SystemAdmin currentUserId={session?.user.id} /></ProtectedPage>
        } />
        <Route path="/restaurant-admin/availability" element={
          <ProtectedPage session={session} roles={['RestaurantAdmin']}><DishAvailability session={session} /></ProtectedPage>
        } />
      </Routes>

      <Footer session={session} onOpenAuth={setAuthModal} />

      {authModal === 'login' && (
        <Login
          isModal
          initialEmail={authPrefillEmail}
          onClose={() => setAuthModal(null)}
          onSwitchToRegister={() => setAuthModal('register')}
        />
      )}

      {authModal === 'register' && (
        <Register
          isModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={(email = '') => {
            if (email) setAuthPrefillEmail(email);
            setAuthModal('login');
          }}
        />
      )}
    </div>
  );
}

export default App;
