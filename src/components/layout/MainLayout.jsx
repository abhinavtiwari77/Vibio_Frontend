import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

const MainLayout = ({ children, showRightSidebar = true, wide = false }) => {
  const shellClass = wide
    ? 'w-full max-w-none px-0'
    : 'vibio-shell';
  const gridClass = showRightSidebar
    ? 'grid grid-cols-1 gap-5 py-5 lg:gap-6 lg:py-6 lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[252px_minmax(0,1fr)_320px]'
    : wide
      ? 'grid grid-cols-1 lg:grid-cols-[252px_minmax(0,1fr)] gap-0 py-0'
      : 'grid grid-cols-1 gap-5 py-5 lg:gap-6 lg:py-6 lg:grid-cols-[252px_minmax(0,1fr)]';

  const mainClass = wide && !showRightSidebar
    ? 'min-h-[calc(100vh-5.5rem)] pb-0'
    : 'min-h-[calc(100vh-6.5rem)] pb-4';

  return (
    <div className="min-h-screen relative overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute top-32 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>
      <Navbar />
      <div className={`${shellClass} ${gridClass}`}>
        <Sidebar />
        <main className={mainClass}>
          {children}
        </main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
};

export default MainLayout;
