import {
  Machine,
  ProductionOverview,
  ProductionStageFlow,
  ExplainablePrediction,
  Scenario,
  MachineDetailResponse,
  BackendStatus
} from '../types';

const API_BASE = '/api';

export async function fetchBackendStatus(): Promise<BackendStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Backend offline');
  return res.json();
}

export async function fetchMachines(scenario?: string, hour?: number): Promise<Machine[]> {
  const params = new URLSearchParams();
  if (scenario) params.append('scenario', scenario);
  if (hour !== undefined) params.append('hour', hour.toString());
  
  const res = await fetch(`${API_BASE}/machines?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch machines');
  return res.json();
}

export async function fetchMachineDetail(machineId: string, scenario?: string, hour?: number): Promise<MachineDetailResponse> {
  const params = new URLSearchParams();
  if (scenario) params.append('scenario', scenario);
  if (hour !== undefined) params.append('hour', hour.toString());

  const res = await fetch(`${API_BASE}/machines/${machineId}?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch machine ${machineId}`);
  return res.json();
}

export async function fetchProductionOverview(scenario?: string): Promise<ProductionOverview> {
  const params = new URLSearchParams();
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/production/overview?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch production overview');
  return res.json();
}

export async function fetchProductionFlow(scenario?: string): Promise<{ scenario: string; stages: ProductionStageFlow[] }> {
  const params = new URLSearchParams();
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/production/flow?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch production flow');
  return res.json();
}

export async function fetchPredictiveOverview(scenario?: string): Promise<any> {
  const params = new URLSearchParams();
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/predictive/overview?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch predictive overview');
  return res.json();
}

export async function fetchExplainablePrediction(machineId: string, scenario?: string): Promise<ExplainablePrediction> {
  const params = new URLSearchParams();
  if (scenario) params.append('scenario', scenario);

  const res = await fetch(`${API_BASE}/predictive/explain/${machineId}?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to explain prediction for ${machineId}`);
  return res.json();
}

export async function fetchScenarios(): Promise<Scenario[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function runScenario(scenarioId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scenarios/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: scenarioId })
  });
  if (!res.ok) throw new Error('Failed to execute scenario');
  return res.json();
}

export async function logMaintenanceAction(machineId: string, actionTaken: string, technician: string, notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/maintenance/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      machine_id: machineId,
      action_taken: actionTaken,
      technician: technician,
      notes: notes || 'Logged from FactoryTwin frontend'
    })
  });
  if (!res.ok) throw new Error('Failed to log maintenance');
  return res.json();
}
