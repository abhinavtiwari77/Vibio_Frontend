import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

const MainLayout = ({ children, showRightSidebar = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
};

export default MainLayout;
