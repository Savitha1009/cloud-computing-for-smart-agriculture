// src/components/layout/Layout.jsx
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
