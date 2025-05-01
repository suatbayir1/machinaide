# ⚙️ Machinaide

**machinaide** is a real-time Digital Twin platform built with **Python (Flask)** for the backend and **React.js** for the frontend.  
It enables monitoring, visualization, and management of physical systems through their digital replicas.

---

## 🚀 Features

- 🧠 **Digital Twin Modeling**: Create and manage digital representations of physical machines.
- 📈 **Real-Time Monitoring**: Live data visualization using **Kafka**, **WebSockets**, and **InfluxDB**.
- 💡 **Dynamic Dashboards**: Integrated with **Chronograf** for time-series dashboarding.
- 🔌 **Modular Architecture**: Scalable separation of backend (Flask API) and frontend (React).
- 🌐 **WebSocket Communication**: Real-time interaction between devices and UI.
- 🔍 **Data Storage**: Efficient time-series storage via **InfluxDB**.

---

## 🛠️ Tech Stack

| Layer      | Technology           |
|------------|----------------------|
| Backend    | Python, Flask        |
| Frontend   | React.js, Typescript |
| Messaging  | Kafka, MQTT          |
| Real-Time  | WebSocket            |
| Database   | InfluxDB, MongoDB    |
| Monitoring | Chronograf           |
| Data       | TICK Stack           |

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/machinaide.git
cd machinaide
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 3. Frontend Setup
```bash
cd influxdb/ui
npm install
npm start
```

### 📄 License
This project is licensed under the MIT License. See LICENSE for details.
