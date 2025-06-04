let chart, compareChart;
const sensorSelect = document.getElementById("sensorSelect");
const sensorLabel = document.getElementById("sensorLabel");
const dashboardView = document.getElementById("dashboardView");
const historyView = document.getElementById("historyView");
const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuBtn");

menuBtn.addEventListener("click", () => {
  menu.classList.toggle("hidden");
});

menu.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    dashboardView.classList.add("hidden");
    historyView.classList.add("hidden");
    document.getElementById(btn.dataset.view + "View").classList.remove("hidden");
    menu.classList.add("hidden");
  });
});

async function fetchSensor(sensor) {
  const res = await fetch(`https://techo-verde-api-2.onrender.com/sensor/${sensor}`);
  const data = await res.json();
  return data.datos.reverse();
}

async function fetchAll() {
  const res = await fetch(`https://techo-verde-api-2.onrender.com/sensores`);
  return await res.json();
}

function renderChart(data, sensor) {
  const ctx = document.getElementById("sensorChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.timestamp),
      datasets: [{
        label: sensor,
        data: data.map(d => parseFloat(d.valor)),
        borderColor: "green",
        tension: 0.1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "°C" } },
        x: { title: { display: true, text: "Tiempo" } }
      }
    }
  });
}

function renderTable(data) {
  const tbody = document.getElementById("sensorTableBody");
  tbody.innerHTML = data.map(d => \`<tr><td class="p-2 border">\${d.timestamp}</td><td class="p-2 border">\${d.valor}</td></tr>\`).join("");
}

sensorSelect.addEventListener("change", async (e) => {
  const sensor = e.target.value;
  sensorLabel.textContent = sensor.replace("Sensor", "S");
  const data = await fetchSensor(sensor);
  renderChart(data, sensor);
  renderTable(data);
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = compareChart.toBase64Image();
  a.download = "comparativa.png";
  a.click();
});

function loadSensorOptions() {
  for (let i = 1; i <= 8; i++) {
    const option = document.createElement("option");
    option.value = \`Sensor\${i}\`;
    option.textContent = \`Sensor \${i}\`;
    sensorSelect.appendChild(option);
  }
}

async function renderComparativeChart() {
  const allData = await fetchAll();
  const ctx = document.getElementById("compareChart").getContext("2d");
  if (compareChart) compareChart.destroy();
  compareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: allData[0].datos.map(d => d.timestamp),
      datasets: allData.map((sensor, idx) => ({
        label: sensor.sensor,
        data: sensor.datos.map(d => parseFloat(d.valor)),
        borderColor: \`hsl(\${(idx * 45) % 360}, 70%, 50%)\`,
        fill: false,
        tension: 0.1
      }))
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true },
        x: { title: { display: true, text: "Tiempo" } }
      }
    }
  });
}

loadSensorOptions();
sensorSelect.value = "Sensor1";
sensorSelect.dispatchEvent(new Event("change"));
renderComparativeChart();
