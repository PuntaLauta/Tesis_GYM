import { useState, useEffect } from 'react';
import { getActivosInactivos, getVencenSemana, getIngresos, getOcupacionClases } from '../services/reports';
import StatCards from '../components/StatCards';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [vencen, setVencen] = useState([]);
  const [ingresos, setIngresos] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    desde: new Date().toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [activosData, vencenData, ingresosData, ocupacionData] = await Promise.all([
        getActivosInactivos(),
        getVencenSemana(),
        getIngresos(filters),
        getOcupacionClases(filters),
      ]);

      setStats(activosData.data);
      setVencen(vencenData.data || []);
      setIngresos(ingresosData.data);
      setOcupacion(ocupacionData.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">Filtros de fecha</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={filters.desde}
            onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={filters.hasta}
            onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <StatCards
            stats={{
              ...stats,
              totalIngresos: ingresos?.total || 0,
              promedioOcupacion: ocupacion?.promedio || 0,
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vencen esta semana */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-bold mb-4">Vencen esta semana</h2>
              {vencen.length === 0 ? (
                <div className="text-gray-500 text-sm">No hay vencimientos esta semana</div>
              ) : (
                <div className="space-y-2">
                  {vencen.map((socio) => (
                    <div key={socio.id} className="border-b pb-2">
                      <div className="font-medium">{socio.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Vence: {socio.fecha_vencimiento} • Plan: {socio.plan_nombre}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingresos */}
            {ingresos && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="font-bold mb-4">Ingresos</h2>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-green-600">
                    ${ingresos.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ingresos.resumen.totalPagos} pagos • Promedio: ${ingresos.resumen.promedio.toFixed(2)}
                  </div>
                </div>
                {ingresos.porDia.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <div className="text-sm font-semibold mb-2">Por día:</div>
                    {ingresos.porDia.map((dia, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b py-1">
                        <span>{dia.fecha}</span>
                        <span className="font-medium">${dia.monto.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ocupación de clases */}
          {ocupacion && (
            <div className="bg-white p-4 rounded-lg shadow mt-6">
              <h2 className="font-bold mb-4">Ocupación de Clases</h2>
              <div className="mb-2">
                <div className="text-lg font-semibold">Promedio: {ocupacion.promedio}%</div>
                <div className="text-sm text-gray-600">Total de clases: {ocupacion.total}</div>
              </div>
              {ocupacion.clases.length > 0 && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Clase</th>
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Ocupación</th>
                        <th className="text-right py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocupacion.clases.map((clase) => (
                        <tr key={clase.id} className="border-b">
                          <td className="py-2">{clase.nombre}</td>
                          <td className="py-2">{clase.fecha}</td>
                          <td className="text-right py-2">
                            {clase.ocupados}/{clase.cupo}
                          </td>
                          <td className="text-right py-2">{clase.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}



