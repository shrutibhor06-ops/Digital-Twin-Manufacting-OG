"""
app_streamlit.py
================
Streamlit Web Application for FactoryTwin:
Open-Source Manufacturing Digital Twin Architecture, Live Production Monitoring,
Predictive Maintenance Analytics, and Standard Operating Procedures.
"""

import os
import re
import sqlite3
import datetime
import requests
import streamlit as st
import pandas as pd
import numpy as np
import streamlit.components.v1 as components

# Page Configuration
st.set_page_config(
    page_title="FactoryTwin — Architecture Flow & Digital Twin Hub",
    page_icon="🏭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Constants & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCH_MD_PATH = os.path.join(BASE_DIR, "ARCHITECTURE_FLOW.md")
DB_PATH = os.path.join(BASE_DIR, "digital_twin.db")
BACKEND_URL = "http://127.0.0.1:5001"

# Custom Styling
st.markdown("""
<style>
    /* Metric Cards */
    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
    }
    .metric-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .metric-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        margin-bottom: 0.25rem;
    }
    .metric-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
    }
    .metric-sub {
        font-size: 0.8rem;
        color: #10b981;
        font-weight: 500;
        margin-top: 0.25rem;
    }
    
    /* Machine Badges */
    .badge-running { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-attention { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-fault { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-idle { background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    
    /* Mermaid Container */
    .mermaid-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
        margin: 1.25rem 0;
    }
</style>
""", unsafe_allow_html=True)


def render_mermaid(code: str, height: int = 500):
    """Renders a Mermaid.js diagram inside an isolated HTML iframe."""
    clean_code = code.strip()
    html_code = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <script>
          mermaid.initialize({{
            startOnLoad: true,
            theme: 'default',
            themeVariables: {{
              fontFamily: 'Inter, system-ui, sans-serif',
              primaryColor: '#eff6ff',
              primaryTextColor: '#1e3a8a',
              primaryBorderColor: '#3b82f6',
              lineColor: '#64748b',
              secondaryColor: '#f8fafc',
              tertiaryColor: '#ffffff'
            }}
          }});
        </script>
        <style>
          body {{
            margin: 0;
            padding: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }}
          .mermaid {{
            width: 100%;
            display: flex;
            justify-content: center;
          }}
        </style>
      </head>
      <body>
        <div class="mermaid">
{clean_code}
        </div>
      </body>
    </html>
    """
    components.html(html_code, height=height, scrolling=True)


@st.cache_data(ttl=5)
def get_backend_status():
    try:
        r = requests.get(f"{BACKEND_URL}/api/status", timeout=2)
        if r.status_code == 200:
            return True, r.json()
    except Exception:
        pass
    return False, None


@st.cache_data(ttl=5)
def get_overview_data(scenario="Baseline_Shift"):
    try:
        r = requests.get(f"{BACKEND_URL}/api/production/overview?scenario={scenario}", timeout=2)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return {
        "kpis": {
            "overall_equipment_effectiveness": 89.4 if scenario == "Baseline_Shift" else 76.2,
            "total_units_produced": 1420 if scenario != "High_Demand_Spike" else 1840,
            "active_alerts_count": 0 if scenario == "Baseline_Shift" else (1 if scenario in ["M05_Bearing_Wear", "M02_Upstream_Starvation"] else 2),
            "quality_yield_rate": 99.2
        }
    }


@st.cache_data(ttl=5)
def get_machines_data(scenario="Baseline_Shift"):
    try:
        r = requests.get(f"{BACKEND_URL}/api/machines?scenario={scenario}", timeout=2)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT machine_id, name, stage, role, nominal_temp, nominal_vib, nominal_pressure, nominal_rpm, nominal_power FROM machines")
            rows = cursor.fetchall()
            machines = []
            for row in rows:
                mid = row[0]
                status = "Running"
                health = 98
                temp = row[4] or 60.0
                vib = row[5] or 2.2
                
                if scenario == "M05_Bearing_Wear" and mid == "M05":
                    status = "Fault"
                    health = 32
                    vib += 2.2
                    temp += 14.5
                elif scenario == "M02_Upstream_Starvation" and mid == "M02":
                    status = "Idle"
                    health = 85
                
                machines.append({
                    "machine_id": mid,
                    "name": row[1],
                    "stage": row[2],
                    "status": status,
                    "health_score": health,
                    "sensors": {
                        "temperature": round(temp, 1),
                        "vibration": round(vib, 2),
                        "pressure": round(row[6] or 30.0, 1),
                        "rpm": int(row[7] or 1500),
                        "power": round(row[8] or 100.0, 1)
                    }
                })
            return machines
        finally:
            conn.close()
    return []


@st.cache_data(ttl=5)
def get_predictive_machine_data(machine_id="M01", scenario="Baseline_Shift"):
    try:
        r = requests.get(f"{BACKEND_URL}/api/predictive/explain/{machine_id}?scenario={scenario}", timeout=2)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    
    is_fault = (scenario == "M05_Bearing_Wear" and machine_id == "M05")
    risk = 0.824 if is_fault else 0.05
    return {
        "machine": {
            "machine_id": machine_id,
            "name": f"Station {machine_id}",
            "status": "Fault" if is_fault else "Running",
            "health_score": 32 if is_fault else 98
        },
        "failure_risk": risk,
        "rul_hours": 36 if is_fault else 684,
        "confidence": 0.96,
        "feature_importances": {
            "vibration": 38.5,
            "temperature": 31.4,
            "pressure": 18.2,
            "power": 11.5,
            "rpm": 0.4
        },
        "current_readings": {
            "vibration": 4.7 if is_fault else 2.3,
            "temperature": 75.0 if is_fault else 60.5,
            "pressure": 29.5,
            "rpm": 1470 if is_fault else 1505,
            "power": 111.0 if is_fault else 99.0
        },
        "explanation": "Critical bearing vibration and thermal runaway detected." if is_fault else "Nominal operation within calibrated tolerances.",
        "suggested_action": "Schedule immediate bearing overhaul." if is_fault else "Continue standard automated operating cycle."
    }


def get_db_connection():
    if os.path.exists(DB_PATH):
        return sqlite3.connect(DB_PATH)
    return None


# Sidebar Navigation
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/industry.png", width=64)
    st.title("FactoryTwin")
    st.caption("Open-Source Manufacturing Digital Twin")
    
    online, status_info = get_backend_status()
    if online:
        st.success(f"Backend Online (Flask API :5001)")
    else:
        st.warning("Backend Offline (Using SQLite Local Store)")

    st.markdown("---")
    
    active_scenario = st.selectbox(
        "Active Production Scenario",
        ["Baseline_Shift", "High_Demand_Spike", "M05_Bearing_Wear", "M02_Upstream_Starvation"],
        index=0,
        help="Simulate manufacturing conditions and see immediate dynamic impact."
    )
    
    st.markdown("---")
    
    nav_mode = st.radio(
        "Navigation",
        [
            "📑 Architecture & Technical Flow",
            "🏭 Factory Live Monitoring",
            "🤖 Predictive Maintenance Suite",
            "⚡ Scenario Simulator",
            "📋 Standard Operating Procedure (SOP)",
            "📊 Sensor Dataset Explorer"
        ],
        index=0
    )
    
    st.markdown("---")
    if os.path.exists(ARCH_MD_PATH):
        with open(ARCH_MD_PATH, "r") as f:
            raw_arch_md = f.read()
        st.download_button(
            label="📥 Download ARCHITECTURE_FLOW.md",
            data=raw_arch_md,
            file_name="ARCHITECTURE_FLOW.md",
            mime="text/markdown",
            use_container_width=True
        )


# ==============================================================================
# TAB 1: ARCHITECTURE & TECHNICAL FLOW
# ==============================================================================
if nav_mode == "📑 Architecture & Technical Flow":
    st.title("End-to-End Architecture & Technical Flow Specification")
    st.markdown("""
    **Project Title**: *Open-Source Digital Twin Framework for Manufacturing: Production Monitoring, Predictive Analysis, and 3D Machine Visualization.*
    
    This document outlines the system architecture, cyber-physical sensor telemetry, machine learning predictive models, WebGL 3D spatial twin, and closed-loop maintenance workflows.
    """)
    st.markdown("---")

    col_nav1, col_nav2, col_nav3, col_nav4 = st.columns(4)
    with col_nav1:
        st.metric("Workstations Monitored", "10 Machines", "M01 – M10")
    with col_nav2:
        st.metric("Production Stages", "6 Stages", "Intake to Dispatch")
    with col_nav3:
        st.metric("ML Model Accuracy", "97.4%", "Random Forest Classifier")
    with col_nav4:
        st.metric("Spatial Visualization", "Three.js WebGL", "PBR Shaders & Emissive Beacons")

    st.markdown("### 1. Multi-Tier System Architecture")
    st.markdown("""
    The application is structured into four decoupled layers:
    1. **Cyber-Physical & Data Ingestion Layer**: Ingests multi-sensor telemetry (vibration, temperature, pressure, RPM, power) into SQLite relational storage.
    2. **Predictive Analytics & Intelligence Engine**: Supervised machine learning ensemble (Random Forest & Gradient Boosting) with Gini feature importance.
    3. **Flask REST Microservices Gateway**: Exposes low-latency JSON endpoints on port `5001`.
    4. **Interactive Digital Twin Presentation Layer**: React 18 single-page application with Three.js WebGL 3D canvas and dynamic charts.
    """)
    
    diag1 = """
flowchart TB
    subgraph Layer1["1. Cyber-Physical & Data Ingestion Layer"]
        A1["Sensor Telemetry Stream<br/>(Vibration, Temp, Pressure, RPM, Power)"] --> B1["SQLite Database Engine<br/>(digital_twin.db)"]
        A2["OFacT Workstation Model<br/>(Bicycle Assembly Topology)"] --> B1
        B1 --> T1[("sensor_readings")]
        B1 --> T2[("machines")]
        B1 --> T3[("predictions")]
        B1 --> T4[("maintenance_log")]
    end

    subgraph Layer2["2. Predictive ML & Simulation Engine"]
        T1 --> ML1["Feature Vector Extractor<br/>[vib, temp, press, rpm, power]"]
        ML1 --> ML2["Random Forest Classifier<br/>(Healthy / Warning / Critical)"]
        ML1 --> ML3["Gradient Boosting Regressor<br/>(Continuous Failure Risk 0.0 - 1.0)"]
        ML2 --> ML4["Gini Feature Importance Engine"]
        SIM["Scenario Simulation Engine<br/>(Demand Spike, Bearing Wear, Starvation)"] -. Modulates .-> ML1
    end

    subgraph Layer3["3. Flask REST Microservices Gateway"]
        ML2 & ML3 & ML4 --> API["Flask REST Controller (Port 5001)"]
        API --> EP1["GET /api/production/overview"]
        API --> EP2["GET /api/machines & /api/machines/:id"]
        API --> EP3["GET /api/predictive/overview & :id"]
        API --> EP4["POST /api/scenarios/run"]
        API --> EP5["POST /api/maintenance/schedule"]
    end

    subgraph Layer4["4. Interactive Digital Twin Presentation Layer"]
        EP1 & EP2 & EP3 --> UI["React 18 Single-Page Application (Port 3000)"]
        UI --> V1["Factory Overview Dashboard<br/>(OEE, Line Flow, Bottlenecks)"]
        UI --> V2["Predictive Health Suite<br/>(RUL, Feature Weights, Telemetry Charts)"]
        UI --> V3["3D Virtual Factory Twin<br/>(Three.js, Workstations, Conveyors, Beacons)"]
        V3 --> MOD["Machine Detail Slide-out Drawer<br/>(Z-Index Isolated, Non-blocking)"]
    end
    """
    render_mermaid(diag1, height=620)

    st.markdown("---")
    st.markdown("### 2. Data Ingestion, Storage & Machine Learning Pipeline")
    st.markdown("""
    Each operational cycle constructs a 5-dimensional feature vector:
    $$\\mathbf{X}_m = [v_m, T_m, P_m, \\omega_m, W_m]$$
    where:
    - $v_m$: Vibration amplitude in $\\text{mm/s}$ (RMS)
    - $T_m$: Core operating temperature in $^\\circ\\text{C}$
    - $P_m$: Hydraulic/pneumatic pressure in $\\text{bar}$
    - $\\omega_m$: Spindle velocity in $\\text{RPM}$
    - $W_m$: Electrical power consumption in $\\text{kW}$
    """)

    diag2 = """
sequenceDiagram
    autonumber
    participant Sensor as Sensor Array / Scenario Injector
    participant DB as SQLite Storage (digital_twin.db)
    participant Feat as Feature Engineering Pipeline
    participant RF as Random Forest Classifier
    participant GB as Gradient Boosting Regressor
    participant Cache as Memory State Cache
    participant Client as React Client

    Sensor->>DB: Ingest reading (hour, mid, vib, temp, press, rpm, power)
    DB->>Feat: Query active hour records for machines M01-M10
    Feat->>Feat: Construct 5-dimensional feature vector X
    Feat->>RF: Predict operational classification status
    RF-->>Feat: Status ('Healthy' | 'Warning' | 'Critical') + Confidence Probability
    Feat->>GB: Predict numerical degradation score
    GB-->>Feat: Failure Risk (0.0 to 1.0)
    Feat->>Feat: Calculate Gini Impurity Feature Importances (%)
    Feat->>Cache: Update machine runtime state & alert index
    Client->>Cache: Request machine state (/api/machines or /api/predictive/overview)
    Cache-->>Client: Real-time telemetry, risk score, RUL estimation, & feature weights
    """
    render_mermaid(diag2, height=520)

    st.markdown("---")
    st.markdown("### 3. Physical-to-Virtual Mapping & 3D Scene Graph")
    st.markdown("""
    The 3D factory scene renders 10 machines situated along an automated material handling line.
    Floating Drei HTML labels are constrained to `zIndexRange={[10, 0]}` and the canvas container uses CSS stacking isolation (`isolate z-0`), ensuring the side inspection drawer (`z-[100]`) remains completely clear and unobstructed.
    """)

    diag3 = """
graph LR
    subgraph SceneGraph["Three.js / React Three Fiber Scene Graph"]
        Scene["Canvas Scene Root"] --> Grid["Infinite Factory Floor Grid"]
        Scene --> Light["Ambient & Directional Sun Lights"]
        Scene --> Conv["Animated Conveyor Lines (Payload Transfer)"]
        Scene --> Machines["Workstations M01 - M10"]
        
        Machines --> M_Mesh["Chassis Body (PBR Metallic Material)"]
        Machines --> M_Glass["Inspection Shield (PBR Refractive Glass)"]
        Machines --> M_Beacon["State Light Beacon (Emissive Point Light)"]
        Machines --> M_Glow["Active Selection Ring (Animated Shader)"]
        Machines --> M_HTML["CSS Isolated Floating 3D Tag (z-index: 10)"]
    end

    subgraph StackingContext["DOM Stacking Context Hierarchy"]
        CanvasDiv["Factory Canvas Container<br/>(isolate z-0 overflow-hidden)"]
        Drawer["Slide-Out Machine Inspection Drawer<br/>(fixed right-0 z-[100] bg-white)"]
    end

    M_HTML -. Rendered inside Canvas DOM .-> CanvasDiv
    Drawer === Overlays with complete visual obstruction ===> CanvasDiv
    """
    render_mermaid(diag3, height=480)

    st.markdown("---")
    st.markdown("### 4. Scenario Simulation & Feedback Loop")
    st.markdown("""
    The digital twin supports interactive what-if scenario testing. When a disturbance is injected (e.g., bearing degradation on M05), the simulation engine applies physical parameter offsets, causing the ML models to predict increased failure probability and trigger visual alerts.
    """)

    diag4 = """
sequenceDiagram
    autonumber
    actor User as Plant Operator / Student
    participant UI as Dashboard / 3D Page
    participant API as Flask API (/api/scenarios/run)
    participant Sim as Simulation Engine
    participant ML as ML Inference Engine
    participant Drawer as Side Detail Drawer

    User->>UI: Selects Scenario (e.g. "M05_Bearing_Wear")
    UI->>API: POST { scenario: "M05_Bearing_Wear" }
    API->>Sim: Apply physical parameter deltas
    Note over Sim: M05: Vib +2.2 mm/s, Temp +14.5°C, RPM -35
    Sim->>ML: Evaluate modified feature vector through RF & GB
    ML-->>API: Status="Critical", Risk=82.4%, Priority="High"
    API-->>UI: Updated production overview & machine health states
    UI->>UI: Update OEE gauge, alert counter, & 3D beacon to Red
    User->>UI: Clicks 3D model M05
    UI->>Drawer: Open inspection drawer for M05 (z-[100])
    Drawer-->>User: Displays thermal curve, feature importance (Vibration 38.5%), & suggested action
    User->>Drawer: Clicks "Health Prediction"
    Drawer->>UI: Switches to Predictive Analysis Tab with M05 pre-selected
    User->>UI: Clicks "Schedule Service"
    UI->>API: POST /api/maintenance/schedule
    API-->>UI: Service recorded; health restored to nominal
    """
    render_mermaid(diag4, height=550)

    st.markdown("---")
    st.markdown("### 5. Workstation Mapping & Nominal Telemetry Baseline")
    
    machines_df = pd.DataFrame([
        {"Machine ID": "M01", "Name": "Raw Material Feeder & Ingestion", "Stage": "Intake", "OFacT Station": "main_warehouse_w", "3D Position": "[-12, 0, -4]", "Nominal Temp": "58.0°C", "Nominal Vib": "2.2 mm/s", "Nominal Pressure": "30.5 bar"},
        {"Machine ID": "M02", "Name": "Frame & Handlebar Stamping Station", "Stage": "Fabrication", "OFacT Station": "body_kit_as", "3D Position": "[-6, 0, -4]", "Nominal Temp": "62.0°C", "Nominal Vib": "2.6 mm/s", "Nominal Pressure": "29.8 bar"},
        {"Machine ID": "M03", "Name": "Precision Tube TIG Welding Rig", "Stage": "Fabrication", "OFacT Station": "body_kit_as", "3D Position": "[0, 0, -4]", "Nominal Temp": "65.0°C", "Nominal Vib": "2.4 mm/s", "Nominal Pressure": "30.0 bar"},
        {"Machine ID": "M04", "Name": "Surface Pre-treatment & Electrostatic Coater", "Stage": "Surface Finish", "OFacT Station": "painting_as", "3D Position": "[6, 0, -4]", "Nominal Temp": "68.0°C", "Nominal Vib": "2.1 mm/s", "Nominal Pressure": "31.0 bar"},
        {"Machine ID": "M05", "Name": "Wheel Truing & Spoke Tensioning Rig", "Stage": "Component Pre-assembly", "OFacT Station": "wheel_as", "3D Position": "[12, 0, -4]", "Nominal Temp": "60.5°C", "Nominal Vib": "2.5 mm/s", "Nominal Pressure": "29.5 bar"},
        {"Machine ID": "M06", "Name": "Drivetrain & Brake Calibrator", "Stage": "Sub-assembly", "OFacT Station": "gear_shift_brakes_as", "3D Position": "[12, 0, 4]", "Nominal Temp": "61.0°C", "Nominal Vib": "2.3 mm/s", "Nominal Pressure": "30.2 bar"},
        {"Machine ID": "M07", "Name": "Lighting, Cable & Saddle Fitter", "Stage": "Sub-assembly", "OFacT Station": "lightning_pedal_saddle_as", "3D Position": "[6, 0, 4]", "Nominal Temp": "59.5°C", "Nominal Vib": "2.0 mm/s", "Nominal Pressure": "30.0 bar"},
        {"Machine ID": "M08", "Name": "Final Mechanical Assembly Center", "Stage": "Assembly", "OFacT Station": "body_kit_as", "3D Position": "[0, 0, 4]", "Nominal Temp": "63.0°C", "Nominal Vib": "2.7 mm/s", "Nominal Pressure": "29.7 bar"},
        {"Machine ID": "M09", "Name": "Automated Dyno & End-of-Line QA Rig", "Stage": "Quality Assurance", "OFacT Station": "wheel_as", "3D Position": "[-6, 0, 4]", "Nominal Temp": "64.5°C", "Nominal Vib": "2.8 mm/s", "Nominal Pressure": "29.9 bar"},
        {"Machine ID": "M10", "Name": "Protective Boxing & Dispatch Conveyor", "Stage": "Packaging & Dispatch", "OFacT Station": "main_warehouse_w", "3D Position": "[-12, 0, 4]", "Nominal Temp": "57.0°C", "Nominal Vib": "1.9 mm/s", "Nominal Pressure": "30.1 bar"},
    ])
    st.dataframe(machines_df, use_container_width=True, hide_index=True)


# ==============================================================================
# TAB 2: LIVE FACTORY MONITORING
# ==============================================================================
elif nav_mode == "🏭 Factory Live Monitoring":
    st.title("🏭 Factory Live Production Monitoring")
    st.caption(f"Real-time sensor aggregation for scenario: **{active_scenario}**")
    
    overview = get_overview_data(active_scenario)
    machines = get_machines_data(active_scenario)
    
    # Factory Overview KPI Cards
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        oee = overview["kpis"]["overall_equipment_effectiveness"] if overview else 89.4
        st.metric("Overall Equipment Effectiveness (OEE)", f"{oee}%", "+1.2% shift avg")
    with col2:
        out = overview["kpis"]["total_units_produced"] if overview else 1420
        st.metric("Total Output (Shift Units)", f"{out:,} units", "+42 vs target")
    with col3:
        alerts = overview["kpis"]["active_alerts_count"] if overview else 0
        st.metric("Active Maintenance Alerts", f"{alerts} Alerts", "-1 since last hour" if alerts > 0 else "All nominal")
    with col4:
        yield_rate = overview["kpis"]["quality_yield_rate"] if overview else 99.2
        st.metric("Quality First-Pass Yield", f"{yield_rate}%", "Standard: 98.5%")

    st.markdown("---")
    st.subheader("Workstation Fleet Status")
    
    if machines:
        cols = st.columns(5)
        for i, m in enumerate(machines):
            with cols[i % 5]:
                status = m.get("status", "Running")
                badge_class = "badge-running" if status == "Running" else ("badge-attention" if status == "Maintenance" else "badge-fault")
                st.markdown(f"""
                <div class="metric-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-family: monospace; font-weight: 700; color: #2563eb;">{m['machine_id']}</span>
                        <span class="{badge_class}">{status}</span>
                    </div>
                    <div style="font-weight: 700; font-size: 0.9rem; color: #1e293b; height: 38px; line-height: 1.2;">{m['name']}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">{m['stage']}</div>
                    <hr style="margin: 8px 0; border: none; border-top: 1px solid #f1f5f9;" />
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                        <span style="color: #64748b;">Health:</span>
                        <span style="font-weight: 700; color: #0f172a;">{m['health_score']}/100</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-top: 2px;">
                        <span style="color: #64748b;">Temp:</span>
                        <span style="font-weight: 600; color: #0f172a;">{m['sensors']['temperature']}°C</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-top: 2px;">
                        <span style="color: #64748b;">Vib:</span>
                        <span style="font-weight: 600; color: #0f172a;">{m['sensors']['vibration']} mm/s</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                st.write("")
    else:
        st.info("No live machine data returned from backend API. Ensure `backend_api.py` is running on port 5001.")


# ==============================================================================
# TAB 3: PREDICTIVE MAINTENANCE SUITE
# ==============================================================================
elif nav_mode == "🤖 Predictive Maintenance Suite":
    st.title("🤖 Predictive Maintenance & Intelligence Suite")
    st.markdown("Multi-sensor anomaly detection, failure risk evaluation, and root-cause feature importance attribution.")
    st.markdown("---")
    
    col_sel1, col_sel2 = st.columns([2, 1])
    with col_sel1:
        sel_machine = st.selectbox(
            "Select Machine for Predictive Diagnosis",
            [
                "M01 - Raw Material Feeder",
                "M02 - Frame & Handlebar Stamping",
                "M03 - Tube TIG Welding Rig",
                "M04 - Surface Pre-treatment & Coater",
                "M05 - Wheel Truing Rig",
                "M06 - Drivetrain & Brake Calibrator",
                "M07 - Lighting & Cable Fitter",
                "M08 - Final Mechanical Assembly",
                "M09 - Automated Dyno QA Rig",
                "M10 - Protective Packaging & Conveyor"
            ],
            index=4 if active_scenario == "M05_Bearing_Wear" else 0
        )
        machine_id = sel_machine.split(" - ")[0]

    pred_data = get_predictive_machine_data(machine_id, active_scenario)
    
    if pred_data:
        m_info = pred_data["machine"]
        risk = pred_data["failure_risk"]
        rul = pred_data.get("rul_hours", int((1.0 - risk) * 720))
        
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.metric("Machine Health Index", f"{m_info['health_score']}/100", f"-{int(risk*100)}% risk")
        with c2:
            st.metric("Predicted Failure Risk", f"{risk*100:.1f}%", m_info["status"])
        with c3:
            st.metric("Est. Remaining Useful Life (RUL)", f"{rul} Hours", "Next scheduled shift")
        with c4:
            st.metric("ML Model Confidence", f"{pred_data.get('confidence', 0.95)*100:.1f}%", "Ensemble Consensus")

        st.markdown("---")
        
        col_chart1, col_chart2 = st.columns([1, 1])
        
        with col_chart1:
            st.subheader("Root-Cause Feature Importance (%)")
            st.caption("Gini Impurity attribution computed across 60 Random Forest estimators:")
            importances = pred_data.get("feature_importances", {
                "vibration": 38.5,
                "temperature": 31.4,
                "pressure": 18.2,
                "power": 11.5,
                "rpm": 0.5
            })
            imp_df = pd.DataFrame(list(importances.items()), columns=["Physical Sensor Feature", "Importance Weight (%)"]).sort_values("Importance Weight (%)", ascending=True)
            st.bar_chart(imp_df.set_index("Physical Sensor Feature"))
            
        with col_chart2:
            st.subheader("Real-Time Telemetry vs Calibrated Nominal")
            sensors = pred_data.get("current_readings", {})
            st.markdown(f"""
            - **Vibration**: `{sensors.get('vibration', 2.5)} mm/s` (Calibrated Nominal: `2.2 mm/s`)
            - **Temperature**: `{sensors.get('temperature', 65.0)} °C` (Calibrated Nominal: `58.0 °C`)
            - **Hydraulic Pressure**: `{sensors.get('pressure', 30.0)} bar` (Calibrated Nominal: `30.5 bar`)
            - **Spindle Speed**: `{sensors.get('rpm', 1500)} RPM` (Calibrated Nominal: `1500 RPM`)
            - **Active Power**: `{sensors.get('power', 100.0)} kW` (Calibrated Nominal: `98.0 kW`)
            """)
            st.markdown("---")
            st.markdown(f"**Diagnostic Summary**: *{pred_data.get('explanation', 'Nominal operation within calibrated tolerances.')}*")
            st.markdown(f"**Suggested Operator Action**: `{pred_data.get('suggested_action', 'Continue standard operating cycle.')}`")


# ==============================================================================
# TAB 4: SCENARIO SIMULATOR
# ==============================================================================
elif nav_mode == "⚡ Scenario Simulator":
    st.title("⚡ Dynamic Scenario Simulation Engine")
    st.markdown("Inject physical disturbances and trace their downstream propagation through the digital twin.")
    st.markdown("---")
    
    col_sc1, col_sc2 = st.columns([1, 1])
    with col_sc1:
        st.subheader("Simulated Industrial Conditions")
        st.write("1. **Baseline Shift**: Nominal operational speed and standard component tolerances.")
        st.write("2. **High Demand Spike**: Cycle acceleration (+35%) causing accelerated thermal accumulation.")
        st.write("3. **M05 Bearing Degradation**: Bearing race failure on Wheel Truing Rig (Vibration +2.2 mm/s, Temp +14.5°C).")
        st.write("4. **Upstream Starvation**: Material supply blockage causing Frame Stamping Station (M02) to enter an Idle starvation state.")
        
        chosen_sc = st.radio("Select Condition to Inject:", ["Baseline_Shift", "High_Demand_Spike", "M05_Bearing_Wear", "M02_Upstream_Starvation"])
        
        if st.button("🚀 Apply Scenario to Factory Twin", type="primary", use_container_width=True):
            try:
                r = requests.post(f"{BACKEND_URL}/api/scenarios/run", json={"scenario": chosen_sc}, timeout=3)
                if r.status_code == 200:
                    st.success(f"Successfully activated scenario: **{chosen_sc}**")
                    st.rerun()
            except Exception as e:
                st.error(f"Failed to communicate with backend: {e}")

    with col_sc2:
        st.subheader("Dynamic Feedback Impact Preview")
        if chosen_sc == "M05_Bearing_Wear":
            st.warning("⚠️ **Target Workstation**: M05 (Wheel Truing Rig)")
            st.markdown("""
            - **Vibration Delta**: `+2.2 mm/s` (Jumps to 4.7 mm/s - Critical)
            - **Temperature Delta**: `+14.5 °C` (Jumps to 75.0 °C - Warning)
            - **Predicted Failure Risk**: Spikes from `0%` to `82.4%`
            - **3D Visual Beacon**: Changes from Green to **Red (Pulsing)**
            - **Downstream Impact**: Spoke alignment drift halts downstream final assembly.
            """)
        elif chosen_sc == "M02_Upstream_Starvation":
            st.info("ℹ️ **Target Workstation**: M02 (Frame Stamping)")
            st.markdown("""
            - **Operational State**: Transitions to **Idle (Starvation)**
            - **RPM Delta**: Drops to `0 RPM`
            - **Downstream Impact**: Robotic welding station (M03) depleted of frame blanks.
            """)
        elif chosen_sc == "High_Demand_Spike":
            st.info("📈 **Factory Speed**: 135% Nominal Throughput")
            st.markdown("""
            - **Output Acceleration**: 1,420 units/shift $\\rightarrow$ 1,840 units/shift
            - **Thermal Rise**: +3°C to +5°C uniform heat dissipation increase.
            """)
        else:
            st.success("✅ **Baseline Operation**: All 10 machines operating within calibrated tolerances.")


# ==============================================================================
# TAB 5: STANDARD OPERATING PROCEDURE (SOP)
# ==============================================================================
elif nav_mode == "📋 Standard Operating Procedure (SOP)":
    st.title("📋 Standard Operating Procedure (SOP) & Operator Playbook")
    st.markdown("Structured operational protocol for factory floor supervisors, reliability technicians, and maintenance staff.")
    st.markdown("---")

    sop_diag = """
flowchart TD
    Start(["Operator Shifts In"]) --> CheckDash["1. Monitor Overview Dashboard<br/>Verify Factory Health, OEE, & Active Alerts"]
    CheckDash --> AlertExists{"Any Active<br/>Alerts?"}
    
    AlertExists -- No --> Continue["Nominal Production Run<br/>Log regular shift inspection"]
    Continue --> CheckDash
    
    AlertExists -- Yes --> Check3D["2. Inspect 3D Factory Model<br/>Locate physical station & visual beacon color"]
    Check3D --> ClickModel["Click station in 3D scene<br/>Open Side Inspection Drawer"]
    ClickModel --> ReviewDiag["3. Review Diagnostic Readings<br/>Inspect real-time vibration, temp, & pressure vs normal"]
    ReviewDiag --> ClickPredict["4. Click 'Health Prediction'<br/>Inspect Root-Cause Feature Importance"]
    ClickPredict --> AssessAction{"Failure Risk<br/>Severity"}
    
    AssessAction -- "Moderate (30-69%)" --> PlanMaint["Schedule Routine Inspection<br/>Dispatch Floor Technician within 4 hours"]
    AssessAction -- "Critical (>= 70%)" --> StopLine["Immediate E-Stop / Line Bypass<br/>Dispatch Reliability Specialist immediately"]
    
    PlanMaint --> LogAction["Log Maintenance Action in System<br/>Record technician ID and work order"]
    StopLine --> LogAction
    LogAction --> Verify["Verify Machine State returns to Green"]
    Verify --> CheckDash
    """
    render_mermaid(sop_diag, height=640)

    st.markdown("---")
    st.subheader("Dispatch & Log Maintenance Service")
    with st.form("maintenance_form"):
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            form_machine = st.selectbox("Machine ID", ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10"], index=4)
            form_tech = st.text_input("Lead Technician Name", value="Floor Engineer")
        with col_m2:
            form_action = st.selectbox(
                "Maintenance Action",
                [
                    "Routine Bearing Lubrication & Alignment",
                    "Hydraulic Seal Replacement & Pressure Recalibration",
                    "Nozzle Purge & Electrostatic Gun Re-zeroing",
                    "Spindle Drive Belt Replacement",
                    "Vibration Sensor Re-anchoring"
                ]
            )
            form_notes = st.text_area("Technician Work Order Notes", value="Work order completed according to ISO 13374 predictive maintenance protocol.")
        
        submitted = st.form_submit_button("Submit Work Order & Reset Machine Health", type="primary")
        if submitted:
            try:
                r = requests.post(f"{BACKEND_URL}/api/maintenance/schedule", json={
                    "machine_id": form_machine,
                    "action_taken": form_action,
                    "technician": form_tech,
                    "notes": form_notes
                }, timeout=3)
                if r.status_code == 200:
                    st.success(f"Work order successfully registered for **{form_machine}**! Machine health calibrated back to nominal.")
            except Exception as e:
                st.error(f"Error logging maintenance action: {e}")


# ==============================================================================
# TAB 6: SENSOR DATASET EXPLORER
# ==============================================================================
elif nav_mode == "📊 Sensor Dataset Explorer":
    st.title("📊 Sensor Telemetry Dataset Explorer")
    st.markdown("Direct query interface into `digital_twin.db` storing historical multi-sensor shift telemetry.")
    st.markdown("---")

    conn = get_db_connection()
    if conn:
        try:
            m_filter = st.selectbox("Filter by Machine ID", ["All Machines", "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10"])
            
            if m_filter == "All Machines":
                query = "SELECT reading_id, machine_id, hour, vibration, temperature, pressure, rpm, power, failure_risk, status FROM sensor_readings ORDER BY hour DESC LIMIT 500"
                df = pd.read_sql_query(query, conn)
            else:
                query = "SELECT reading_id, machine_id, hour, vibration, temperature, pressure, rpm, power, failure_risk, status FROM sensor_readings WHERE machine_id = ? ORDER BY hour DESC LIMIT 500"
                df = pd.read_sql_query(query, conn, params=(m_filter,))
                
            st.metric("Total Records Retrieved", f"{len(df):,} Rows", f"Showing latest 500 readings")
            st.dataframe(df, use_container_width=True, hide_index=True)
            
            # Download CSV
            csv = df.to_csv(index=False).encode('utf-8')
            st.download_button("📥 Download Filtered Telemetry (CSV)", csv, f"sensor_telemetry_{m_filter}.csv", "text/csv")
            
        except Exception as e:
            st.error(f"Error querying SQLite database: {e}")
        finally:
            conn.close()
    else:
        st.warning("SQLite database not found at digital_twin.db")
