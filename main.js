// main.js

document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://techo-verde-api-2.onrender.com";

  // DOM Elements
  const sensorLabel = document.getElementById("sensorLabel");
  const sensorSelect = document.getElementById("sensorSelect");
  const tableBody = document.getElementById("sensorTableBody");
  const chartCanvas = document.getElementById("sensorChart")?.getContext("2d");
  const downloadButton = document.getElementById("downloadGraph");
  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  const resumenContainer = document.getElementById("resumenPanel");

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", () => {
      sideMenu.classList.toggle("hidden");
    });
  }

  let chart;

  initSensorSelect();
  updateSensor("Sensor1");
  cargarResumen();

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
    const timestamps = data.map(d => d.timestamp);
    const valores = data.map(d => parseFloat(d.valor));

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
          y: { title: { display: true, text: "Valor" }, beginAtZero: true }
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

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      if (!chart) return;
      const link = document.createElement("a");
      link.href = chart.toBase64Image();
      link.download = "grafica_sensor.png";
      link.click();
    });
  }

  function showSection(sectionId) {
    const sections = ["mainPanel", "historyPanel", "resumenPanel"];
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) section.classList.add("hidden");
    });
    const selected = document.getElementById(sectionId);
    if (selected) selected.classList.remove("hidden");
    if (sideMenu) sideMenu.classList.add("hidden");
  }

  window.showSection = showSection;

  async function cargarResumen() {
    try {
      const [sensorRes, extrasRes] = await Promise.all([
        fetch(`${apiUrl}/sensores`).then(r => r.json()),
        fetch(`${apiUrl}/extras`).then(r => r.json())
      ]);

      const sensores = {};
      for (const sensorObj of sensorRes) {
        const { sensor, datos } = sensorObj;
        const ultimo = datos.at(-1);
        sensores[sensor] = {
          valor: ultimo?.valor || null,
          timestamp: ultimo?.timestamp || null
        };
      }

      let html = `
        <h2 class="text-xl font-bold mb-4 text-center">Resumen de Sensores</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white shadow-md rounded">
            <thead class="bg-gray-200">
              <tr>
                <th class="border px-4 py-2">Sensor</th>
                <th class="border px-4 py-2">Valor</th>
                <th class="border px-4 py-2">Hora</th>
              </tr>
            </thead>
            <tbody>`;

      for (let sensor in sensores) {
        const s = sensores[sensor];
        html += `
              <tr>
                <td class="border px-4 py-2">${sensor}</td>
                <td class="border px-4 py-2">${s.valor ?? "--"}</td>
                <td class="border px-4 py-2">${s.timestamp ?? "--"}</td>
              </tr>`;
      }

      html += `</tbody></table></div>`;

      html += `
        <h2 class="text-xl font-bold mt-8 mb-4 text-center">Estado del Sistema</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="bg-white p-4 rounded shadow">
            <div class="text-sm text-gray-500">Voltaje Panel</div>
            <div class="text-xl">${extrasRes.voltajePanel ?? "--"} V</div>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <div class="text-sm text-gray-500">Voltaje Batería</div>
            <div class="text-xl">${extrasRes.voltajeBateria ?? "--"} V</div>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <div class="text-sm text-gray-500">% Batería</div>
            <div class="text-xl">${extrasRes.porcentajeBateria ?? "--"}%</div>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <div class="text-sm text-gray-500">% Panel Solar</div>
            <div class="text-xl">${extrasRes.porcentajePanel ?? "--"}%</div>
          </div>
        </div>`;

      resumenContainer.innerHTML = html;
    } catch (err) {
      console.error("Error al cargar resumen:", err);
    }
  }
});