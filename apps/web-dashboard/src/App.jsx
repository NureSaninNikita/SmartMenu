
import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants/:restaurantId/dishes/:dishId" element={<Dish />}/>
        <Route path="/restaurants/:restaurantId" element={<Restaurant />} />
        <Route path="/restaurant-admin" element={<RestaurantAdmin />} />
        <Route path="/restaurant-admin/categories" element={<MenuCategories />}/>
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;