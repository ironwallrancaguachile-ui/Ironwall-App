/******************************************************
 * IRONWALL ERP
 * Dashboard
 ******************************************************/

const API = CONFIG.API.DASHBOARD;

let chartVentas = null;
let chartClientes = null;
let chartFinanzas = null;
let chartPago = null;
let chartServicios = null;
/**let chartIncidentes = null;**/
let chartFrecuencia = null;

/******************************************************
 * Llamada al Apps Script
 ******************************************************/

async function llamarAPI(action,payload={}){
    const respuesta = await fetch(API,{

        method:"POST",
        headers:{
            "Content-Type":"text/plain;charset=utf-8"
        },
        body:JSON.stringify({
            action:action,
            payload:payload
        })

    });

    const texto = await respuesta.text();
    return JSON.parse(texto);
}

/******************************************************
 * Formato moneda
 ******************************************************/

function pesos(valor){

    return "$"+Number(valor).toLocaleString("es-CL",{
      maximumFractionDigits: 0
    });

}

/******************************************************
 * Actualizar fecha superior
 ******************************************************/

function actualizarFecha(){
    document.getElementById("fechaActual").innerHTML=
        new Date().toLocaleString("es-CL");
}

/******************************************************
 * Cargar Dashboard
 ******************************************************/

async function cargarDashboard(){
    actualizarFecha();
    const res = await llamarAPI(
        "obtenerDashboard",
        {
            periodoFrecuencia:
                document.getElementById("filtroFrecuencia").value
        }
    );

    if(!res.ok){
        alert(res.error);
        return;
    }
    const d = res.data;
    console.log("DASHBOARD COMPLETO:", d);
    console.log("FRECUENCIA RECIBIDA:", d.frecuencia);
    
    actualizarKPIs(d.kpis);
    actualizarTablas(d);
    actualizarGraficos(d);
    document.getElementById("ultimaActualizacion").innerHTML =
        new Date().toLocaleTimeString("es-CL");
}

/******************************************************
 * Actualizar KPIs
 ******************************************************/

function actualizarKPIs(k){

    document.getElementById("ventasMes").innerHTML =
        pesos(k.ingresosMes);

    document.getElementById("clientesMes").innerHTML =
        k.clientesMes;

    document.getElementById("ticketPromedio").innerHTML =
        pesos(k.ticketPromedio);

    document.getElementById("bajoStock").innerHTML =
        k.bajoStock;

    document.getElementById("incidentes").innerHTML =
        k.incidentes;

    document.getElementById("valorInventario").innerHTML =
        pesos(k.valorInventario);


    /******************************************************
     * CLIENTES RECURRENTES
     ******************************************************/

   /**** const porcentaje =
        Number(k.clientesRecurrentes) || 0;

    document.getElementById(
        "clientesRecurrentes"
    ).innerHTML =
        porcentaje.toFixed(1) + "%";***/


    /******************************************************
     * PERÍODO DEL KPI
     ******************************************************/

    const selector =
        document.getElementById("filtroFrecuencia");

    if(selector){

        const textoPeriodo =
            selector.options[
                selector.selectedIndex
            ].text;

        document.getElementById(
            "periodoRecurrentes"
        ).innerHTML =
            "2+ visitas · " + textoPeriodo;

    }

}

/******************************************************
 * Tabla Bajo Stock
 ******************************************************/

function actualizarTablaStock(lista){
    const tbody = document.querySelector("#tablaStock tbody");
    tbody.innerHTML="";
    lista.forEach(function(p){
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

/******************************************************
 * Tabla Incidentes
 ******************************************************/

function actualizarTablaIncidentes(lista){
    const tbody=document.querySelector("#tablaIncidentes tbody");
    tbody.innerHTML="";
    lista.forEach(function(i){
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

/******************************************************
 * Actualizar ambas tablas
 ******************************************************/

function actualizarTablas(data){
    actualizarTablaStock(
        data.stockCritico
    );
    actualizarTablaIncidentes(
        data.ultimosIncidentes
    );
}

/******************************************************
 * Graficos
 ******************************************************/

function actualizarGraficos(data){
    crearGraficoVentas(data.ventas);
    crearGraficoClientes(data.clientes);
    crearGraficoFinanzas(data.finanzas);
    crearGraficoPago(data.metodosPago);
    /***crearGraficoServicios(data.servicios);
    crearGraficoIncidentes(data.incidentesGrafico);***/
    crearGraficoFrecuencia(data.frecuencia);
}

/******************************************************
 * Ventas
 ******************************************************/

function crearGraficoVentas(data){
    if(chartVentas) chartVentas.destroy();
    chartVentas = new Chart(
        document.getElementById("graficoVentas"),
        {
            type:"line",
            data:{
                labels:data.labels,
                datasets:[
                    {

                        label:data.datasets[0].label,
                        data:data.datasets[0].data,
                        borderColor:"#1565C0",
                        backgroundColor:"rgba(21,101,192,0.15)",
                        borderWidth:3,
                        tension:0.3,
                        fill:true
                    }
                ]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false
            }
        }
    );
}

/******************************************************
 * Clientes
 ******************************************************/

function crearGraficoClientes(data){
    if(chartClientes) chartClientes.destroy();
    chartClientes = new Chart(
        document.getElementById("graficoClientes"),
        {
            type:"line",
            data:{
                labels:data.labels,
                datasets:[
                    {
                        label:"Clientes",
                        data:data.datasets[0].data,
                        borderColor:"#2E7D32",
                        backgroundColor:"rgba(46,125,50,0.15)",
                        borderWidth:3,
                        tension:0.3,
                        fill:true
                    }
                ]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false
            }
        }
    );
}

/******************************************************
 * Finanzas
 ******************************************************/

function crearGraficoFinanzas(data){
    if(chartFinanzas) chartFinanzas.destroy();
    chartFinanzas = new Chart(
        document.getElementById("graficoFinanzas"),
        {
          type:"bar",
            data:{
                labels:data.labels,
                datasets:[
                    {
                        label:"Ingresos",
                        data:data.datasets[0].data,
                        backgroundColor:"#2E7D32"
                    },
                    {
                        label:"Egresos",
                        data:data.datasets[1].data,
                        backgroundColor:"#D32F2F"
                    }
                ]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{
                        position:"top"
                    }
                }
            }
        }
    );
}

/******************************************************
 * Métodos Pago
 ******************************************************/

function crearGraficoPago(data) {
    if (chartPago) chartPago.destroy();

    chartPago = new Chart(
        document.getElementById("graficoPago"),
        {
            type: "pie",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        data: data.datasets[0].data,
                        backgroundColor: [
                            "#1565C0",
                            "#2E7D32",
                            "#F57C00",
                            "#6A1B9A",
                            "#546E7A"
                        ]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { // Aquí va la CONFIGURACIÓN de los plugins
                    legend: {
                        position: "top"
                    },
                    datalabels: {
                        color: "#FFFFFF",
                        font: {
                            weight: "bold",
                            size: 14
                        },
                        formatter: function(value, ctx) {
                            let total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let porcentaje = ((value / total) * 100).toFixed(1);
                            return porcentaje + "%";
                        }
                    }
                }
            }, // <- Coma para separar las opciones de la lista de plugins activos
            plugins: [ChartDataLabels] // <- REGISTRO del plugin a nivel de raíz del gráfico
        }
    );
}       
        
/******************************************************
 * Servicios
 ******************************************************/

function crearGraficoServicios(data){
    if(chartServicios) chartServicios.destroy();
    chartServicios = new Chart(
        document.getElementById("graficoServicios"),
        {
            type:"bar",
            data:{
                labels:data.labels,
                datasets:[
                    {
                        label:"Ventas",
                        data:data.datasets[0].data,
                        backgroundColor:"#0057B8"
                    }
                ]
            },
            options:{
                indexAxis:"y",
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{
                        display:false
                    }
                }
            }
        }
    );
}

/******************************************************
 * Incidentes
 ******************************************************/

function crearGraficoIncidentes(data){
    if(chartIncidentes) chartIncidentes.destroy();
    chartIncidentes = new Chart(
        document.getElementById("graficoIncidentes"),
        {
            type:"doughnut",
            data:{
                labels:data.labels,
                datasets:[
                    {
                        label:"Incidentes",
                        data:data.datasets[0].data,
                        backgroundColor:[
                            "#2E7D32",
                            "#F57C00",
                            "#D32F2F",
                            "#1565C0"
                        ]
                    }
                ]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{
                        position:"top"
                    },
                    datalabels: {
                        color: "#FFFFFF",
                        font: {
                            weight: "bold",
                            size: 14
                        },
                        formatter: function(value, ctx) {
                            let total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let porcentaje = ((value / total) * 100).toFixed(1);
                            return porcentaje + "%";
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        }
    );
}

/******************************************************
 * Gráfico frecuencia clientes
 ******************************************************/

function crearGraficoFrecuencia(data){
    if(chartFrecuencia)
        chartFrecuencia.destroy();
    const valores = data.datasets[0].data;

    // Clientes por categoría
    const unVisita = Number(valores[0]) || 0;
    const dosTres = Number(valores[1]) || 0;
    const cuatroCinco = Number(valores[2]) || 0;
    const seisMas = Number(valores[3]) || 0;

    // Total de clientes
    const totalClientes =
        unVisita +
        dosTres +
        cuatroCinco +
        seisMas;

    // Clientes recurrentes = 2 o más visitas
    const recurrentes =
        dosTres +
        cuatroCinco +
        seisMas;

    // Calcular porcentaje
    let porcentaje = 0;
    if(totalClientes > 0){
        porcentaje =
            (recurrentes / totalClientes) * 100;
    }

    // Actualizar KPI
    document.getElementById(
        "clientesRecurrentes"
    ).innerHTML =
        porcentaje.toFixed(1) + "%";
    
    // Actualizar período mostrado
    const selector =
        document.getElementById("filtroFrecuencia");
    
    const textoPeriodo =
        selector.options[selector.selectedIndex].text;
    
    document.getElementById(
        "periodoRecurrentes"
    ).innerHTML =
        "2+ visitas · " + textoPeriodo;

    // Crear gráfico
    chartFrecuencia = new Chart(
        document.getElementById("graficoFrecuencia"),
        {
            type:"bar",
            data:{
                labels:data.labels,
                datasets:[
                    {
                        label:"Clientes",
                        data:valores,
                        backgroundColor:"#1565C0"
                    }
                ]
            },
            options:{
                indexAxis:"y",
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{
                        display:false
                    }
                },
                scales:{
                    x:{
                        beginAtZero:true,
                        ticks:{
                            precision:0
                        }
                    }
                }
            }
        }
    );
}

/******************************************************
 * Botones
 ******************************************************/

document

.getElementById("btnActualizar")
.addEventListener(
    "click",
    cargarDashboard
);

/**document
.getElementById("btnMenu")
.addEventListener(
    "click",
    ()=>{
        location.href="menu.html";
    }
);**/

/******************************************************
 * Inicio
 ******************************************************/

window.onload = function(){
    document
        .getElementById("filtroFrecuencia")
        .addEventListener(
            "change",
            actualizarGraficoFrecuencia
        );
    cargarDashboard();
};

/******************************************************
 * Auto Refresh
 ******************************************************/

setInterval(

    cargarDashboard,

    60000

);

/******************************************************
 * Actualizar SOLO frecuencia de clientes
 ******************************************************/

async function actualizarGraficoFrecuencia(){
    const periodo = document
        .getElementById("filtroFrecuencia")
        .value;

    const res = await llamarAPI(
        "obtenerFrecuenciaClientes",
        {
            periodo: periodo
        }
    );
    if(!res.ok){
        alert(res.error);
        return;
    }
    crearGraficoFrecuencia(res.data);
}
