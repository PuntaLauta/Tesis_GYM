export default function StatCards({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 justify-items-center md:justify-items-stretch">
      {stats.activos !== undefined && stats.inactivos !== undefined && (
        <>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 w-full md:w-auto text-center md:text-left">
            <div className="text-sm text-gray-600">Socios Activos</div>
            <div className="text-2xl font-bold text-green-700">{stats.activos}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 w-full md:w-auto text-center md:text-left">
            <div className="text-sm text-gray-600">Socios Inactivos</div>
            <div className="text-2xl font-bold text-red-700">{stats.inactivos}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 w-full md:w-auto text-center md:text-left">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-blue-700">{stats.total || stats.activos + stats.inactivos}</div>
          </div>
        </>
      )}

      {stats.totalIngresos !== undefined && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 w-full md:w-auto text-center md:text-left">
          <div className="text-sm text-gray-600">Ingresos</div>
          <div className="text-2xl font-bold text-purple-700">${stats.totalIngresos.toFixed(2)}</div>
        </div>
      )}

      {stats.promedioOcupacion !== undefined && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 w-full md:w-auto text-center md:text-left">
          <div className="text-sm text-gray-600">Ocupación Promedio</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.promedioOcupacion}%</div>
        </div>
      )}
    </div>
  );
}



