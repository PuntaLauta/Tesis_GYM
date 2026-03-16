import { jsPDF } from 'jspdf';
import { Chart } from 'chart.js/auto';

const CHART_WIDTH = 520;
const CHART_HEIGHT = 260;
const PAGE_MARGIN = 18;
const IMAGE_WIDTH = 175;
const IMAGE_HEIGHT = 72;
const SECTION_GAP = 6;
const HEADER_HEIGHT = 14;
const TITLE_PDF = 'Reportes del Gimnasio';

const SECTION_LABELS = {
  ingresos: 'Ingresos',
  clasesPopulares: 'Clases Más Populares',
  ocupacion: 'Ocupación de Clases',
  accesos: 'Control de Accesos',
  estadoSocios: 'Estado de Socios',
};

function createChartImage(type, data, options) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = CHART_WIDTH;
    canvas.height = CHART_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }
    const chart = new Chart(ctx, {
      type,
      data,
      options: {
        ...options,
        animation: false,
        responsive: false,
      },
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const dataUrl = chart.toBase64Image('image/png');
          chart.destroy();
          resolve(dataUrl);
        } catch (e) {
          chart.destroy();
          resolve(null);
        }
      });
    });
  });
}

function getPageHeight(doc) {
  return doc.internal.pageSize.getHeight();
}

function getPageWidth(doc) {
  return doc.internal.pageSize.getWidth();
}

function drawPageHeader(doc, pageNum, totalPages) {
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(TITLE_PDF, PAGE_MARGIN, 8);
  const totalStr = String(Number(totalPages) || 1);
  const pageStr = String(Number(pageNum) || 1);
  const pageLabel = 'Página ' + pageStr + ' de ' + totalStr;
  const textWidth = doc.getTextWidth(pageLabel);
  doc.text(pageLabel, getPageWidth(doc) - PAGE_MARGIN - textWidth, 8);
  doc.setDrawColor(200, 200, 200);
  doc.line(PAGE_MARGIN, 10, getPageWidth(doc) - PAGE_MARGIN, 10);
}

function addPortada(doc, sectionNames, dateStr) {
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text(TITLE_PDF, PAGE_MARGIN, 28);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  doc.text('Reporte personalizado generado desde el panel de administración.', PAGE_MARGIN, 38);
  doc.text(`Fecha de generación: ${dateStr}`, PAGE_MARGIN, 46);
  doc.setFont(undefined, 'bold');
  doc.text('Secciones incluidas:', PAGE_MARGIN, 56);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  sectionNames.forEach((name, i) => {
    doc.text(`${i + 1}. ${name}`, PAGE_MARGIN + 4, 64 + i * 6);
  });
  doc.setDrawColor(200, 200, 200);
  doc.line(PAGE_MARGIN, 64 + sectionNames.length * 6 + 4, getPageWidth(doc) - PAGE_MARGIN, 64 + sectionNames.length * 6 + 4);
}

function ensureSpace(doc, y, needed, pageNum) {
  const pageHeight = getPageHeight(doc);
  if (y + needed <= pageHeight - PAGE_MARGIN) return { y, pageNum };
  doc.addPage();
  const nextPage = pageNum + 1;
  drawPageHeader(doc, nextPage, 0);
  return { y: PAGE_MARGIN + HEADER_HEIGHT, pageNum: nextPage };
}

function addSectionTitle(doc, title, y) {
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.text(title, PAGE_MARGIN, y);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  return y + 8;
}

function addTextBlock(doc, text, y) {
  const maxWidth = getPageWidth(doc) - PAGE_MARGIN * 2;
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, PAGE_MARGIN, y);
  return y + lines.length * 5 + 6;
}

const TABLE_ROW_HEIGHT = 6;
const TABLE_FONT_SIZE = 8;
const TABLE_MAX_WIDTH = 170;

function addTable(doc, headers, rows, startY, colWidths) {
  const pageWidth = getPageWidth(doc);
  const totalWidth = Math.min(TABLE_MAX_WIDTH, pageWidth - PAGE_MARGIN * 2);
  const widths = colWidths && colWidths.length === headers.length
    ? colWidths.map((w) => (typeof w === 'number' ? w : totalWidth * w))
    : headers.map(() => totalWidth / headers.length);
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  const startX = (pageWidth - tableWidth) / 2;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.2);
  let y = startY;
  doc.setFontSize(TABLE_FONT_SIZE);
  doc.setFont(undefined, 'bold');
  let x = startX;
  headers.forEach((h, i) => {
    const w = widths[i];
    doc.rect(x, y, w, TABLE_ROW_HEIGHT);
    doc.text(String(h).slice(0, 22), x + 2, y + 3.8);
    x += w;
  });
  y += TABLE_ROW_HEIGHT;
  doc.setFont(undefined, 'normal');
  rows.forEach((row) => {
    x = startX;
    row.forEach((cell, i) => {
      const w = widths[i];
      doc.rect(x, y, w, TABLE_ROW_HEIGHT);
      doc.text(String(cell).slice(0, 22), x + 2, y + 3.8);
      x += w;
    });
    y += TABLE_ROW_HEIGHT;
  });
  return y + 6;
}

function hexToRgb(hex) {
  const m = hex.replace(/^#/, '').match(/^(..)(..)(..)$/);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function addPieLegend(doc, items, y, colors = []) {
  const LEGEND_GAP_TOP = 10;
  const SWATCH_SIZE = 2.5;
  const colWidth = (getPageWidth(doc) - PAGE_MARGIN * 2) / 2;
  let x = PAGE_MARGIN;
  let rowY = y + LEGEND_GAP_TOP;
  items.forEach((item, i) => {
    if (i > 0 && i % 2 === 0) {
      x = PAGE_MARGIN;
      rowY += 7;
    }
    const rgb = colors[i] ? hexToRgb(colors[i]) : [100, 100, 100];
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(x, rowY - 1.5, SWATCH_SIZE, SWATCH_SIZE, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.rect(x, rowY - 1.5, SWATCH_SIZE, SWATCH_SIZE, 'S');
    const label = item.label.length > 22 ? item.label.slice(0, 19) + '…' : item.label;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}: ${item.pct}%`, x + SWATCH_SIZE + 2, rowY + 0.8);
    x += colWidth;
  });
  return rowY + 10;
}

export async function generateReportPdf(config, apiCalls) {
  const doc = new jsPDF();
  const {
    getIngresos,
    getClasesPopulares,
    getOcupacionClases,
    getAccesos,
    getEstadoSocios,
    getMetodosPago,
  } = apiCalls;

  const includedIds = ['ingresos', 'clasesPopulares', 'ocupacion', 'accesos', 'estadoSocios'].filter(
    (id) => config[id]?.included !== false
  );
  const sectionNames = includedIds.map((id) => SECTION_LABELS[id] || id);
  const dateStr = new Date().toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

  let pageNum = 1;
  let y = PAGE_MARGIN + HEADER_HEIGHT;

  if (includedIds.length === 0) {
    addPortada(doc, ['Ninguna'], dateStr);
    doc.setFontSize(12);
    doc.text('No se incluyó ninguna sección. Selecciona al menos una en el modal.', PAGE_MARGIN, 100);
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');
    return;
  }

  addPortada(doc, sectionNames, dateStr);
  doc.addPage();
  pageNum = 2;
  drawPageHeader(doc, pageNum, 0);
  y = PAGE_MARGIN + HEADER_HEIGHT;

  if (config.ingresos?.included !== false) {
    const c = config.ingresos;
    const params = { desde: c.desde, hasta: c.hasta, agrupacion: c.agrupacion || 'semana' };
    try {
      const [resIngresos, resMetodos] = await Promise.all([getIngresos(params), getMetodosPago({ desde: c.desde, hasta: c.hasta })]);
      const data = resIngresos.data;
      const metodosPago = resMetodos.data;
      const porDia = data?.porDia || [];
      const tableRows = porDia.length * TABLE_ROW_HEIGHT + 20;
      let sectionY = y;
      const needed = 14 + 6 + 20 + IMAGE_HEIGHT + 12 + tableRows;
      const space = ensureSpace(doc, sectionY, needed, pageNum);
      sectionY = space.y;
      pageNum = space.pageNum;

      sectionY = addSectionTitle(doc, 'Ingresos', sectionY);
      const total = data?.total ?? 0;
      const totalPagos = data?.resumen?.totalPagos ?? 0;
      const promedio = data?.resumen?.promedio ?? 0;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Monto total: $${Number(total).toFixed(2)}`, PAGE_MARGIN, sectionY);
      sectionY += 6;
      doc.setFont(undefined, 'normal');
      if (metodosPago) {
        const ef = metodosPago.efectivo || {};
        const tr = metodosPago.transferencia || {};
        doc.setFontSize(9);
        doc.text(`Efectivo: $${Number(ef.total || 0).toFixed(2)} | ${ef.cantidad ?? 0} pagos (${ef.porcentaje ?? 0}%)`, PAGE_MARGIN, sectionY);
        sectionY += 5;
        doc.text(`Transferencia: $${Number(tr.total || 0).toFixed(2)} | ${tr.cantidad ?? 0} pagos (${tr.porcentaje ?? 0}%)`, PAGE_MARGIN, sectionY);
        sectionY += 8;
      }

      if (porDia.length > 0) {
        const chartData = {
          labels: porDia.map((d) => d.fecha),
          datasets: [
            { label: 'Efectivo', data: porDia.map((d) => d.efectivo || 0), backgroundColor: 'rgba(34, 197, 94, 0.7)' },
            { label: 'Transferencia', data: porDia.map((d) => d.transferencia || 0), backgroundColor: 'rgba(37, 99, 235, 0.7)' },
          ],
        };
        const img = await createChartImage('bar', chartData, { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { display: false } } });
        if (img) {
          doc.addImage(img, 'PNG', PAGE_MARGIN, sectionY, IMAGE_WIDTH, IMAGE_HEIGHT);
          sectionY += IMAGE_HEIGHT + SECTION_GAP;
        }
        const agrupacionLabel = (c.agrupacion || 'semana') === 'dia' ? 'día' : (c.agrupacion || 'semana') === 'semana' ? 'semana' : (c.agrupacion || 'semana') === 'mes' ? 'mes' : 'año';
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`Por ${agrupacionLabel}:`, PAGE_MARGIN, sectionY);
        sectionY += 6;
        const tw = getPageWidth(doc) - PAGE_MARGIN * 2;
        sectionY = addTable(doc, ['Período', 'Monto'], porDia.map((d) => [d.fecha, '$' + Number(d.monto || 0).toFixed(2)]), sectionY, [tw * 0.5, tw * 0.5]);
      }
      sectionY += SECTION_GAP;
      y = sectionY;
    } catch (err) {
      y = addSectionTitle(doc, 'Ingresos', y);
      y = addTextBlock(doc, 'Error al cargar ingresos: ' + (err.message || 'Desconocido'), y) + SECTION_GAP;
    }
  }

  if (config.clasesPopulares?.included !== false) {
    const c = config.clasesPopulares;
    const params = { desde: c.desde, hasta: c.hasta };
    try {
      const res = await getClasesPopulares(params);
      const list = res.data || [];
      let sectionY = y;
      const totalReservas = list.reduce((s, x) => s + (x.total_reservas || 0), 0);
      const legendItems = list.length > 0 ? list.map((x) => ({ label: x.nombre || 'Sin nombre', pct: totalReservas ? ((x.total_reservas || 0) / totalReservas * 100).toFixed(1) : '0' })) : [];
      const tableH = list.length > 0 ? list.length * TABLE_ROW_HEIGHT + 14 : 0;
      const needed = 14 + 6 + IMAGE_HEIGHT + (legendItems.length > 0 ? Math.ceil(legendItems.length / 2) * 7 + 20 : 0) + tableH + 10;
      let space = ensureSpace(doc, sectionY, needed, pageNum);
      sectionY = space.y;
      pageNum = space.pageNum;

      sectionY = addSectionTitle(doc, 'Clases Más Populares', sectionY);
      sectionY = addTextBlock(doc, `Total reservas: ${totalReservas}`, sectionY);

      if (list.length > 0) {
        const colores = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];
        const chartData = {
          labels: list.map((x) => x.nombre || 'Sin nombre'),
          datasets: [{
            data: list.map((x) => x.total_reservas || 0),
            backgroundColor: list.map((_, i) => colores[i % colores.length]),
            borderWidth: 1,
          }],
        };
        const chartOpts = {
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : '0';
                  return `${ctx.label}: ${ctx.raw} reservas (${pct}%)`;
                },
              },
            },
          },
        };
        const img = await createChartImage('pie', chartData, chartOpts);
        if (img) {
          doc.addImage(img, 'PNG', PAGE_MARGIN, sectionY, IMAGE_WIDTH, IMAGE_HEIGHT);
          sectionY += IMAGE_HEIGHT + 12;
        }
        const coloresClases = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];
        const legendColors = list.map((_, i) => coloresClases[i % coloresClases.length]);
        sectionY = addPieLegend(doc, legendItems, sectionY, legendColors);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Detalle por clase:', PAGE_MARGIN, sectionY);
        sectionY += 6;
        const tw = getPageWidth(doc) - PAGE_MARGIN * 2;
        sectionY = addTable(doc, ['Clase', 'Clases', 'Reservas', 'Ocupación', '% Asist.'], list.map((x) => [
          x.nombre || '-',
          String(x.total_clases ?? 0),
          String(x.total_reservas ?? 0),
          `${x.total_ocupados ?? 0}/${x.total_cupos ?? 0}`,
          (x.porcentaje_asistencia != null ? Math.round(x.porcentaje_asistencia) : 0) + '%',
        ]), sectionY, [tw * 0.25, tw * 0.12, tw * 0.15, tw * 0.18, tw * 0.12]);
      }
      y = sectionY + SECTION_GAP;
    } catch (err) {
      y = addSectionTitle(doc, 'Clases Más Populares', y);
      y = addTextBlock(doc, 'Error al cargar clases populares.', y) + SECTION_GAP;
    }
  }

  if (config.ocupacion?.included !== false) {
    const c = config.ocupacion;
    const params = { desde: c.desde, hasta: c.hasta };
    if (c.tipo_clase_id) params.tipo_clase_id = c.tipo_clase_id;
    try {
      const res = await getOcupacionClases(params);
      const data = res.data;
      let sectionY = y;
      const tablaOcupLen = Math.min((data?.clases || []).length, 18);
      const needed = 14 + 6 + IMAGE_HEIGHT + 24 + (tablaOcupLen ? tablaOcupLen * TABLE_ROW_HEIGHT + 18 : 0);
      let space = ensureSpace(doc, sectionY, needed, pageNum);
      sectionY = space.y;
      pageNum = space.pageNum;

      sectionY = addSectionTitle(doc, 'Ocupación de Clases', sectionY);
      const promedio = data?.promedio ?? 0;
      const total = data?.total ?? 0;
      sectionY = addTextBlock(doc, `Promedio de ocupación: ${promedio}% | Total clases: ${total}`, sectionY);

      const clases = data?.clases || [];
      const porDisciplina = clases.reduce((acc, c) => {
        const n = c.nombre ?? 'Sin nombre';
        if (!acc[n]) acc[n] = { nombre: n, cupo: 0, ocupados: 0 };
        acc[n].cupo += c.cupo ?? 0;
        acc[n].ocupados += c.ocupados ?? 0;
        return acc;
      }, {});
      const barras = Object.values(porDisciplina)
        .map((d) => ({ ...d, porcentaje: d.cupo > 0 ? Math.round((d.ocupados / d.cupo) * 100) : 0, disponibles: d.cupo - d.ocupados }))
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 10);
      if (barras.length > 0) {
        const chartData = {
          labels: barras.map((d) => d.nombre),
          datasets: [
            { label: 'Ocupados', data: barras.map((d) => d.ocupados), backgroundColor: 'rgba(37, 99, 235, 0.8)' },
            { label: 'Disponibles', data: barras.map((d) => d.disponibles), backgroundColor: 'rgba(209, 213, 219, 0.8)' },
          ],
        };
        const img = await createChartImage('bar', chartData, {
          indexAxis: 'y',
          scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } },
          plugins: { legend: { position: 'bottom' } },
        });
        if (img) {
          doc.addImage(img, 'PNG', PAGE_MARGIN, sectionY, IMAGE_WIDTH, IMAGE_HEIGHT);
          sectionY += IMAGE_HEIGHT + SECTION_GAP;
        }
      }
      const tablaOcup = (clases.slice(0, 18)).map((c) => [c.nombre ?? '-', c.fecha ?? '-', `${c.ocupados ?? 0}/${c.cupo ?? 0}`, (c.porcentaje ?? 0) + '%']);
      if (tablaOcup.length > 0) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Detalle por clase y fecha:', PAGE_MARGIN, sectionY);
        sectionY += 6;
        const tw = getPageWidth(doc) - PAGE_MARGIN * 2;
        sectionY = addTable(doc, ['Clase', 'Fecha', 'Ocupación', '%'], tablaOcup, sectionY, [tw * 0.3, tw * 0.2, tw * 0.25, tw * 0.15]);
      }
      y = sectionY + SECTION_GAP;
    } catch (err) {
      y = addSectionTitle(doc, 'Ocupación de Clases', y);
      y = addTextBlock(doc, 'Error al cargar ocupación.', y) + SECTION_GAP;
    }
  }

  if (config.accesos?.included !== false) {
    const c = config.accesos;
    const params = { desde: c.desde, hasta: c.hasta, agrupacion: c.agrupacion || 'semana' };
    try {
      const res = await getAccesos(params);
      const data = res.data;
      const porDiaAcc = data?.porDia || [];
      let sectionY = y;
      const needed = 14 + 6 + IMAGE_HEIGHT + 24 + (porDiaAcc.length * TABLE_ROW_HEIGHT + 18);
      let space = ensureSpace(doc, sectionY, needed, pageNum);
      sectionY = space.y;
      pageNum = space.pageNum;

      sectionY = addSectionTitle(doc, 'Control de Accesos', sectionY);
      sectionY = addTextBlock(doc, `Total: ${data?.total ?? 0} | Permitidos: ${data?.permitidos ?? 0} (${data?.porcentajePermitidos ?? 0}%) | Denegados: ${data?.denegados ?? 0}`, sectionY);

      if (porDiaAcc.length > 0) {
        const chartData = {
          labels: porDiaAcc.map((d) => d.fecha),
          datasets: [
            { label: 'Permitidos', data: porDiaAcc.map((d) => d.permitidos || 0), backgroundColor: 'rgba(34, 197, 94, 0.8)' },
            { label: 'Denegados', data: porDiaAcc.map((d) => d.denegados || 0), backgroundColor: 'rgba(239, 68, 68, 0.8)' },
          ],
        };
        const img = await createChartImage('bar', chartData, {
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
          plugins: { legend: { position: 'bottom' } },
        });
        if (img) {
          doc.addImage(img, 'PNG', PAGE_MARGIN, sectionY, IMAGE_WIDTH, IMAGE_HEIGHT);
          sectionY += IMAGE_HEIGHT + SECTION_GAP;
        }
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Detalle por período:', PAGE_MARGIN, sectionY);
        sectionY += 6;
        const tw = getPageWidth(doc) - PAGE_MARGIN * 2;
        sectionY = addTable(doc, ['Fecha', 'Permitidos', 'Denegados'], porDiaAcc.map((d) => [d.fecha, String(d.permitidos ?? 0), String(d.denegados ?? 0)]), sectionY, [tw * 0.4, tw * 0.3, tw * 0.3]);
      }
      y = sectionY + SECTION_GAP;
    } catch (err) {
      y = addSectionTitle(doc, 'Control de Accesos', y);
      y = addTextBlock(doc, 'Error al cargar accesos.', y) + SECTION_GAP;
    }
  }

  if (config.estadoSocios?.included !== false) {
    const c = config.estadoSocios;
    const params = { desde: c.desde, hasta: c.hasta };
    try {
      const res = await getEstadoSocios(params);
      const data = res.data;
      const total = data?.total ?? 0;
      const items = [
        { label: 'Activo', value: data?.activo ?? 0 },
        { label: 'Inactivo', value: data?.inactivo ?? 0 },
        { label: 'Suspendido', value: data?.suspendido ?? 0 },
        { label: 'Abandono', value: data?.abandono ?? 0 },
      ];
      const legendItems = items.map((item) => ({
        label: item.label,
        pct: total ? ((item.value / total) * 100).toFixed(1) : '0',
      }));
      let sectionY = y;
      const needed = 14 + 10 + 4 * TABLE_ROW_HEIGHT + 18 + IMAGE_HEIGHT + 4 + (legendItems.length / 2) * 7 + 24;
      let space = ensureSpace(doc, sectionY, needed, pageNum);
      sectionY = space.y;
      pageNum = space.pageNum;

      sectionY = addSectionTitle(doc, 'Estado de Socios', sectionY);
      sectionY = addTextBlock(doc, `Total: ${total}`, sectionY);
      sectionY = addTextBlock(doc, `Activo: ${data?.activo ?? 0} | Inactivo: ${data?.inactivo ?? 0} | Suspendido: ${data?.suspendido ?? 0} | Abandono: ${data?.abandono ?? 0}`, sectionY);
      const tablaEstado = [
        ['Activo', String(data?.activo ?? 0)],
        ['Inactivo', String(data?.inactivo ?? 0)],
        ['Suspendido', String(data?.suspendido ?? 0)],
        ['Abandono', String(data?.abandono ?? 0)],
      ];
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen por estado:', PAGE_MARGIN, sectionY);
      sectionY += 6;
      const tw = getPageWidth(doc) - PAGE_MARGIN * 2;
      sectionY = addTable(doc, ['Estado', 'Cantidad'], tablaEstado, sectionY, [tw * 0.5, tw * 0.5]);
      sectionY += 4;

      const chartData = {
        labels: items.map((i) => i.label),
        datasets: [{
          data: items.map((i) => i.value),
          backgroundColor: ['#22c55e', '#dc2626', '#eab308', '#ea580c'],
          borderWidth: 1,
        }],
      };
      const img = await createChartImage('pie', chartData, { plugins: { legend: { display: false } } });
      if (img) {
        doc.addImage(img, 'PNG', PAGE_MARGIN, sectionY, IMAGE_WIDTH, IMAGE_HEIGHT);
        sectionY += IMAGE_HEIGHT + 12;
      }
      const coloresEstado = ['#22c55e', '#dc2626', '#eab308', '#ea580c'];
      sectionY = addPieLegend(doc, legendItems, sectionY, coloresEstado);
      y = sectionY + SECTION_GAP;
    } catch (err) {
      y = addSectionTitle(doc, 'Estado de Socios', y);
      y = addTextBlock(doc, 'Error al cargar estado de socios.', y) + SECTION_GAP;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageHeader(doc, p, totalPages);
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
