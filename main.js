// main.js

document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://techo-verde-api-2.onrender.com";

  // DOM Elements
  const sensorLabel = document.getElementById("sensorLabel");
  const sensorSelect = document.getElementById("sensorSelect");
  const tableBody = document.getElementById("sensorTableBody");
  const chartCanvas = document.getElementById("sensorChart").getContext("2d");
  const downloadButton = document.getElementById("downloadGraph");

  const menuToggle = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", () => {
      sideMenu.classList.toggle("hidden");
    });
  }
  
  let chart;

  // Inicialización
  initSensorSelect();
  updateSensor("Sensor1");

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

  function showSection(id) {
    document.querySelectorAll(".seccion").forEach(sec => sec.classList.add("hidden"));
    const selected = document.getElementById(id);
    if (selected) selected.classList.remove("hidden");
  }

  // Hacer accesible globalmente para onclick=""
  window.showSection = showSection;

  // Iniciar app
  initSensorSelect();
  updateSensor("Sensor1");
});