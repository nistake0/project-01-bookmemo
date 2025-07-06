import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import BookList from "./pages/BookList";
import BookAdd from "./pages/BookAdd";
import BookDetail from "./pages/BookDetail";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  // ルートに応じてタブを選択状態に
  useEffect(() => {
    if (location.pathname.startsWith('/add')) setValue(1);
    else if (location.pathname.startsWith('/tags')) setValue(2);
    else if (location.pathname.startsWith('/stats')) setValue(3);
    else if (location.pathname.startsWith('/mypage')) setValue(4);
    else setValue(0); // デフォルトは本一覧
  }, [location.pathname]);

  return (
    <BottomNavigation
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
        if (newValue === 0) navigate('/');
        if (newValue === 1) navigate('/add');
        if (newValue === 2) navigate('/tags');
        if (newValue === 3) navigate('/stats');
        if (newValue === 4) navigate('/mypage');
      }}
      showLabels
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}
    >
      <BottomNavigationAction label="本一覧" icon={<LibraryBooksIcon />} />
      <BottomNavigationAction label="本を追加" icon={<AddCircleIcon />} />
      <BottomNavigationAction label="検索・タグ" icon={<SearchIcon />} />
      <BottomNavigationAction label="統計" icon={<BarChartIcon />} />
      <BottomNavigationAction label="マイページ" icon={<PersonIcon />} />
    </BottomNavigation>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  const hideBottomNav = (
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup') ||
    !user
  );

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><BookList /></PrivateRoute>} />
        <Route path="/add" element={<PrivateRoute><BookAdd /></PrivateRoute>} />
        <Route path="/book/:id" element={<PrivateRoute><BookDetail /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!hideBottomNav && <AppBottomNav />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/project-01-bookmemo">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
