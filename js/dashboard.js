/******************************************************
 * IRONWALL ERP
 * Dashboard JavaScript
 * dashboard.js
 ******************************************************/

// Registrar el plugin de Chart.js
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

const API = CONFIG.API.DASHBOARD;

let chartVentas = null;
let chartClientes = null;
let chartFinanzas = null;
let chartPago = null;
let chartFrecuencia = null;
let chartTopUnidades = null;
let chartTopVentas = null;
let chartTopServicios = null;

/******************************************************
 * Llamada al Apps Script
 ******************************************************/

async function llamarAPI(action, payload = {}) {
    const respuesta = await fetch(API, {
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
    return JSON.parse(texto);
}

/******************************************************
 * Formato Moneda
 ******************************************************/

function pesos(valor) {
    return "$" + Number(valor || 0).toLocaleString("es-CL", {
        maximumFractionDigits: 0
    });
}

/******************************************************
 * Fecha Superior
 ******************************************************/

function actualizarFecha() {
    const el = document.getElementById("fechaActual");
    if (el) el.innerHTML = new Date().toLocaleString("es-CL");
}

/******************************************************
 * Cargar Dashboard
 ******************************************************/

async function cargarDashboard() {
    actualizarFecha();
    
    const selectorGlobal = document.getElementById("filtroGlobalPeriodo");
    const periodoGlobal = selectorGlobal ? selectorGlobal.value : "90";

    const res = await llamarAPI("obtenerDashboard", { periodoFrecuencia: periodoGlobal });

    if (!res.ok) {
        alert(res.error);
        return;
    }
    
    const d = res.data;
    actualizarKPIs(d.kpis);
    actualizarTablas(d);
    actualizarGraficos(d);
    
    await actualizarRankingProductos();
    await actualizarGraficoTopServicios();
    
    const elUltima = document.getElementById("ultimaActualizacion");
    if (elUltima) elUltima.innerHTML = new Date().toLocaleTimeString("es-CL");
}

/******************************************************
 * Actualizar KPIs
 ******************************************************/

function actualizarKPIs(k) {
    if (!k) return;
    document.getElementById("ventasMes").innerHTML = pesos(k.ingresosMes);
    document.getElementById("clientesMes").innerHTML = k.clientesMes || 0;
    document.getElementById("ticketPromedio").innerHTML = pesos(k.ticketPromedio);
    document.getElementById("bajoStock").innerHTML = k.bajoStock || 0;
    document.getElementById("incidentes").innerHTML = k.incidentes || 0;
    document.getElementById("valorInventario").innerHTML = pesos(k.valorInventario);

    const selector = document.getElementById("filtroGlobalPeriodo");
    if (selector) {
        const textoPeriodo = selector.options[selector.selectedIndex].text;
        document.getElementById("periodoRecurrentes").innerHTML = "2+ visitas · " + textoPeriodo;
    }
}

/******************************************************
 * Tablas
 ******************************************************/

function actualizarTablaStock(lista = []) {
    const tbody = document.querySelector("#tablaStock tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    lista.forEach(function (p) {
        tbody.innerHTML += `
        <tr>
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.stock}</td>
            <td>${p.minimo}</td>
        </tr>
        `;
    });
}

function actualizarTablaIncidentes(lista = []) {
    const tbody = document.querySelector("#tablaIncidentes tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    lista.forEach(function (i) {
        tbody.innerHTML += `
        <tr>
            <td>${i.fecha}</td>
            <td>${i.cliente}</td>
            <td>${i.gravedad}</td>
            <td>${i.estado}</td>
        </tr>
        `;
    });
}

function actualizarTablas(data) {
    actualizarTablaStock(data.stockCritico);
    actualizarTablaIncidentes(data.ultimosIncidentes);
}

/******************************************************
 * Gráficos Principales
 ******************************************************/

function actualizarGraficos(data) {
    crearGraficoVentas(data.ventas);
    crearGraficoClientes(data.clientes);
    crearGraficoFinanzas(data.finanzas);
    crearGraficoPago(data.metodosPago);
    crearGraficoFrecuencia(data.frecuencia);
}

function crearGraficoVentas(data) {
    if (!data) return;
    if (chartVentas) chartVentas.destroy();
    
    chartVentas = new Chart(
        document.getElementById("graficoVentas"),
        {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.datasets[0].label,
                    data: data.datasets[0].data,
                    borderColor: "#1565C0",
                    backgroundColor: "rgba(21,101,192,0.15)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: { display: false },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        size: 9
                    },
                    y: {
                        size: 9
                    }
                }
            }
        }
    );
}

function crearGraficoClientes(data) {
    if (!data) return;
    if (chartClientes) chartClientes.destroy();
    
    chartClientes = new Chart(
        document.getElementById("graficoClientes"),
        {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Clientes",
                    data: data.datasets[0].data,
                    borderColor: "#2E7D32",
                    backgroundColor: "rgba(46,125,50,0.15)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: { display: false },
                    legend: { display: false }
                }
            }
        }
    );
}

function crearGraficoFinanzas(data) {
    if (!data) return;
    if (chartFinanzas) chartFinanzas.destroy();

    chartFinanzas = new Chart(
        document.getElementById("graficoFinanzas"),
        {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Ingresos",
                        data: data.datasets[0].data,
                        borderColor: "#2E7D32",
                        backgroundColor: "rgba(46, 125, 50, 0.12)",
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: "Egresos",
                        data: data.datasets[1].data,
                        borderColor: "#D32F2F",
                        backgroundColor: "rgba(211, 47, 47, 0.12)",
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { boxWidth: 12, font: { size: 10 } }
                    },
                    datalabels: { display: false }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) { return pesos(value); }
                        }
                    }
                }
            }
        }
    );
}

function crearGraficoPago(data) {
    if (!data) return;
    if (chartPago) chartPago.destroy();

    chartPago = new Chart(
        document.getElementById("graficoPago"),
        {
            type: "pie",
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.datasets[0].data,
                    backgroundColor: [
                        "#1565C0",
                        "#2E7D32",
                        "#F57C00",
                        "#6A1B9A",
                        "#546E7A"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { boxWidth: 12, font: { size: 10 } }
                    },
                    datalabels: {
                        color: "#FFFFFF",
                        font: { weight: "bold", size: 11 },
                        formatter: function (value, ctx) {
                            let total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let porcentaje = ((value / total) * 100).toFixed(1);
                            return porcentaje + "%";
                        }
                    }
                }
            }
        }
    );
}

function crearGraficoFrecuencia(data) {
    if (!data) return;
    if (chartFrecuencia) chartFrecuencia.destroy();
    
    const valores = data.datasets[0].data;

    const unVisita = Number(valores[0]) || 0;
    const dosTres = Number(valores[1]) || 0;
    const cuatroCinco = Number(valores[2]) || 0;
    const seisMas = Number(valores[3]) || 0;

    const totalClientes = unVisita + dosTres + cuatroCinco + seisMas;
    const recurrentes = dosTres + cuatroCinco + seisMas;

    let porcentaje = 0;
    if (totalClientes > 0) {
        porcentaje = (recurrentes / totalClientes) * 100;
    }

    document.getElementById("clientesRecurrentes").innerHTML = porcentaje.toFixed(1) + "%";

    const selector = document.getElementById("filtroGlobalPeriodo");
    if (selector) {
        const textoPeriodo = selector.options[selector.selectedIndex].text;
        document.getElementById("periodoRecurrentes").innerHTML = "2+ visitas · " + textoPeriodo;
    }

    chartFrecuencia = new Chart(
        document.getElementById("graficoFrecuencia"),
        {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Clientes",
                    data: valores,
                    backgroundColor: "#F57C00",
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                layout: { padding: { right: 55 } },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: "#E65100",
                        font: { weight: "bold", size: 11 },
                        formatter: function (value) {
                            return value.toLocaleString("es-CL");
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { ticks: { font: { size: 11 }, autoSkip: false } }
                }
            }
        }
    );
}

/******************************************************
 * Peticiones con Filtro Centralizado
 ******************************************************/

async function actualizarGraficoFrecuencia() {
    const el = document.getElementById("filtroGlobalPeriodo");
    const periodo = el ? el.value : "90";

    const res = await llamarAPI("obtenerFrecuenciaClientes", { periodo: periodo });
    if (!res.ok) { alert(res.error); return; }
    crearGraficoFrecuencia(res.data);
}

async function actualizarRankingProductos() {
    const el = document.getElementById("filtroGlobalPeriodo");
    const periodo = el ? el.value : "90";

    const res = await llamarAPI("obtenerRankingProductos", { periodo: periodo });

    if (!res.ok) { alert(res.error); return; }

    crearGraficoTopUnidades(res.data.unidades);
    crearGraficoTopVentas(res.data.ventas);
}

async function actualizarGraficoTopServicios() {
    const elCriterio = document.getElementById("filtroTopServicios");
    const elPeriodo = document.getElementById("filtroGlobalPeriodo");

    const criterio = elCriterio ? elCriterio.value : "ingresos";
    const periodo = elPeriodo ? elPeriodo.value : "90";

    const res = await llamarAPI("obtenerTopServicios", { 
        criterio: criterio, 
        periodo: periodo 
    });

    if (!res || !res.ok) { 
        console.error("Error al obtener Top Servicios:", res ? res.error : "Sin respuesta"); 
        return; 
    }

    crearGraficoTopServicios(res.data, criterio);
}

/******************************************************
 * Rankings Top 10
 ******************************************************/

function crearGraficoTopUnidades(data) {
    if (!data) return;
    if (chartTopUnidades) chartTopUnidades.destroy();

    chartTopUnidades = new Chart(
        document.getElementById("graficoTopUnidades"),
        {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Unidades vendidas",
                    data: data.datasets[0].data,
                    backgroundColor: "#1565C0",
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                layout: { padding: { right: 55 } },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: "#333333",
                        font: { weight: "bold", size: 11 },
                        formatter: function (value) {
                            return value.toLocaleString("es-CL");
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { ticks: { font: { size: 11 }, autoSkip: false } }
                }
            }
        }
    );
}

function crearGraficoTopVentas(data) {
    if (!data) return;
    if (chartTopVentas) chartTopVentas.destroy();

    chartTopVentas = new Chart(
        document.getElementById("graficoTopVentas"),
        {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Venta total",
                    data: data.datasets[0].data,
                    backgroundColor: "#2E7D32",
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                layout: { padding: { right: 55 } },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: "#2E7D32",
                        font: { weight: "bold", size: 11 },
                        formatter: function (value) {
                            return pesos(value);
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { ticks: { font: { size: 11 }, autoSkip: false } }
                }
            }
        }
    );
}

function crearGraficoTopServicios(data, criterio) {
    if (!data) return;

    if (chartTopServicios) {
        chartTopServicios.destroy();
    }

    const esIngresos = (criterio === "ingresos");
    const colorVioleta = "#6A1B9A";

    const labels = data.labels || [];
    const datasetData = data.datasets?.[0]?.data || [];
    const datasetLabel = data.datasets?.[0]?.label || (esIngresos ? "Ingresos ($)" : "Pases vendidos");

    chartTopServicios = new Chart(
        document.getElementById("graficoTopServicios"),
        {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: datasetData,
                    backgroundColor: colorVioleta,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
                layout: { padding: { right: 55 } },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: colorVioleta,
                        font: { weight: "bold", size: 11 },
                        formatter: function (value) {
                            return esIngresos ? pesos(value) : Number(value).toLocaleString("es-CL");
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { ticks: { font: { size: 11 }, autoSkip: false } }
                }
            }
        }
    );
}

/******************************************************
 * Eventos e Inicialización
 ******************************************************/

const btnActualizar = document.getElementById("btnActualizar");
if (btnActualizar) {
    btnActualizar.addEventListener("click", cargarDashboard);
}

window.onload = function () {
    const filtroGlobal = document.getElementById("filtroGlobalPeriodo");
    const filtroServicios = document.getElementById("filtroTopServicios");

    if (filtroGlobal) {
        filtroGlobal.addEventListener("change", function () {
            actualizarGraficoFrecuencia();
            actualizarRankingProductos();
            actualizarGraficoTopServicios();
        });
    }

    if (filtroServicios) {
        filtroServicios.addEventListener("change", actualizarGraficoTopServicios);
    }

    cargarDashboard();
};
