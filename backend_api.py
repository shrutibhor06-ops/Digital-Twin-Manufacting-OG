"""
backend_api.py
==============
Flask REST API backend for FactoryTwin: Open-Source Manufacturing Digital Twin.
Bridges:
- Simulated Sensor Dataset & SQLite database
- Scikit-learn predictive maintenance ML models (RandomForest, GradientBoosting)
- OFacT (Open Factory Twin) workstation state model, production flow & scenario generator
"""

import os
import sqlite3
import datetime
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "digital_twin.db")
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "simulated_sensor_data.csv")
ALT_DATA_PATH = "/Users/shruti/Documents/GitHub/digital-twin-manufacturing/data/raw/simulated_sensor_data.csv"

# Global machine definitions matching OFacT workstation model & predictive sensor units
MACHINES = [
    {
        "machine_id": "M01",
        "name": "Raw Material Feeder & Ingestion",
        "stage": "Intake",
        "ofact_ws": "main_warehouse_w",
        "role": "Receives raw tubular steel, lugs, and aluminum billets from storage.",
        "nominal_temp": 58.0,
        "nominal_vib": 2.2,
        "nominal_pressure": 30.5,
        "nominal_rpm": 1500,
        "nominal_power": 98.0,
        "pos_3d": [-12, 0, -4]
    },
    {
        "machine_id": "M02",
        "name": "Frame & Handlebar Stamping Station",
        "stage": "Fabrication",
        "ofact_ws": "body_kit_as",
        "role": "Hydroforming and stamping bicycle frames and handlebars.",
        "nominal_temp": 62.0,
        "nominal_vib": 2.6,
        "nominal_pressure": 29.8,
        "nominal_rpm": 1495,
        "nominal_power": 102.0,
        "pos_3d": [-6, 0, -4]
    },
    {
        "machine_id": "M03",
        "name": "Precision Tube TIG Welding Rig",
        "stage": "Fabrication",
        "ofact_ws": "body_kit_as",
        "role": "Automated robotic welding of bicycle frame triangles.",
        "nominal_temp": 65.0,
        "nominal_vib": 2.4,
        "nominal_pressure": 30.0,
        "nominal_rpm": 1510,
        "nominal_power": 105.0,
        "pos_3d": [0, 0, -4]
    },
    {
        "machine_id": "M04",
        "name": "Surface Pre-treatment & Electrostatic Coater",
        "stage": "Surface Finish",
        "ofact_ws": "painting_as",
        "role": "Electrostatic primer application and high-bake clear coat finishing.",
        "nominal_temp": 68.0,
        "nominal_vib": 2.1,
        "nominal_pressure": 31.0,
        "nominal_rpm": 1490,
        "nominal_power": 101.5,
        "pos_3d": [6, 0, -4]
    },
    {
        "machine_id": "M05",
        "name": "Wheel Truing & Spoke Tensioning Rig",
        "stage": "Component Pre-assembly",
        "ofact_ws": "wheel_as",
        "role": "High-precision automated spoke lacing, rim tensioning, and truing sensor.",
        "nominal_temp": 60.5,
        "nominal_vib": 2.5,
        "nominal_pressure": 29.5,
        "nominal_rpm": 1505,
        "nominal_power": 99.0,
        "pos_3d": [12, 0, -4]
    },
    {
        "machine_id": "M06",
        "name": "Drivetrain & Brake Calibrator",
        "stage": "Sub-assembly",
        "ofact_ws": "gear_shift_brakes_as",
        "role": "Automated derailleur indexing, brake caliper torqueing and line bleed.",
        "nominal_temp": 61.0,
        "nominal_vib": 2.3,
        "nominal_pressure": 30.2,
        "nominal_rpm": 1500,
        "nominal_power": 100.0,
        "pos_3d": [12, 0, 4]
    },
    {
        "machine_id": "M07",
        "name": "Lighting, Cable & Saddle Fitter",
        "stage": "Sub-assembly",
        "ofact_ws": "lightning_pedal_saddle_as",
        "role": "Internal cable routing, LED dynamo wiring, and saddle torque station.",
        "nominal_temp": 59.5,
        "nominal_vib": 2.0,
        "nominal_pressure": 30.0,
        "nominal_rpm": 1495,
        "nominal_power": 97.5,
        "pos_3d": [6, 0, 4]
    },
    {
        "machine_id": "M08",
        "name": "Final Mechanical Assembly Center",
        "stage": "Assembly",
        "ofact_ws": "body_kit_as",
        "role": "Marries wheelset, frame, drivetrain, and cockpit into finished bicycle.",
        "nominal_temp": 63.0,
        "nominal_vib": 2.7,
        "nominal_pressure": 29.7,
        "nominal_rpm": 1502,
        "nominal_power": 103.0,
        "pos_3d": [0, 0, 4]
    },
    {
        "machine_id": "M09",
        "name": "Automated Dyno & End-of-Line QA Rig",
        "stage": "Quality Assurance",
        "ofact_ws": "wheel_as",
        "role": "Continuous rolling dyno resistance, brake torque check, and laser alignment.",
        "nominal_temp": 64.5,
        "nominal_vib": 2.8,
        "nominal_pressure": 29.9,
        "nominal_rpm": 1515,
        "nominal_power": 104.5,
        "pos_3d": [-6, 0, 4]
    },
    {
        "machine_id": "M10",
        "name": "Protective Boxing & Dispatch Conveyor",
        "stage": "Packaging & Dispatch",
        "ofact_ws": "main_warehouse_w",
        "role": "Automated carton forming, barcode tagging, foam pack, and dock sort.",
        "nominal_temp": 57.0,
        "nominal_vib": 1.9,
        "nominal_pressure": 30.1,
        "nominal_rpm": 1485,
        "nominal_power": 96.0,
        "pos_3d": [-12, 0, 4]
    }
]

# Initial State Cache & ML Models
CACHE = {
    "df": None,
    "current_hour": 480,
    "active_scenario": "Baseline_Shift",
    "scenario_params": {
        "Baseline_Shift": {"speed": 1.0, "degrade_m05": False, "starve_m02": False},
        "High_Demand_Spike": {"speed": 1.35, "degrade_m05": False, "starve_m02": False},
        "M05_Bearing_Wear": {"speed": 1.0, "degrade_m05": True, "starve_m02": False},
        "M02_Upstream_Starvation": {"speed": 0.85, "degrade_m05": False, "starve_m02": True}
    },
    "ml_classifier": None,
    "ml_regressor": None,
    "feature_names": ["vibration", "temperature", "pressure", "rpm", "power"],
    "feature_importances": {},
    "metrics": {}
}


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db_and_models():
    """Initializes SQLite schema, seeds data, and trains predictive models."""
    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    
    # Locate CSV data
    csv_file = RAW_DATA_PATH if os.path.exists(RAW_DATA_PATH) else ALT_DATA_PATH
    if not os.path.exists(csv_file):
        raise FileNotFoundError(f"Simulated sensor data CSV not found at {RAW_DATA_PATH} or {ALT_DATA_PATH}")

    df = pd.read_csv(csv_file)
    CACHE["df"] = df

    # Initialize SQLite database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machines (
        machine_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stage TEXT NOT NULL,
        role TEXT NOT NULL,
        ofact_ws TEXT NOT NULL,
        nominal_temp REAL,
        nominal_vib REAL,
        nominal_pressure REAL,
        nominal_rpm REAL,
        nominal_power REAL,
        pos_x REAL, pos_y REAL, pos_z REAL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_readings (
        reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        hour INTEGER NOT NULL,
        vibration REAL,
        temperature REAL,
        pressure REAL,
        rpm REAL,
        power REAL,
        failure_risk REAL,
        status TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        hour INTEGER NOT NULL,
        failure_risk REAL NOT NULL,
        predicted_status TEXT NOT NULL,
        maintenance_priority TEXT NOT NULL,
        confidence REAL NOT NULL,
        model_version TEXT NOT NULL,
        predicted_at TEXT DEFAULT (datetime('now'))
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id TEXT NOT NULL,
        date TEXT NOT NULL,
        action_taken TEXT NOT NULL,
        technician TEXT NOT NULL,
        notes TEXT
    );
    """)

    # Populate machines table if empty
    cursor.execute("SELECT COUNT(*) FROM machines")
    if cursor.fetchone()[0] == 0:
        for m in MACHINES:
            cursor.execute("""
            INSERT INTO machines (machine_id, name, stage, role, ofact_ws,
                nominal_temp, nominal_vib, nominal_pressure, nominal_rpm, nominal_power,
                pos_x, pos_y, pos_z)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                m["machine_id"], m["name"], m["stage"], m["role"], m["ofact_ws"],
                m["nominal_temp"], m["nominal_vib"], m["nominal_pressure"], m["nominal_rpm"], m["nominal_power"],
                m["pos_3d"][0], m["pos_3d"][1], m["pos_3d"][2]
            ))

    # Populate sensor_readings if empty
    cursor.execute("SELECT COUNT(*) FROM sensor_readings")
    if cursor.fetchone()[0] == 0:
        df.to_sql("sensor_readings", conn, if_exists="append", index=False)

    # Populate maintenance logs with realistic history
    cursor.execute("SELECT COUNT(*) FROM maintenance_log")
    if cursor.fetchone()[0] == 0:
        sample_logs = [
            ("M05", "2026-10-14 09:30:00", "Bearing Lubrication & Spoke Tension Realignment", "S. Schneider", "Routine 30-day lubrication and laser calibration."),
            ("M02", "2026-10-10 14:15:00", "Hydraulic Fluid Top-Up & Seal Replacement", "M. Weber", "High cycle pressure test completed; 0.2 bar drift resolved."),
            ("M04", "2026-10-05 11:00:00", "Nozzle Purge & Filter Exchange", "K. Richter", "Electrostatic spray pattern recalibrated."),
            ("M09", "2026-09-28 16:45:00", "Dyno Load Cell Zeroing", "A. Becker", "Calibration certified for ±0.05% error margin."),
            ("M03", "2026-09-20 08:00:00", "TIG Torch Tungsten Electrode Refresh", "H. Fischer", "Inspected gas lens and shield gas flow rates.")
        ]
        cursor.executemany("""
        INSERT INTO maintenance_log (machine_id, date, action_taken, technician, notes)
        VALUES (?, ?, ?, ?, ?)
        """, sample_logs)

    conn.commit()
    conn.close()

    # Train Random Forest Classifier and Gradient Boosting Regressor
    X = df[CACHE["feature_names"]]
    y_class = df["status"]
    y_reg = df["failure_risk"]

    clf = RandomForestClassifier(n_estimators=60, max_depth=8, random_state=42)
    clf.fit(X, y_class)

    reg = GradientBoostingRegressor(n_estimators=50, max_depth=5, random_state=42)
    reg.fit(X, y_reg)

    CACHE["ml_classifier"] = clf
    CACHE["ml_regressor"] = reg

    # Feature importances
    importances = clf.feature_importances_
    CACHE["feature_importances"] = {
        name: float(round(imp * 100, 2))
        for name, imp in zip(CACHE["feature_names"], importances)
    }

    # Model evaluation metrics
    y_pred_class = clf.predict(X)
    CACHE["metrics"] = {
        "accuracy": float(round(accuracy_score(y_class, y_pred_class), 4)),
        "precision": float(round(precision_score(y_class, y_pred_class, average="weighted", zero_division=0), 4)),
        "recall": float(round(recall_score(y_class, y_pred_class, average="weighted", zero_division=0), 4)),
        "f1": float(round(f1_score(y_class, y_pred_class, average="weighted", zero_division=0), 4))
    }
    print(f"[FactoryTwin Backend] Initialized. ML Accuracy: {CACHE['metrics']['accuracy']*100:.1f}%.")


# Helper to get current machine states based on scenario & current hour
def get_computed_machine_states(target_hour=None, scenario_name=None):
    if target_hour is None:
        target_hour = CACHE["current_hour"]
    if scenario_name is None:
        scenario_name = CACHE["active_scenario"]

    df = CACHE["df"]
    # Filter for target hour
    hour_df = df[df["hour"] == target_hour].copy()
    if hour_df.empty:
        hour_df = df[df["hour"] == 480].copy()

    results = []
    clf = CACHE["ml_classifier"]
    reg = CACHE["ml_regressor"]

    for m in MACHINES:
        mid = m["machine_id"]
        row = hour_df[hour_df["machine_id"] == mid]
        
        if not row.empty:
            r = row.iloc[0]
            vib = float(r["vibration"])
            temp = float(r["temperature"])
            press = float(r["pressure"])
            rpm = float(r["rpm"])
            power = float(r["power"])
            base_risk = float(r["failure_risk"])
            base_status = str(r["status"])
        else:
            vib, temp, press, rpm, power = m["nominal_vib"], m["nominal_temp"], m["nominal_pressure"], m["nominal_rpm"], m["nominal_power"]
            base_risk = 0.05
            base_status = "Healthy"

        # Apply scenario modulation
        if scenario_name == "M05_Bearing_Wear" and mid == "M05":
            vib += 2.2
            temp += 14.5
            rpm -= 35.0
            press -= 1.8
            power += 12.0
        elif scenario_name == "M02_Upstream_Starvation" and mid == "M02":
            rpm = 0.0
            power = 15.0
            press = 10.0

        # Predict with trained models
        input_df = pd.DataFrame([[vib, temp, press, rpm, power]], columns=CACHE["feature_names"])
        pred_status = clf.predict(input_df)[0] if clf else base_status
        probs = clf.predict_proba(input_df)[0] if clf else [0.9, 0.08, 0.02]
        confidence = float(np.max(probs))
        pred_risk = float(reg.predict(input_df)[0]) if reg else base_risk
        pred_risk = max(0.0, min(1.0, pred_risk))

        # Operational status (Running, Idle, Maintenance, Fault)
        if scenario_name == "M02_Upstream_Starvation" and mid == "M02":
            op_status = "Idle"
            warning = "Upstream buffer empty: Starved of hydroforming blanks from M01."
        elif pred_risk >= 0.70 or pred_status == "Critical":
            op_status = "Fault"
            warning = f"High thermal/vibration anomaly detected (Risk {pred_risk*100:.1f}%). Maintenance required."
        elif pred_risk >= 0.30 or pred_status == "Warning":
            op_status = "Maintenance"
            warning = f"Moderate sensor drift observed. Inspection recommended (Risk {pred_risk*100:.1f}%)."
        else:
            op_status = "Running"
            warning = "Nominal operation within calibrated tolerances."

        # Maintenance Priority
        if pred_risk >= 0.70:
            maint_priority = "High"
            action = "Immediate inspection and bearing/seal service required within 4 operating hours."
        elif pred_risk >= 0.30:
            maint_priority = "Medium"
            action = "Schedule preventive recalibration and lubricant top-up on next shift break."
        else:
            maint_priority = "Low"
            action = "Continue standard automated operating cycle."

        # Health score (100 - risk * 100)
        health_score = int(round((1.0 - pred_risk) * 100))

        results.append({
            "machine_id": mid,
            "name": m["name"],
            "stage": m["stage"],
            "ofact_ws": m["ofact_ws"],
            "role": m["role"],
            "status": op_status,
            "condition": pred_status,
            "health_score": health_score,
            "failure_risk": round(pred_risk, 3),
            "maintenance_priority": maint_priority,
            "confidence": round(confidence, 3),
            "warning": warning,
            "recommended_action": action,
            "sensors": {
                "vibration": round(vib, 3),
                "temperature": round(temp, 2),
                "pressure": round(press, 2),
                "rpm": round(rpm, 1),
                "power": round(power, 2)
            },
            "pos_3d": m["pos_3d"]
        })

    return results


# ---------------- API ENDPOINTS ----------------

@app.route("/api/status", methods=["GET"])
def get_system_status():
    return jsonify({
        "status": "online",
        "system_name": "FactoryTwin - Digital Twin Manufacturing Backend",
        "backend_framework": "Flask 3.1 & Python 3.14 with SQLite & Scikit-Learn",
        "total_machines": len(MACHINES),
        "total_sensor_records": len(CACHE["df"]) if CACHE["df"] is not None else 0,
        "active_scenario": CACHE["active_scenario"],
        "current_hour": CACHE["current_hour"],
        "model_accuracy": CACHE["metrics"].get("accuracy", 0.98),
        "last_updated": datetime.datetime.now().isoformat()
    })


@app.route("/api/machines", methods=["GET"])
def get_machines():
    hour = request.args.get("hour", type=int, default=CACHE["current_hour"])
    scenario = request.args.get("scenario", default=CACHE["active_scenario"])
    machines = get_computed_machine_states(target_hour=hour, scenario_name=scenario)
    return jsonify(machines)


@app.route("/api/machines/<machine_id>", methods=["GET"])
def get_machine_detail(machine_id):
    hour = request.args.get("hour", type=int, default=CACHE["current_hour"])
    scenario = request.args.get("scenario", default=CACHE["active_scenario"])
    all_machines = get_computed_machine_states(target_hour=hour, scenario_name=scenario)
    
    selected = next((m for m in all_machines if m["machine_id"] == machine_id), None)
    if not selected:
        return jsonify({"error": f"Machine {machine_id} not found"}), 404

    # Historical telemetry for this machine (last 60 hours up to current_hour)
    df = CACHE["df"]
    start_hour = max(0, hour - 59)
    history_df = df[(df["machine_id"] == machine_id) & (df["hour"] >= start_hour) & (df["hour"] <= hour)].sort_values("hour")
    
    telemetry = []
    for _, row in history_df.iterrows():
        telemetry.append({
            "hour": int(row["hour"]),
            "vibration": round(float(row["vibration"]), 2),
            "temperature": round(float(row["temperature"]), 2),
            "pressure": round(float(row["pressure"]), 2),
            "rpm": round(float(row["rpm"]), 1),
            "power": round(float(row["power"]), 2),
            "failure_risk": round(float(row["failure_risk"]), 3),
            "status": str(row["status"])
        })

    # Fetch maintenance records from SQLite
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM maintenance_log WHERE machine_id = ? ORDER BY date DESC", (machine_id,))
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        "machine": selected,
        "telemetry_history": telemetry,
        "maintenance_logs": logs,
        "feature_importances": CACHE["feature_importances"]
    })


@app.route("/api/production/overview", methods=["GET"])
def get_production_overview():
    scenario = request.args.get("scenario", default=CACHE["active_scenario"])
    machines = get_computed_machine_states(scenario_name=scenario)

    running_count = sum(1 for m in machines if m["status"] == "Running")
    idle_count = sum(1 for m in machines if m["status"] == "Idle")
    maint_count = sum(1 for m in machines if m["status"] == "Maintenance")
    fault_count = sum(1 for m in machines if m["status"] == "Fault")

    # Production orders extracted from OFacT bicycle_world
    orders = [
        {"order_id": "ORD-B401", "customer": "Google Mobility", "product": "Urban Commuter Pro", "quantity": 25, "completed": 21, "status": "In Progress", "stage": "Quality Assurance", "priority": "High"},
        {"order_id": "ORD-B402", "customer": "HSBI Research Park", "product": "Trekking E-Bike Matrix", "quantity": 40, "completed": 34, "status": "In Progress", "stage": "Sub-assembly", "priority": "Medium"},
        {"order_id": "ORD-B403", "customer": "Apple Campus Logistics", "product": "Aero Carbon Racing Bike", "quantity": 15, "completed": 15, "status": "Completed", "stage": "Packaging & Dispatch", "priority": "High"},
        {"order_id": "ORD-B404", "customer": "Telekom Fleet Services", "product": "City Cargo Carrier", "quantity": 50, "completed": 28, "status": "Delayed", "stage": "Fabrication", "priority": "High"},
        {"order_id": "ORD-B405", "customer": "DHL Express Dortmund", "product": "Heavy Duty Courier V2", "quantity": 30, "completed": 0, "status": "Queued", "stage": "Intake", "priority": "Medium"}
    ]

    total_units_target = sum(o["quantity"] for o in orders)
    total_units_completed = sum(o["completed"] for o in orders)
    completion_pct = round((total_units_completed / total_units_target) * 100, 1)

    # Bottleneck detection logic
    bottlenecks = []
    if scenario == "M02_Upstream_Starvation":
        bottlenecks.append({
            "stage": "Fabrication (M02)",
            "severity": "Critical",
            "reason": "Machine M02 is starved waiting for upstream raw materials from M01.",
            "impact": "Downstream stations M03-M10 operating at only 40% capacity."
        })
    elif scenario == "M05_Bearing_Wear":
        bottlenecks.append({
            "stage": "Component Pre-assembly (M05)",
            "severity": "High",
            "reason": "Wheel truing spindle vibration (4.7 mm/s) limiting feed rate to 50%.",
            "impact": "Wheelset buffer depleted; assembly station M08 delayed by 18 min."
        })
    else:
        bottlenecks.append({
            "stage": "Sub-assembly (M06/M07)",
            "severity": "Moderate",
            "reason": "Routing flexibility adjustment; dual derailleur/brake cable calibration cycle taking 12% longer than target.",
            "impact": "Small queue accumulating at station M08."
        })

    # Operational insights derived directly from data
    insights = []
    if fault_count > 0:
        fault_m = [m["machine_id"] for m in machines if m["status"] == "Fault"]
        insights.append(f"CRITICAL: Machine {', '.join(fault_m)} exceeded failure threshold. Immediate maintenance dispatch recommended.")
    if idle_count > 0:
        idle_m = [m["machine_id"] for m in machines if m["status"] == "Idle"]
        insights.append(f"LINE DELAY: Machine {', '.join(idle_m)} is idle waiting for upstream buffer replenishment.")
    insights.append(f"Fleet availability is at {((running_count)/len(machines)*100):.1f}% with {total_units_completed}/{total_units_target} bikes assembled.")
    insights.append(f"Active Scenario: '{scenario.replace('_', ' ')}' running at target shift schedule.")

    return jsonify({
        "fleet_summary": {
            "total_machines": len(machines),
            "running": running_count,
            "idle": idle_count,
            "maintenance": maint_count,
            "fault": fault_count,
            "overall_oee_pct": round(((running_count * 0.95 + maint_count * 0.6) / len(machines)) * 100, 1)
        },
        "production_progress": {
            "target_units": total_units_target,
            "completed_units": total_units_completed,
            "completion_percentage": completion_pct,
            "active_orders_count": len([o for o in orders if o["status"] != "Completed"]),
            "completed_orders_count": len([o for o in orders if o["status"] == "Completed"])
        },
        "orders": orders,
        "bottlenecks": bottlenecks,
        "operational_insights": insights
    })


@app.route("/api/production/flow", methods=["GET"])
def get_production_flow():
    scenario = request.args.get("scenario", default=CACHE["active_scenario"])
    machines = get_computed_machine_states(scenario_name=scenario)
    
    mach_map = {m["machine_id"]: m for m in machines}

    stages = [
        {
            "id": "stage-1",
            "title": "Raw Material Intake",
            "machine_id": "M01",
            "machine_name": mach_map["M01"]["name"],
            "status": mach_map["M01"]["status"],
            "health": mach_map["M01"]["health_score"],
            "queue_size": 18,
            "cycle_time_sec": 45,
            "is_bottleneck": False
        },
        {
            "id": "stage-2",
            "title": "Frame Hydroforming & Stamping",
            "machine_id": "M02",
            "machine_name": mach_map["M02"]["name"],
            "status": mach_map["M02"]["status"],
            "health": mach_map["M02"]["health_score"],
            "queue_size": 12 if scenario != "M02_Upstream_Starvation" else 0,
            "cycle_time_sec": 75,
            "is_bottleneck": scenario == "M02_Upstream_Starvation"
        },
        {
            "id": "stage-3",
            "title": "Robotic TIG Tube Welding",
            "machine_id": "M03",
            "machine_name": mach_map["M03"]["name"],
            "status": mach_map["M03"]["status"],
            "health": mach_map["M03"]["health_score"],
            "queue_size": 8,
            "cycle_time_sec": 90,
            "is_bottleneck": False
        },
        {
            "id": "stage-4",
            "title": "Surface Treatment & Powder Coating",
            "machine_id": "M04",
            "machine_name": mach_map["M04"]["name"],
            "status": mach_map["M04"]["status"],
            "health": mach_map["M04"]["health_score"],
            "queue_size": 14,
            "cycle_time_sec": 120,
            "is_bottleneck": False
        },
        {
            "id": "stage-5",
            "title": "Wheel Truing & Tensioning",
            "machine_id": "M05",
            "machine_name": mach_map["M05"]["name"],
            "status": mach_map["M05"]["status"],
            "health": mach_map["M05"]["health_score"],
            "queue_size": 22 if scenario == "M05_Bearing_Wear" else 6,
            "cycle_time_sec": 140 if scenario == "M05_Bearing_Wear" else 60,
            "is_bottleneck": scenario == "M05_Bearing_Wear"
        },
        {
            "id": "stage-6",
            "title": "Drivetrain & Brakes Calibrator",
            "machine_id": "M06",
            "machine_name": mach_map["M06"]["name"],
            "status": mach_map["M06"]["status"],
            "health": mach_map["M06"]["health_score"],
            "queue_size": 9,
            "cycle_time_sec": 85,
            "is_bottleneck": scenario == "Baseline_Shift"  # minor operational delay
        },
        {
            "id": "stage-7",
            "title": "Cockpit, Lighting & Saddles",
            "machine_id": "M07",
            "machine_name": mach_map["M07"]["name"],
            "status": mach_map["M07"]["status"],
            "health": mach_map["M07"]["health_score"],
            "queue_size": 5,
            "cycle_time_sec": 55,
            "is_bottleneck": False
        },
        {
            "id": "stage-8",
            "title": "Final Mechanical Assembly",
            "machine_id": "M08",
            "machine_name": mach_map["M08"]["name"],
            "status": mach_map["M08"]["status"],
            "health": mach_map["M08"]["health_score"],
            "queue_size": 11,
            "cycle_time_sec": 110,
            "is_bottleneck": False
        },
        {
            "id": "stage-9",
            "title": "Automated Dyno & End-of-Line QA",
            "machine_id": "M09",
            "machine_name": mach_map["M09"]["name"],
            "status": mach_map["M09"]["status"],
            "health": mach_map["M09"]["health_score"],
            "queue_size": 4,
            "cycle_time_sec": 40,
            "is_bottleneck": False
        },
        {
            "id": "stage-10",
            "title": "Packaging, Labeling & Dispatch",
            "machine_id": "M10",
            "machine_name": mach_map["M10"]["name"],
            "status": mach_map["M10"]["status"],
            "health": mach_map["M10"]["health_score"],
            "queue_size": 7,
            "cycle_time_sec": 30,
            "is_bottleneck": False
        }
    ]

    return jsonify({
        "scenario": scenario,
        "stages": stages
    })


@app.route("/api/predictive/overview", methods=["GET"])
def get_predictive_overview():
    scenario = request.args.get("scenario", default=CACHE["active_scenario"])
    machines = get_computed_machine_states(scenario_name=scenario)

    high_risk_machines = [m for m in machines if m["maintenance_priority"] == "High"]
    med_risk_machines = [m for m in machines if m["maintenance_priority"] == "Medium"]
    low_risk_machines = [m for m in machines if m["maintenance_priority"] == "Low"]

    return jsonify({
        "scenario": scenario,
        "model_metadata": {
            "algorithm": "Random Forest Classifier & Gradient Boosting Regressor",
            "trained_samples": len(CACHE["df"]),
            "training_features": CACHE["feature_names"],
            "metrics": CACHE["metrics"]
        },
        "risk_breakdown": {
            "high": len(high_risk_machines),
            "medium": len(med_risk_machines),
            "low": len(low_risk_machines)
        },
        "feature_importances": CACHE["feature_importances"],
        "critical_alerts": [
            {
                "machine_id": m["machine_id"],
                "machine_name": m["name"],
                "failure_risk": m["failure_risk"],
                "condition": m["condition"],
                "warning": m["warning"],
                "recommended_action": m["recommended_action"]
            }
            for m in (high_risk_machines + med_risk_machines)
        ],
        "machines": machines
    })


@app.route("/api/predictive/explain/<machine_id>", methods=["GET"])
def explain_prediction(machine_id):
    scenario = request.args.get("scenario", default=CACHE["active_scenario"])
    machines = get_computed_machine_states(scenario_name=scenario)
    
    m = next((item for item in machines if item["machine_id"] == machine_id), None)
    if not m:
        return jsonify({"error": f"Machine {machine_id} not found"}), 404

    # Calculate z-score anomalies relative to nominal baseline
    sensors = m["sensors"]
    # nominal values
    base_def = next(x for x in MACHINES if x["machine_id"] == machine_id)
    
    factors = [
        {
            "feature": "Vibration (mm/s)",
            "observed": sensors["vibration"],
            "nominal": base_def["nominal_vib"],
            "deviation_pct": round(((sensors["vibration"] - base_def["nominal_vib"]) / base_def["nominal_vib"]) * 100, 1),
            "importance_weight": CACHE["feature_importances"].get("vibration", 38.5),
            "impact": "Strong Warning" if sensors["vibration"] > 3.5 else ("Minor Drift" if sensors["vibration"] > 2.8 else "Normal")
        },
        {
            "feature": "Temperature (°C)",
            "observed": sensors["temperature"],
            "nominal": base_def["nominal_temp"],
            "deviation_pct": round(((sensors["temperature"] - base_def["nominal_temp"]) / base_def["nominal_temp"]) * 100, 1),
            "importance_weight": CACHE["feature_importances"].get("temperature", 29.2),
            "impact": "High Thermal Drift" if sensors["temperature"] > 75 else ("Elevated" if sensors["temperature"] > 65 else "Normal")
        },
        {
            "feature": "Hydraulic Pressure (bar)",
            "observed": sensors["pressure"],
            "nominal": base_def["nominal_pressure"],
            "deviation_pct": round(((sensors["pressure"] - base_def["nominal_pressure"]) / base_def["nominal_pressure"]) * 100, 1),
            "importance_weight": CACHE["feature_importances"].get("pressure", 14.8),
            "impact": "Loss of Pressure" if sensors["pressure"] < 28 else "Normal"
        },
        {
            "feature": "Rotational Speed (RPM)",
            "observed": sensors["rpm"],
            "nominal": base_def["nominal_rpm"],
            "deviation_pct": round(((sensors["rpm"] - base_def["nominal_rpm"]) / base_def["nominal_rpm"]) * 100, 1),
            "importance_weight": CACHE["feature_importances"].get("rpm", 10.5),
            "impact": "Speed Drop" if sensors["rpm"] < 1470 else "Normal"
        },
        {
            "feature": "Motor Power (kW)",
            "observed": sensors["power"],
            "nominal": base_def["nominal_power"],
            "deviation_pct": round(((sensors["power"] - base_def["nominal_power"]) / base_def["nominal_power"]) * 100, 1),
            "importance_weight": CACHE["feature_importances"].get("power", 7.0),
            "impact": "Overdraw" if sensors["power"] > 110 else "Normal"
        }
    ]

    return jsonify({
        "machine_id": machine_id,
        "machine_name": m["name"],
        "predicted_risk": m["failure_risk"],
        "condition": m["condition"],
        "confidence": m["confidence"],
        "contributing_factors": factors,
        "maintenance_priority": m["maintenance_priority"],
        "recommended_action": m["recommended_action"]
    })


@app.route("/api/scenarios", methods=["GET"])
def get_scenarios():
    return jsonify([
        {
            "id": "Baseline_Shift",
            "name": "Baseline Nominal Shift",
            "description": "Standard 8-hour production shift under nominal operating conditions. All 10 machines operate within calibrated tolerances.",
            "type": "Nominal",
            "is_active": CACHE["active_scenario"] == "Baseline_Shift",
            "target_throughput": "100%",
            "active_bottlenecks": "None (balanced takt time)",
            "risk_profile": "Low across all workstations"
        },
        {
            "id": "High_Demand_Spike",
            "name": "High Demand Order Surge (+35%)",
            "description": "Accelerates takt time to satisfy rush orders for Apple Campus and Google Mobility. Increases machine duty cycle and thermal load.",
            "type": "Stress Test",
            "is_active": CACHE["active_scenario"] == "High_Demand_Spike",
            "target_throughput": "135%",
            "active_bottlenecks": "Sub-assembly cable indexing (M06)",
            "risk_profile": "Moderate thermal creep on coating oven (M04)"
        },
        {
            "id": "M05_Bearing_Wear",
            "name": "M05 Spindle Bearing Degradation",
            "description": "Simulates gradual mechanical bearing fatigue on the Wheel Truing Rig (M05). Vibration rises from 2.5 mm/s to 4.7 mm/s with thermal runaway.",
            "type": "Predictive Failure",
            "is_active": CACHE["active_scenario"] == "M05_Bearing_Wear",
            "target_throughput": "72%",
            "active_bottlenecks": "Wheel Truing station M05",
            "risk_profile": "CRITICAL on M05 (Failure Risk > 85%)"
        },
        {
            "id": "M02_Upstream_Starvation",
            "name": "M02 Upstream Supply Starvation",
            "description": "Raw material feeder M01 experiences intake stoppage, starving frame hydroforming station M02 and stalling downstream assembly flow.",
            "type": "Material Flow Disruption",
            "is_active": CACHE["active_scenario"] == "M02_Upstream_Starvation",
            "target_throughput": "45%",
            "active_bottlenecks": "Frame Fabrication M02 (Starved)",
            "risk_profile": "Operational line stoppage"
        }
    ])


@app.route("/api/scenarios/run", methods=["POST"])
def run_scenario():
    data = request.json or {}
    scenario_id = data.get("scenario_id")
    if scenario_id not in CACHE["scenario_params"]:
        return jsonify({"error": f"Scenario {scenario_id} not recognized."}), 400

    CACHE["active_scenario"] = scenario_id
    machines = get_computed_machine_states(scenario_name=scenario_id)

    return jsonify({
        "status": "success",
        "active_scenario": scenario_id,
        "message": f"Successfully loaded and executed scenario '{scenario_id.replace('_', ' ')}'.",
        "machines": machines
    })


@app.route("/api/maintenance/schedule", methods=["POST"])
def record_maintenance():
    data = request.json or {}
    mid = data.get("machine_id")
    action = data.get("action_taken", "Inspection & Preventive Service")
    technician = data.get("technician", "Operator")
    notes = data.get("notes", "Scheduled via FactoryTwin Digital Twin UI")

    if not mid:
        return jsonify({"error": "machine_id is required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO maintenance_log (machine_id, date, action_taken, technician, notes)
    VALUES (?, datetime('now'), ?, ?, ?)
    """, (mid, action, technician, notes))
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "message": f"Maintenance action successfully logged for machine {mid}."
    })


if __name__ == "__main__":
    init_db_and_models()
    port = int(os.environ.get("PORT", 5001))
    print(f"FactoryTwin Backend starting on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
