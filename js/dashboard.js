/******************************************************
 * IRONWALL ERP
 * Dashboard JavaScript
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
let chartServicios = null;
let chartFrecuencia = null;
let chartTopUnidades = null;
let chartTopVentas = null;

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
 * Formato moneda
 ******************************************************/

function pesos(valor) {
    return "$" + Number(valor).toLocaleString("es-CL", {
        maximumFractionDigits: 0
    });
}

/******************************************************
 * Actualizar fecha superior
 ******************************************************/

function actualizarFecha() {
    document.getElementById("fechaActual").innerHTML =
        new Date().toLocaleString("es-CL");
}

/******************************************************
 * Cargar Dashboard
 ******************************************************/

async function cargarDashboard() {
    actualizarFecha();
    const res = await llamarAPI(
        "obtenerDashboard",
        {
            periodoFrecuencia: document.getElementById("filtroFrecuencia").value
        }
    );

    if (!res.ok) {
        alert(res.error);
        return;
    }
    const d = res.data;
    actualizarKPIs(d.kpis);
    actualizarTablas(d);
    actualizarGraficos(d);
    actualizarRankingProductos();
    document.getElementById("ultimaActualizacion").innerHTML =
        new Date().toLocaleTimeString("es-CL");
}

/******************************************************
 * Actualizar KPIs
 ******************************************************/

function actualizarKPIs(k) {
    document.getElementById("ventasMes").innerHTML = pesos(k.ingresosMes);
    document.getElementById("clientesMes").innerHTML = k.clientesMes;
    document.getElementById("ticketPromedio").innerHTML = pesos(k.ticketPromedio);
    document.getElementById("bajoStock").innerHTML = k.bajoStock;
    document.getElementById("incidentes").innerHTML = k.incidentes;
    document.getElementById("valorInventario").innerHTML = pesos(k.valorInventario);

    const selector = document.getElementById("filtroFrecuencia");
    if (selector) {
        const textoPeriodo = selector.options[selector.selectedIndex].text;
        document.getElementById("periodoRecurrentes").innerHTML =
            "2+ visitas · " + textoPeriodo;
    }
}

/******************************************************
 * Tablas
 ******************************************************/

function actualizarTablaStock(lista) {
    const tbody = document.querySelector("#tablaStock tbody");
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

function actualizarTablaIncidentes(lista) {
    const tbody = document.querySelector("#tablaIncidentes tbody");
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

/******************************************************
 * Ventas
 ******************************************************/

function crearGraficoVentas(data) {
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
                    datalabels: {
                        display: false // <- Desactiva los números fijos sobre la línea
                    }
                }
            }
        }
    );
}

/******************************************************
 * Clientes
 ******************************************************/

function crearGraficoClientes(data) {
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
                    datalabels: {
                        display: false // <- Desactiva los números fijos sobre la línea
                    }
                }
            }
        }
    );
}

/******************************************************
 * Finanzas — Ingresos vs Egresos (Últimos 6 meses)
 ******************************************************/

function crearGraficoFinanzas(data) {
    if (chartFinanzas) chartFinanzas.destroy();

    chartFinanzas = new Chart(
        document.getElementById("graficoFinanzas"),
        {
            type: "line",
            data: {
                labels: data.labels, // Arreglo con los 6 meses (ej: ["Mar", "Abr", "May", "Jun", "Jul", "Ago"])
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
                        position: "top"
                    },
                    datalabels: {
                        display: false // Mantiene la gráfica limpia sin números superpuestos
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return pesos(value); // Formato en pesos ($100.000)
                            }
                        }
                    }
                }
            }
        }
    );
}

/******************************************************
 * Metodos de pago
 ******************************************************/
function crearGraficoPago(data) {
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
                        position: "top"
                    },
                    datalabels: {
                        color: "#FFFFFF",
                        font: {
                            weight: "bold",
                            size: 14
                        },
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

/******************************************************
 * Frecuencia
 ******************************************************/

function crearGraficoFrecuencia(data) {
    if (chartFrecuencia) chartFrecuencia.destroy();
    
    const valores = data.datasets[0].data;

    // Métricas para el KPI de recurrentes
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

    const selector = document.getElementById("filtroFrecuencia");
    if (selector) {
        const textoPeriodo = selector.options[selector.selectedIndex].text;
        document.getElementById("periodoRecurrentes").innerHTML = "2+ visitas · " + textoPeriodo;
    }

    // Creación del gráfico
    chartFrecuencia = new Chart(
        document.getElementById("graficoFrecuencia"),
        {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Clientes",
                    data: valores,
                    backgroundColor: "#F57C00", // Color anaranjado
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 45 // Margen para asegurar que las etiquetas no se corten
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: "#E65100",
                        font: {
                            weight: "bold",
                            size: 11
                        },
                        formatter: function (value) {
                            return value.toLocaleString("es-CL");
                        }
                    }
                },
                scales: {
                    x: {
                        display: false // Se oculta el eje horizontal saturado
                    },
                    y: {
                        ticks: {
                            font: { size: 11 },
                            autoSkip: false
                        }
                    }
                }
            }
        }
    );
}

/******************************************************
 * Peticiones de Filtro
 ******************************************************/

async function actualizarGraficoFrecuencia() {
    const periodo = document.getElementById("filtroFrecuencia").value;
    const res = await llamarAPI("obtenerFrecuenciaClientes", { periodo: periodo });
    if (!res.ok) {
        alert(res.error);
        return;
    }
    crearGraficoFrecuencia(res.data);
}

async function actualizarRankingProductos() {
    const periodo = document.getElementById("filtroProductos").value;
    const res = await llamarAPI("obtenerRankingProductos", { periodo: periodo });

    if (!res.ok) {
        alert(res.error);
        return;
    }

    crearGraficoTopUnidades(res.data.unidades);
    crearGraficoTopVentas(res.data.ventas);
}

/******************************************************
 * Ranking Top 10 — Unidades
 ******************************************************/

function crearGraficoTopUnidades(data) {
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
                layout: {
                    padding: {
                        right: 45 // Margen para la etiqueta numérica exterior
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: "#333333",
                        font: {
                            weight: "bold",
                            size: 11
                        },
                        formatter: function (value) {
                            return value.toLocaleString("es-CL");
                        }
                    }
                },
                scales: {
                    x: {
                        display: false // Ocultar eje horizontal saturado
                    },
                    y: {
                        ticks: {
                            font: { size: 11 },
                            autoSkip: false
                        }
                    }
                }
            }
        }
    );
}

/******************************************************
 * Ranking Top 10 — Ventas Totales ($)
 ******************************************************/

function crearGraficoTopVentas(data) {
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
                layout: {
                    padding: {
                        right: 75 // Espacio suficiente para no cortar precios de varios dígitos
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: "#2E7D32",
                        font: {
                            weight: "bold",
                            size: 11
                        },
                        formatter: function (value) {
                            return pesos(value); // Muestra el valor formateado ($100.000) al extremo
                        }
                    }
                },
                scales: {
                    x: {
                        display: false // Desactiva el eje X inferior
                    },
                    y: {
                        ticks: {
                            font: { size: 11 },
                            autoSkip: false
                        }
                    }
                }
            }
        }
    );
}

/******************************************************
 * Eventos e Inicialización
 ******************************************************/

document.getElementById("btnActualizar").addEventListener("click", cargarDashboard);

window.onload = function () {
    document.getElementById("filtroFrecuencia").addEventListener("change", actualizarGraficoFrecuencia);
    document.getElementById("filtroProductos").addEventListener("change", actualizarRankingProductos);
    
    cargarDashboard();
};
