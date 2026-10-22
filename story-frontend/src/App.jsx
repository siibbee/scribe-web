import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddBook from "./pages/AddBook";
import Profile from "./pages/Profile";
import BookDetail from "./pages/BookDetail";
import AddChapter from "./pages/AddChapter";
import EditChapter from "./pages/Editchapter";
import ReadChapter from "./pages/ReadChapter";
import ProtectedRoute from "./components/ProtectedRoute";
import Search from "./pages/Search";
import Authors from "./pages/Authors";
import AuthorDetail from "./pages/AuthorDetail";

import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Terms from "./pages/Terms";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        
        <Route path="/add-book" element={<ProtectedRoute><AddBook /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>
        <Route path="/books/:bookId/add-chapter" element={<ProtectedRoute><AddChapter /></ProtectedRoute>} />
        <Route path="/books/:bookId/edit-chapter/:chapterId" element={<ProtectedRoute><EditChapter /></ProtectedRoute>} />
        <Route path="/books/:bookId/read/:chapterId" element={<ProtectedRoute><ReadChapter /></ProtectedRoute>} />

        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/authors" element={<Authors />} />
        <Route path="/author/:id" element={<AuthorDetail />} />

<Route path="/privacy" element={<Privacy />} />
<Route path="/cookies" element={<Cookies />} />
<Route path="/terms" element={<Terms />} />
        
      </Routes>
    </>
  );
}