export const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Shop Perfume
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Welcome to Shop Perfume - Initial Source
        </p>
        <div className="flex gap-4 justify-center">
          <div className="bg-white px-6 py-3 rounded-lg shadow-md">
            <p className="text-sm text-gray-500">Frontend</p>
            <p className="text-lg font-semibold text-blue-600">React + TypeScript</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg shadow-md">
            <p className="text-sm text-gray-500">Backend</p>
            <p className="text-lg font-semibold text-green-600">Spring Boot</p>
          </div>
        </div>
      </div>
    </div>
  );
};

