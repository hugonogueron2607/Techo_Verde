from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any
import csv
import requests
from io import StringIO

app = FastAPI()

# Habilitar CORS para permitir conexión desde frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL del CSV publicado desde Google Sheets
CSV_URL = "https://docs.google.com/spreadsheets/d/1cotJ7Goay6NluG2SFVCxx-rIfnDPdZB0_wO5ExloG4s/gviz/tq?tqx=out:csv&sheet=Lecturas"

# Ruta para obtener los datos completos como JSON
@app.get("/lecturas", response_model=Dict[str, List[Dict[str, Any]]])
def get_lecturas():
    response = requests.get(CSV_URL)
    if response.status_code != 200:
        return {"error": "No se pudo obtener el archivo CSV"}

    decoded = response.content.decode("utf-8")
    reader = csv.DictReader(StringIO(decoded))
    data = [row for row in reader]
    return {"lecturas": data}

# Ruta para obtener los datos de un sensor específico
@app.get("/sensor/{sensor_id}")
def get_sensor(sensor_id: str):
    response = requests.get(CSV_URL)
    if response.status_code != 200:
        return {"error": "No se pudo obtener el archivo CSV"}

    decoded = response.content.decode("utf-8")
    reader = csv.DictReader(StringIO(decoded))
    datos = []
    for row in reader:
        if sensor_id in row:
            datos.append({
                "timestamp": row["Timestamp"],
                "valor": row[sensor_id]
            })
    return {"sensor": sensor_id, "datos": datos}
