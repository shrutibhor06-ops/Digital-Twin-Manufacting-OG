// FactoryTwin TypeScript Definitions

export type MachineStatus = 'Running' | 'Idle' | 'Maintenance' | 'Fault';
export type MachineCondition = 'Healthy' | 'Warning' | 'Critical';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';

export interface SensorData {
  vibration: number;     // mm/s
  temperature: number;   // °C
  pressure: number;      // bar
  rpm: number;           // RPM
  power: number;         // kW
}

export interface Machine {
  machine_id: string;
  name: string;
  stage: string;
  ofact_ws: string;
  role: string;
  status: MachineStatus;
  condition: MachineCondition;
  health_score: number;       // 0 - 100
  failure_risk: number;       // 0.0 - 1.0
  maintenance_priority: MaintenancePriority;
  confidence: number;         // 0.0 - 1.0
  warning: string;
  recommended_action: string;
  sensors: SensorData;
  pos_3d: [number, number, number];
}

export interface ProductionOrder {
  order_id: string;
  customer: string;
  product: string;
  quantity: number;
  completed: number;
  status: 'Queued' | 'In Progress' | 'Delayed' | 'Completed';
  stage: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface Bottleneck {
  stage: string;
  severity: 'Moderate' | 'High' | 'Critical';
  reason: string;
  impact: string;
}

export interface ProductionOverview {
  fleet_summary: {
    total_machines: number;
    running: number;
    idle: number;
    maintenance: number;
    fault: number;
    overall_oee_pct: number;
  };
  production_progress: {
    target_units: number;
    completed_units: number;
    completion_percentage: number;
    active_orders_count: number;
    completed_orders_count: number;
  };
  orders: ProductionOrder[];
  bottlenecks: Bottleneck[];
  operational_insights: string[];
}

export interface ProductionStageFlow {
  id: string;
  title: string;
  machine_id: string;
  machine_name: string;
  status: MachineStatus;
  health: number;
  queue_size: number;
  cycle_time_sec: number;
  is_bottleneck: boolean;
}

export interface ContributingFactor {
  feature: string;
  observed: number;
  nominal: number;
  deviation_pct: number;
  importance_weight: number;
  impact: string;
}

export interface ExplainablePrediction {
  machine_id: string;
  machine_name: string;
  predicted_risk: number;
  condition: MachineCondition;
  confidence: number;
  contributing_factors: ContributingFactor[];
  maintenance_priority: MaintenancePriority;
  recommended_action: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  target_throughput: string;
  active_bottlenecks: string;
  risk_profile: string;
}

export interface MaintenanceLog {
  log_id?: number;
  machine_id: string;
  date: string;
  action_taken: string;
  technician: string;
  notes: string;
}

export interface TelemetryPoint {
  hour: number;
  vibration: number;
  temperature: number;
  pressure: number;
  rpm: number;
  power: number;
  failure_risk: number;
  status: string;
}

export interface MachineDetailResponse {
  machine: Machine;
  telemetry_history: TelemetryPoint[];
  maintenance_logs: MaintenanceLog[];
  feature_importances: Record<string, number>;
}

export interface BackendStatus {
  status: string;
  system_name: string;
  backend_framework: string;
  total_machines: number;
  total_sensor_records: number;
  active_scenario: string;
  current_hour: number;
  model_accuracy: number;
  last_updated: string;
}
