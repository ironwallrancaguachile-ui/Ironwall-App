/******************************************************
 * IRONWALL ERP
 * Dashboard Analítico JavaScript
 * js/dashboard_analitico.js
 ******************************************************/

if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
}

const API_ANALITICO = (window.CONFIG && CONFIG.API && (CONFIG.API.ANALITICO || CONFIG.API.DASHBOARD)) || "";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const graficosAnaliticos = {};

/******************************************************
 * Llamada al Apps Script (mismo patrón que dashboard.js)
 ******************************************************/

async function llamarAPIAnalitico(action, payload = {}) {
    if (!API_ANALITICO) {
        throw new Error("No se encontró la URL del endpoint en CONFIG.API.DASHBOARD.");
    }

    const respuesta = await fetch(API_ANALITICO, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            action: action,
            payload: payload
        })
    });

    const texto = await respuesta.text();

    try {
        return JSON.parse(texto);
    } catch (error) {
        console.error("Respuesta no válida de la API:", texto);
        throw new Error("El servidor no devolvió una respuesta JSON válida.");
    }
}

/******************************************************
 * Formatos y utilidades
 ******************************************************/

function pesos(valor) {
    return "$" + Number(valor || 0).toLocaleString("es-CL", {
        maximumFractionDigits: 0
    });
}

function pesosCorto(valor) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        notation: "compact",
        compactDisplay: "short"
    }).format(Number(valor || 0));
}

function numero(valor) {
    return Number(valor || 0).toLocaleString("es-CL", {
        maximumFractionDigits: 0
    });
}

function formatoISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function calcularRangoAnalitico() {
    const sel = document.getElementById("filtroRango");
    const desdeInput = document.getElementById("fechaDesde");
    const hastaInput = document.getElementById("fechaHasta");

    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const tipo = sel ? sel.value : "60";

    if (tipo === "personalizado") {
        return {
            desde: (desdeInput && desdeInput.value) || formatoISO(new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), 1)),
            hasta: (hastaInput && hastaInput.value) || formatoISO(hoyLocal)
        };
    }

    if (tipo === "mes_actual") {
        return {
            desde: formatoISO(new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), 1)),
            hasta: formatoISO(hoyLocal)
        };
    }

    if (tipo === "mes_anterior") {
        const inicioMesAnt = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth() - 1, 1);
        const finMesAnt = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), 0);
        return {
            desde: formatoISO(inicioMesAnt),
            hasta: formatoISO(finMesAnt)
        };
    }

    const dias = Math.max(1, parseInt(tipo, 10) || 60);
    const inicio = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), hoyLocal.getDate() - (dias - 1));
    return {
        desde: formatoISO(inicio),
        hasta: formatoISO(hoyLocal)
    };
}

function promedioMovil(arr = [], ventana = 7) {
    return arr.map((_, idx) => {
        const desde = Math.max(0, idx - ventana + 1);
        const trozo = arr.slice(desde, idx + 1);
        const suma = trozo.reduce((acc, v) => acc + (Number(v) || 0), 0);
        return Number((suma / trozo.length).toFixed(2));
    });
}

function montarGrafico(idCanvas, config) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas) return;

    if (graficosAnaliticos[idCanvas]) {
        graficosAnaliticos[idCanvas].destroy();
    }

    graficosAnaliticos[idCanvas] = new Chart(canvas.getContext("2d"), config);
}

function mostrarCargando(visible) {
    const elCargando = document.getElementById("cargando");
    const btn = document.getElementById("btnActualizar");
    if (elCargando) elCargando.style.display = visible ? "block" : "none";
    if (btn) btn.disabled = visible;
}

function mostrarErrorAnalitico(mensaje) {
    const elError = document.getElementById("error");
    if (!elError) return;
    elError.textContent = mensaje || "";
    elError.style.display = mensaje ? "block" : "none";
}

/******************************************************
 * Renderizado de bloques y gráficos
 ******************************************************/

function actualizarLecturaYNotas(data) {
    const rangoEl = document.getElementById("rangoTexto");
    const lecturaEl = document.getElementById("lectura");
    const pieEl = document.getElementById("notaPie");

    const ingresosArr = (data.diario && data.diario.ingresos) || [];
    const egresosArr = (data.diario && data.diario.egresos) || [];
    const visitasArr = (data.diario && data.diario.visitas) || [];
    const primerasArr = (data.semanal && data.semanal.primeras) || [];

    const totalIngresos = ingresosArr.reduce((a, b) => a + (Number(b) || 0), 0);
    const totalEgresos = egresosArr.reduce((a, b) => a + (Number(b) || 0), 0);
    const balance = totalIngresos - totalEgresos;
    const totalVisitas = visitasArr.reduce((a, b) => a + (Number(b) || 0), 0);
    const totalNuevas = primerasArr.reduce((a, b) => a + (Number(b) || 0), 0);

    if (rangoEl && data.rango) {
        rangoEl.textContent = `Del ${data.rango.desde} al ${data.rango.hasta} · ${data.rango.dias} días`;
    }

    if (lecturaEl) {
        lecturaEl.innerHTML =
            `<strong>Lectura rápida:</strong> En el período hubo <strong>${numero(totalVisitas)} visitas</strong> ` +
            `(<strong>${numero(totalNuevas)} primeras visitas</strong>), ingresos por <strong>${pesos(totalIngresos)}</strong> ` +
            `y egresos por <strong>${pesos(totalEgresos)}</strong> (balance: <strong>${pesos(balance)}</strong>).`;
    }

    if (pieEl) {
        const excluidos = Number(data.historicosExcluidos || 0);
        pieEl.textContent =
            `Los promedios por día de semana y el mapa de calor usan solo días completos. ` +
            `Registros históricos (IDPase = HISTORICO) excluidos del detalle diario/horario en este rango: ${excluidos}. ` +
            `El gráfico de clientes según última visita refleja el estado actual.`;
    }
}

function renderIngresosPorDia(diario) {
    const pm7 = promedioMovil(diario.ingresos, 7);

    montarGrafico("gIngresos", {
        type: "bar",
        data: {
            labels: diario.fechas,
            datasets: [
                {
                    type: "line",
                    label: "Promedio móvil 7d (ingresos)",
                    data: pm7,
                    borderColor: "#1565C0",
                    backgroundColor: "rgba(21, 101, 192, 0.12)",
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.3,
                    order: 0
                },
                {
                    label: "Ingresos",
                    data: diario.ingresos,
                    backgroundColor: "rgba(46, 125, 50, 0.72)",
                    borderRadius: 4,
                    order: 1
                },
                {
                    label: "Egresos",
                    data: diario.egresos,
                    backgroundColor: "rgba(211, 47, 47, 0.65)",
                    borderRadius: 4,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${pesos(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => pesosCorto(v),
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function renderVisitasPorDia(diario) {
    const pm7 = promedioMovil(diario.visitas, 7);

    montarGrafico("gVisitas", {
        type: "bar",
        data: {
            labels: diario.fechas,
            datasets: [
                {
                    type: "line",
                    label: "Promedio móvil 7d",
                    data: pm7,
                    borderColor: "#F57C00",
                    backgroundColor: "rgba(245, 124, 0, 0.14)",
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.3,
                    order: 0
                },
                {
                    label: "Visitas",
                    data: diario.visitas,
                    backgroundColor: "rgba(21, 101, 192, 0.68)",
                    borderRadius: 4,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: { display: false }
            },
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0, font: { size: 10 } }
                }
            }
        }
    });
}

function renderDiaSemana(semana) {
    const promVisitas = DIAS_SEMANA.map((_, i) => {
        const cantDias = (semana.dias && semana.dias[i]) || 0;
        return cantDias > 0 ? Number(((semana.visitas[i] || 0) / cantDias).toFixed(1)) : 0;
    });

    const promIngresos = DIAS_SEMANA.map((_, i) => {
        const cantDias = (semana.dias && semana.dias[i]) || 0;
        return cantDias > 0 ? Math.round((semana.ingresos[i] || 0) / cantDias) : 0;
    });

    // Los 2 días con menor promedio de visitas van en naranja
    const ordenados = promVisitas
        .map((v, idx) => ({ idx, v }))
        .sort((a, b) => a.v - b.v);
    const dosMasBajos = new Set(ordenados.slice(0, 2).map((item) => item.idx));

    const coloresVisitas = DIAS_SEMANA.map((_, idx) =>
        dosMasBajos.has(idx) ? "#F57C00" : "#1565C0"
    );

    montarGrafico("gDiaVisitas", {
        type: "bar",
        data: {
            labels: DIAS_SEMANA,
            datasets: [{
                label: "Visitas promedio",
                data: promVisitas,
                backgroundColor: coloresVisitas,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { font: { size: 10 } } }
            }
        }
    });

    montarGrafico("gDiaIngresos", {
        type: "bar",
        data: {
            labels: DIAS_SEMANA,
            datasets: [{
                label: "Ingreso promedio",
                data: promIngresos,
                backgroundColor: "#2E7D32",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${pesos(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => pesosCorto(v),
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function renderHeatmap(heatmap) {
    const wrap = document.getElementById("heatmap");
    if (!wrap) return;

    const matriz = (heatmap && heatmap.matriz) || [];
    const diasPorSemana = (heatmap && heatmap.diasPorSemana) || [];

    const promedios = matriz.map((horas, wd) => {
        const div = diasPorSemana[wd] || 0;
        return (horas || []).map((tot) => (div > 0 ? tot / div : 0));
    });

    let maxVal = 0;
    promedios.forEach((fila) => {
        fila.forEach((v) => {
            if (v > maxVal) maxVal = v;
        });
    });

    let html = '<table class="heat"><thead><tr><th class="dia">Día / Hora</th>';
    for (let h = 0; h < 24; h++) {
        html += `<th>${String(h).padStart(2, "0")}</th>`;
    }
    html += "</tr></thead><tbody>";

    for (let wd = 0; wd < 7; wd++) {
        html += `<tr><th class="dia">${DIAS_SEMANA[wd]}</th>`;
        for (let h = 0; h < 24; h++) {
            const val = (promedios[wd] && promedios[wd][h]) || 0;
            const ratio = maxVal > 0 ? val / maxVal : 0;
            const alpha = (0.06 + ratio * 0.84).toFixed(2);
            const colorTexto = ratio > 0.52 ? "#FFFFFF" : "#222222";
            const texto = val > 0 ? val.toFixed(1) : "·";
            html += `<td style="background:rgba(21,101,192,${alpha});color:${colorTexto};" title="${DIAS_SEMANA[wd]} ${String(h).padStart(2, "0")}:00 — Promedio: ${val.toFixed(2)}">${texto}</td>`;
        }
        html += "</tr>";
    }

    html += "</tbody></table>";
    wrap.innerHTML = html;
}

function renderSemanal(semanal) {
    montarGrafico("gSemanal", {
        type: "bar",
        data: {
            labels: semanal.semanas,
            datasets: [
                {
                    label: "Primeras visitas",
                    data: semanal.primeras,
                    backgroundColor: "#00838F",
                    borderRadius: 4
                },
                {
                    label: "Clientes recurrentes",
                    data: semanal.recurrentes,
                    backgroundColor: "#3949AB",
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { datalabels: { display: false } },
            scales: {
                x: { stacked: true, ticks: { font: { size: 10 } } },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } }
            }
        }
    });
}

function renderCategorias(categorias) {
    const colores = [
        "#1565C0", "#2E7D32", "#F57C00", "#6A1B9A",
        "#00838F", "#D32F2F", "#FBC02D", "#546E7A", "#6D4C41"
    ];

    montarGrafico("gCategorias", {
        type: "doughnut",
        data: {
            labels: categorias.labels,
            datasets: [{
                data: categorias.data,
                backgroundColor: categorias.labels.map((_, i) => colores[i % colores.length])
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${pesos(ctx.parsed)}`
                    }
                }
            }
        }
    });
}

function renderEstacionalidad(estacionalidad) {
    const aniosMap = (estacionalidad && estacionalidad.anios) || {};
    const anios = Object.keys(aniosMap).sort();
    const colores = ["#90A4AE", "#1565C0", "#F57C00", "#2E7D32"];

    const datasets = anios.map((anio, idx) => ({
        label: anio,
        data: aniosMap[anio],
        borderColor: colores[idx % colores.length],
        backgroundColor: colores[idx % colores.length],
        borderWidth: 2.5,
        tension: 0.25,
        spanGaps: false
    }));

    montarGrafico("gEstacionalidad", {
        type: "line",
        data: {
            labels: MESES,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { datalabels: { display: false } },
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } }
            }
        }
    });
}

function renderRiesgo(riesgo) {
    montarGrafico("gRiesgo", {
        type: "bar",
        data: {
            labels: riesgo.labels,
            datasets: [{
                label: "Clientes",
                data: riesgo.data,
                backgroundColor: [
                    "#2E7D32",
                    "#7CB342",
                    "#FBC02D",
                    "#F57C00",
                    "#D32F2F",
                    "#5D4037"
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                x: { ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } }
            }
        }
    });
}

/******************************************************
 * Carga y eventos
 ******************************************************/

async function cargarDashboardAnalitico() {
    mostrarCargando(true);
    mostrarErrorAnalitico("");

    try {
        const { desde, hasta } = calcularRangoAnalitico();
        const res = await llamarAPIAnalitico("obtenerAnalitico", { desde, hasta });

        if (!res || !res.ok || !res.data) {
            throw new Error((res && res.error) || "No se pudieron cargar los datos analíticos.");
        }

        const d = res.data;
        actualizarLecturaYNotas(d);
        renderIngresosPorDia(d.diario || {});
        renderVisitasPorDia(d.diario || {});
        renderDiaSemana(d.semana || {});
        renderHeatmap(d.heatmap || {});
        renderSemanal(d.semanal || {});
        renderCategorias(d.categorias || { labels: [], data: [] });
        renderEstacionalidad(d.estacionalidad || { anios: {} });
        renderRiesgo(d.riesgo || { labels: [], data: [] });
    } catch (err) {
        console.error("Error en dashboard analítico:", err);
        mostrarErrorAnalitico(err.message || "Error al cargar el dashboard analítico.");
    } finally {
        mostrarCargando(false);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const filtroRango = document.getElementById("filtroRango");
    const grupoPersonalizado = document.getElementById("grupoPersonalizado");
    const fechaDesde = document.getElementById("fechaDesde");
    const fechaHasta = document.getElementById("fechaHasta");
    const btnActualizar = document.getElementById("btnActualizar");

    if (filtroRango) {
        filtroRango.addEventListener("change", () => {
            const esPersonalizado = filtroRango.value === "personalizado";
            if (grupoPersonalizado) {
                grupoPersonalizado.style.display = esPersonalizado ? "flex" : "none";
            }
            if (!esPersonalizado) {
                cargarDashboardAnalitico();
            }
        });
    }

    if (fechaDesde) {
        fechaDesde.addEventListener("change", () => {
            if (filtroRango && filtroRango.value === "personalizado") {
                cargarDashboardAnalitico();
            }
        });
    }

    if (fechaHasta) {
        fechaHasta.addEventListener("change", () => {
            if (filtroRango && filtroRango.value === "personalizado") {
                cargarDashboardAnalitico();
            }
        });
    }

    if (btnActualizar) {
        btnActualizar.addEventListener("click", cargarDashboardAnalitico);
    }

    cargarDashboardAnalitico();
});
