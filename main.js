// main.js

document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://techo-verde-api-2.onrender.com";

  // DOM Elements
  const sensorLabel = document.getElementById("sensorLabel");
  const sensorSelect = document.getElementById("sensorSelect");
  const tableBody = document.getElementById("sensorTableBody");
  const chartCanvas = document.getElementById("sensorChart")?.getContext("2d");
  const compareChartCanvas = document.getElementById("compareChart")?.getContext("2d");
  const downloadButton = document.getElementById("downloadBtn");
  const resumenContainer = document.getElementById("resumenContainer");

  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", () => {
      sideMenu.classList.toggle("hidden");
    });
  }

  let chart;
  let compareChart;


function showSection(sectionId) {
  const sections = ["resumenPanel", "mainPanel", "historyPanel"];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const target = document.getElementById(sectionId);
  if (target) target.classList.remove("hidden");

  // Ejecutar comparativa solo si se entra a ese panel
  if (sectionId === "mainPanel"){
    updateSensor("Sensor1");
  } else if (sectionId === "historyPanel"){
    initComparativa();
  }

  if (sideMenu) sideMenu.classList.add("hidden");
}
 

  window.showSection = showSection;

  async function fetchSensorData(sensorId) {
    try {
      const response = await fetch(`${apiUrl}/sensor/${sensorId}`);
      const json = await response.json();
      return json.datos.reverse();
    } catch (err) {
      console.error("Error al obtener datos:", err);
      return [];
    }
  }

  async function fetchAllSensors() {
    try {
      const response = await fetch(`${apiUrl}/sensores`);
      return await response.json();
    } catch (err) {
      console.error("Error al obtener sensores:", err);
      return [];
    }
  }

  async function fetchExtras() {
    try {
      const response = await fetch(`${apiUrl}/extras`);
      return await response.json();
    } catch (err) {
      console.error("Error al obtener extras:", err);
      return {};
    }
  }

  function updateTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    data.forEach(({ timestamp, valor }) => {
      const row = `<tr><td class='border px-4 py-2'>${timestamp}</td><td class='border px-4 py-2'>${valor}</td></tr>`;
      tableBody.innerHTML += row;
    });
  }

  function updateChart(data, sensorId) {
    if (!chartCanvas) return;

    const datosOrdenCronologico = [...data].reverse();

    const timestamps = datosOrdenCronologico.map(d => d.timestamp);
    const valores = datosOrdenCronologico.map(d => parseFloat(d.valor));

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: `Sensor ${sensorId}`,
          data: valores,
          borderColor: "#22c55e",
          tension: 0.3,
          pointRadius: 3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Tiempo" } },
          y: { title: { display: true, text: "Temperatura" }, beginAtZero: true }
        }
      }
    });
  }

  async function updateSensor(sensorId) {
    if (sensorLabel) {
      sensorLabel.textContent = sensorId.replace("Sensor", "S");
    }
    const data = await fetchSensorData(sensorId);
    updateTable(data);
    updateChart(data, sensorId);
  }

  function initSensorSelect() {
    for (let i = 1; i <= 8; i++) {
      const option = document.createElement("option");
      option.value = `Sensor${i}`;
      option.textContent = `Sensor ${i}`;
      sensorSelect.appendChild(option);
    }
    sensorSelect.addEventListener("change", (e) => {
      updateSensor(e.target.value);
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      if (!compareChart) return;
      const link = document.createElement("a");
      link.href = compareChart.toBase64Image();
      link.download = "grafica_comparativa.png";
      link.click();
    });
  }

  async function initComparativa() {
    if (!compareChartCanvas) {
      console.warn("Canvas de comparativa no encontrado.");
      return;
    }

    try {
      const sensores = await fetchAllSensors();
      const colores = ['#22c55e', '#3b82f6', '#f97316', '#ec4899', '#a855f7', '#14b8a6', '#f59e0b', '#ef4444'];

      if (!sensores || sensores.length === 0) {
        console.warn("No hay sensores disponibles.");
        return;
     }

      const etiquetas = sensores[0]?.datos.map(d => d.timestamp) || [];

      const datasets = sensores.map((sensor, i) => ({
        label: sensor.sensor,
        data: sensor.datos.map(d => parseFloat(d.valor)),
        borderColor: colores[i % colores.length],
        tension: 0.3,
        pointRadius: 2,
        fill: false,
        hidden: !(i === 0 || i === 7)  // Muestra solo sensor 1 y 8 al inicio
      }));

      if (compareChart) compareChart.destroy();

      compareChart = new Chart(compareChartCanvas, {
        type: 'line',
        data: {
          labels: etiquetas,
          datasets: datasets
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Tiempo' }
            },
            y: {
              title: { display: true, text: 'Valor' },
              beginAtZero: false
            }
          }
        }
      });
    } catch (err) {
      console.error("Error en initComparativa:", err);
    }
  }



//   async function renderComparativeChart() {
//     const ctx = document.getElementById("compareChart")?.getContext("2d");
//     if (!ctx) {
//       console.warn("⚠️ No se encontró el canvas de la comparativa.");
//       return;
//     }

//     const sensores = await fetchAllSensors();
//     const datasets = [];
//     let labels = [];

//   sensores.forEach((sensor, index) => {
//     const color = `hsl(${(index * 360) / sensores.length}, 70%, 50%)`;

//     const timestamps = sensor.datos.map(d => d.timestamp);
//     const valores = sensor.datos.map(d => parseFloat(d.valor));

//     if (timestamps.length > labels.length) {
//       labels = timestamps;
//     }

//     datasets.push({
//       label: sensor.sensor,
//       data: valores,
//       borderColor: color,
//       backgroundColor: color,
//       fill: false,
//       tension: 0.2
//     });
//   });

//   if (compareChart) {
//     compareChart.destroy();
//   }

//   compareChart = new chart(ctx, {
//     type: "line",
//     data: {
//       labels,
//       datasets
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         legend: {
//           display: true
//         }
//       },
//       scales: {
//         x: {
//           title: {
//             display: true,
//             text: "Tiempo"
//           }
//         },
//         y: {
//           title: {
//             display: true,
//             text: "Temperatura"
//           },
//           beginAtZero: true
//         }
//       }
//     }
//   });
// }

async function initResumenPanel() {
    const sensores = await fetchAllSensors();
    const extras = await fetchExtras();

    const ultimoValorSensor = {};
    sensores.forEach(sensor => {
      const datos = sensor.datos;
      const ultimo = datos[datos.length - 1];
      if (ultimo) {
        ultimoValorSensor[sensor.sensor] = {
          valor: ultimo.valor,
          timestamp: ultimo.timestamp
        };
      }
    });

    let html = `
      <h2 class="text-xl font-bold mb-4 text-center">Resumen de Sensores</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white shadow-md rounded">
          <thead class="bg-gray-200">
            <tr>
              <th class="border px-4 py-2">Sensor</th>
              <th class="border px-4 py-2">Valor</th>
              <th class="border px-4 py-2">Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
    `;
    for (let sensor in ultimoValorSensor) {
      const s = ultimoValorSensor[sensor];
      html += `
        <tr>
          <td class="border px-4 py-2">${sensor}</td>
          <td class="border px-4 py-2">${s.valor ?? "--"}</td>
          <td class="border px-4 py-2">${s.timestamp ?? "--"}</td>
        </tr>
      `;
    }
    html += `</tbody></table></div>`;

    html += `
      <h2 class="text-xl font-bold mt-8 mb-4 text-center">Estado del Sistema</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="bg-white p-4 rounded shadow">
          <div class="text-sm text-gray-500">Voltaje Panel</div>
          <div class="text-xl">${extras.voltajePanel ?? "--"} V</div>
        </div>
        <div class="bg-white p-4 rounded shadow">
          <div class="text-sm text-gray-500">Voltaje Batería</div>
          <div class="text-xl">${extras.voltajeBateria ?? "--"} V</div>
        </div>
        <div class="bg-white p-4 rounded shadow">
          <div class="text-sm text-gray-500">% Batería</div>
          <div class="text-xl">${extras.porcentajeBateria ?? "--"}%</div>
        </div>
        <div class="bg-white p-4 rounded shadow">
          <div class="text-sm text-gray-500">% Panel Solar</div>
          <div class="text-xl">${extras.porcentajePanel ?? "--"}%</div>
        </div>
      </div>
    `;

    if (resumenContainer) resumenContainer.innerHTML = html;
  }


  // Inicialización general
  initSensorSelect();
  initResumenPanel();
  showSection("resumenPanel");
});
