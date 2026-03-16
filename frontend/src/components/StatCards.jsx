function ReportCard({ sectionId, label, icon, className, iconOnly = false }) {
  const handleClick = () => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={label}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:shadow hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0 ${className}`}
      >
        <span className="w-5 h-5 flex-shrink-0" aria-hidden>{icon}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] cursor-pointer w-full min-h-[100px] ${className}`}
    >
      <span className="w-10 h-10 flex-shrink-0" aria-hidden>{icon}</span>
      <span className="text-sm font-medium text-gray-700 text-center leading-tight">{label}</span>
    </button>
  );
}

const ICON_MONEY = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-purple-600">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
  </svg>
);

const ICON_CLASSES = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-violet-600">
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
  </svg>
);

const ICON_OCCUPATION = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-amber-600">
    <path d="M11 2v2c-4.97.47-8.82 4.1-9.28 9.08H2v2h1.72c.46 4.98 4.31 8.61 9.28 9.08v2h2v-2c4.97-.47 8.82-4.1 9.28-9.08H22v-2h-1.72c-.46-4.98-4.31-8.61-9.28-9.08V2h-2zm1 4c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7z"/>
  </svg>
);

const ICON_ACCESS = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-sky-600">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

const ICON_SOCIOS = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-teal-600">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const ICON_PRINT = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-blue-600">
    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
  </svg>
);

const CARDS = [
  { id: 'reporte-ingresos', label: 'Ingresos', icon: ICON_MONEY, className: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100' },
  { id: 'reporte-clases-populares', label: 'Clases Más Populares', icon: ICON_CLASSES, className: 'bg-violet-50 border-violet-200 hover:border-violet-400 hover:bg-violet-100' },
  { id: 'reporte-ocupacion', label: 'Ocupación de Clases', icon: ICON_OCCUPATION, className: 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100' },
  { id: 'reporte-accesos', label: 'Control de Accesos', icon: ICON_ACCESS, className: 'bg-sky-50 border-sky-200 hover:border-sky-400 hover:bg-sky-100' },
  { id: 'reporte-estado-socios', label: 'Estado de Socios', icon: ICON_SOCIOS, className: 'bg-teal-50 border-teal-200 hover:border-teal-400 hover:bg-teal-100' },
];

export default function StatCards({ isSticky = false, onPrint }) {
  if (isSticky) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {CARDS.map(({ id, label, icon, className }) => (
          <ReportCard key={id} sectionId={id} label={label} icon={icon} className={className} iconOnly />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map(({ id, label, icon, className }) => (
        <ReportCard key={id} sectionId={id} label={label} icon={icon} className={className} />
      ))}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] cursor-pointer w-full min-h-[100px]"
        >
          <span className="w-10 h-10 flex-shrink-0" aria-hidden>{ICON_PRINT}</span>
          <span className="text-sm font-medium text-gray-700 text-center leading-tight">Generar e imprimir reporte</span>
        </button>
      )}
    </div>
  );
}
