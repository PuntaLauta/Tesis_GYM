function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const ICON_MONEY = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-purple-600">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
  </svg>
);

const ICON_CLASSES = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-violet-600">
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />
  </svg>
);

const ICON_OCCUPATION = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-amber-600">
    <path d="M11 2v2c-4.97.47-8.82 4.1-9.28 9.08H2v2h1.72c.46 4.98 4.31 8.61 9.28 9.08v2h2v-2c4.97-.47 8.82-4.1 9.28-9.08H22v-2h-1.72c-.46-4.98-4.31-8.61-9.28-9.08V2h-2zm1 4c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7z" />
  </svg>
);

const ICON_ACCESS = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-sky-600">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
);

const ICON_SOCIOS = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-teal-600">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const ICON_PRINT = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-600">
    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
  </svg>
);

/** Mismas paletas que StatCards (accesos rápidos) */
const THEME = {
  ingresos: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
  clases: 'bg-violet-50 border-violet-200 hover:border-violet-400 hover:bg-violet-100',
  ocupacion: 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100',
  accesos: 'bg-sky-50 border-sky-200 hover:border-sky-400 hover:bg-sky-100',
  socios: 'bg-teal-50 border-teal-200 hover:border-teal-400 hover:bg-teal-100',
};

/** Orden alineado con el panorama: socios, luego 2×2 + imprimir */
const STICKY_NAV = [
  { sectionId: 'reporte-estado-socios', title: 'Estado de socios', themeKey: 'socios', icon: ICON_SOCIOS },
  { sectionId: 'reporte-ingresos', title: 'Ingresos', themeKey: 'ingresos', icon: ICON_MONEY },
  { sectionId: 'reporte-clases-populares', title: 'Clases más populares', themeKey: 'clases', icon: ICON_CLASSES },
  { sectionId: 'reporte-ocupacion', title: 'Ocupación de clases', themeKey: 'ocupacion', icon: ICON_OCCUPATION },
  { sectionId: 'reporte-accesos', title: 'Control de accesos', themeKey: 'accesos', icon: ICON_ACCESS },
];

function OverviewTile({ sectionId, title, icon, themeKey, children }) {
  return (
    <button
      type="button"
      onClick={() => scrollToSection(sectionId)}
      className={`text-left rounded-xl border-2 px-2.5 py-2 sm:px-3 sm:py-2.5 transition-all duration-200 hover:shadow-lg w-full min-h-[5.5rem] flex gap-2 ${THEME[themeKey]}`}
    >
      <span className="w-8 h-8 flex-shrink-0 mt-0.5" aria-hidden>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 leading-tight mb-1">{title}</p>
        <div className="text-xs text-gray-900 leading-snug">{children}</div>
      </div>
    </button>
  );
}

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `$${Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Resumen compacto de métricas ya cargadas en la página de reportes.
 */
export default function ReportsOverview({
  ingresos,
  ingresosPeriodoLabel,
  clasesPopulares,
  ocupacion,
  accesos,
  estadoSocios,
  onPrint,
  printDisabled = false,
}) {
  const topClase = Array.isArray(clasesPopulares) && clasesPopulares.length > 0 ? clasesPopulares[0] : null;
  const topNombre = topClase?.nombre ?? null;
  const topReservas = topClase?.total_reservas;

  return (
    <section
      className="rounded-xl border-2 border-gray-200 bg-white p-3 sm:p-4 shadow-md mb-4"
      aria-labelledby="reports-overview-heading"
    >
      <div className="text-center mb-4">
        <h2
          id="reports-overview-heading"
          className="text-xl sm:text-2xl font-extrabold tracking-tight"
        >
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            Panorama general
          </span>
        </h2>
        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" aria-hidden />
        <p className="mt-3 text-sm text-gray-600">Selecciona para ver detalles</p>
      </div>

      <button
        type="button"
        onClick={() => scrollToSection('reporte-estado-socios')}
        className={`w-full rounded-xl border-2 px-3 py-3 sm:px-4 sm:py-3.5 mb-3 text-left transition-all duration-200 hover:shadow-lg ${THEME.socios}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 flex-shrink-0" aria-hidden>
              {ICON_SOCIOS}
            </span>
            <span className="text-sm font-semibold text-gray-800">Estado de socios</span>
          </div>
          <div className="flex-1 flex flex-wrap gap-x-6 gap-y-2 sm:justify-end text-sm text-gray-900">
            {estadoSocios != null ? (
              <>
                <span>
                  <span className="text-gray-600 text-xs block sm:inline sm:mr-1">Activos</span>
                  <strong className="tabular-nums">{estadoSocios.activo ?? 0}</strong>
                  <span className="text-gray-500 text-xs"> / {estadoSocios.total ?? 0} total</span>
                </span>
                <span className="text-xs sm:text-sm">
                  <span className="text-gray-600">Inactivos</span>{' '}
                  <strong className="tabular-nums">{estadoSocios.inactivo ?? 0}</strong>
                </span>
                <span className="text-xs sm:text-sm">
                  <span className="text-gray-600">Suspendidos</span>{' '}
                  <strong className="tabular-nums">{estadoSocios.suspendido ?? 0}</strong>
                </span>
                <span className="text-xs sm:text-sm">
                  <span className="text-gray-600">Abandono</span>{' '}
                  <strong className="tabular-nums">{estadoSocios.abandono ?? 0}</strong>
                </span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">Sin datos</span>
            )}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <OverviewTile sectionId="reporte-ingresos" title="Ingresos" icon={ICON_MONEY} themeKey="ingresos">
          <p className="font-semibold tabular-nums">{ingresos != null ? fmtMoney(ingresos.total) : '—'}</p>
          {ingresosPeriodoLabel ? (
            <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{ingresosPeriodoLabel}</p>
          ) : null}
        </OverviewTile>

        <OverviewTile
          sectionId="reporte-clases-populares"
          title="Clases más populares"
          icon={ICON_CLASSES}
          themeKey="clases"
        >
          {topNombre ? (
            <>
              <p className="font-medium line-clamp-2">{topNombre}</p>
              <p className="text-[11px] text-gray-700 mt-0.5">
                {topReservas != null ? `${Number(topReservas)} reservas` : '—'}
              </p>
            </>
          ) : (
            <p className="text-gray-600">Sin datos</p>
          )}
        </OverviewTile>

        <OverviewTile sectionId="reporte-ocupacion" title="Ocupación de clases" icon={ICON_OCCUPATION} themeKey="ocupacion">
          {ocupacion != null ? (
            <>
              <p className="font-semibold">
                Promedio <span className="tabular-nums">{ocupacion.promedio ?? 0}%</span>
              </p>
              <p className="text-[11px] text-gray-700 mt-0.5">
                {ocupacion.total != null ? `${ocupacion.total} clase${ocupacion.total === 1 ? '' : 's'}` : '—'}
              </p>
            </>
          ) : (
            <p className="text-gray-600">Sin datos</p>
          )}
        </OverviewTile>

        <OverviewTile sectionId="reporte-accesos" title="Control de accesos" icon={ICON_ACCESS} themeKey="accesos">
          {accesos != null ? (
            <>
              <p className="font-semibold tabular-nums">{accesos.total ?? 0} eventos</p>
              <p className="text-[11px] text-gray-700 mt-0.5">
                {accesos.porcentajePermitidos != null ? `${accesos.porcentajePermitidos}% permitidos` : '—'}
              </p>
            </>
          ) : (
            <p className="text-gray-600">Sin datos</p>
          )}
        </OverviewTile>
      </div>

      {onPrint && (
        <div className="mt-3 sm:mt-4 flex justify-center">
          <button
            type="button"
            onClick={onPrint}
            disabled={printDisabled}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] cursor-pointer w-full max-w-[220px] min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="w-10 h-10 flex-shrink-0" aria-hidden>
              {ICON_PRINT}
            </span>
            <span className="text-sm font-medium text-gray-700 text-center leading-tight">Generar e imprimir reporte</span>
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * Barra compacta al hacer scroll: mismos destinos que el panorama + imprimir.
 */
const stickyBtnClass =
  'flex min-h-[4.25rem] min-w-[4.75rem] max-w-[7.5rem] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 transition-all duration-200 hover:shadow-md active:scale-[0.98] sm:min-w-[5.5rem] sm:max-w-[8.5rem] sm:px-1.5';

export function ReportsOverviewStickyBar({ onPrint, printDisabled = false }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2">
      {STICKY_NAV.map(({ sectionId, title, themeKey, icon }) => (
        <button
          key={sectionId}
          type="button"
          onClick={() => scrollToSection(sectionId)}
          className={`${stickyBtnClass} ${THEME[themeKey]}`}
        >
          <span className="h-6 w-6 flex-shrink-0" aria-hidden>
            {icon}
          </span>
          <span className="line-clamp-3 text-center text-[10px] font-medium leading-tight text-gray-700 sm:text-[11px]">
            {title}
          </span>
        </button>
      ))}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          disabled={printDisabled}
          className={`${stickyBtnClass} border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-blue-200 disabled:hover:bg-blue-50`}
        >
          <span className="h-6 w-6 flex-shrink-0" aria-hidden>
            {ICON_PRINT}
          </span>
          <span className="line-clamp-3 text-center text-[10px] font-medium leading-tight text-gray-700 sm:text-[11px]">
            Generar e imprimir reporte
          </span>
        </button>
      )}
    </div>
  );
}
