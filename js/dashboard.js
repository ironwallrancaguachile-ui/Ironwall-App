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
let chartIncidentes = null;
let chartFrecuencia = null;
let periodoFrecuencia = "180";

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

    const periodoFrecuencia = document
        .getElementById("filtroFrecuencia")
        .value;


    const res = await llamarAPI(
        "obtenerDashboard",
        {
            periodoFrecuencia: periodoFrecuencia
        }
    );


    if(!res.ok){
        alert(res.error);
        return;
    }


    const d = res.data;

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

    document.getElementById("clientesHoy").innerHTML =
        k.clientesHoy;
    document.getElementById("checkinsHoy").innerHTML =
        k.checkinsHoy;
    document.getElementById("clientesMes").innerHTML =
        k.clientesMes;
    document.getElementById("clientesAnio").innerHTML =
        k.clientesAnio;
    document.getElementById("clientesNuevos").innerHTML =
        k.clientesNuevos;
    document.getElementById("ingresosHoy").innerHTML =
        pesos(k.ingresosHoy);
    document.getElementById("egresosHoy").innerHTML =
        pesos(k.egresosHoy);
    document.getElementById("resultadoHoy").innerHTML =
        pesos(k.resultadoHoy);
    document.getElementById("ticketPromedio").innerHTML =
        pesos(k.ticketPromedio);
    document.getElementById("bajoStock").innerHTML =
        k.bajoStock;
    document.getElementById("incidentes").innerHTML =
        k.incidentes;
    document.getElementById("valorInventario").innerHTML =
        pesos(k.valorInventario);
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
    crearGraficoServicios(data.servicios);
    crearGraficoIncidentes(data.incidentesGrafico);
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
* Grafico frecuencia clientes
******************************************************/

function crearGraficoFrecuencia(data){

    if(chartFrecuencia) chartFrecuencia.destroy();

    chartFrecuencia = new Chart(
        document.getElementById("graficoFrecuencia"),
        {
            type:"bar",

            data:{
                labels:data.labels,

                datasets:[
                    {
                        label:"Clientes",
                        data:data.datasets[0].data,
                        backgroundColor:"#1565C0"
                    }
                ]
            },

            options:{
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
 * Botones
 ******************************************************/

document

.getElementById("btnActualizar")

.addEventListener(

    "click",

    cargarDashboard

);

document

.getElementById("btnMenu")

.addEventListener(

    "click",

    ()=>{

        location.href="menu.html";

    }

);

/******************************************************
 * Inicio
 ******************************************************/
document
.getElementById("filtroFrecuencia")
.addEventListener("change",function(){

    periodoFrecuencia = this.value;

    cargarDashboard();

});

window.onload=function(){

    cargarDashboard();

}

/******************************************************
 * Auto Refresh
 ******************************************************/

setInterval(

    cargarDashboard,

    60000

);
