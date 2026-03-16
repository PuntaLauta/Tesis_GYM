export default function InactiveInstructorBanner({ children }) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div
        role="alert"
        className="mb-4 border-l-4 border-red-500 bg-red-50 text-red-800 px-4 py-3 rounded"
      >
        Estado configurado como inactivo. Consulte con la administracion
      </div>
      {children}
    </div>
  );
}

