function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-400">404</h1>
        <p className="mt-4 mb-6 text-xl">Page not found</p>
        <a
          href="/patient/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

export default NotFound;
