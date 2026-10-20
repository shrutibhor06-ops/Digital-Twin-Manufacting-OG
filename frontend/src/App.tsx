import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { MachineDetailModal } from './components/layout/MachineDetailModal';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { PredictiveAnalysis } from './pages/PredictiveAnalysis';
import { DigitalTwin3DPage } from './pages/DigitalTwin3DPage';
import {
  fetchBackendStatus,
  fetchMachines,
  fetchProductionOverview,
  fetchProductionFlow,
  fetchScenarios,
  runScenario
} from './services/api';
import {
  Machine,
  ProductionOverview,
  ProductionStageFlow,
  Scenario
} from './types';

export function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialTab = urlParams.get('tab') || 'overview';
  const initialMachine = urlParams.get('machine') || 'M01';
  const initialInspect = urlParams.get('inspect') || (urlParams.get('tab') === '3d-factory' ? urlParams.get('machine') : null);

  const [currentTab, setCurrentTab] = useState<string>(initialTab);
  
  // Dedicated state for Predictive Analysis active machine (e.g. M01 to M10)
  const [predictiveMachineId, setPredictiveMachineId] = useState<string>(initialMachine);
  
  // Dedicated state for the slide-out inspection drawer (null when closed)
  const [inspectingMachineId, setInspectingMachineId] = useState<string | null>(initialInspect);

  const [activeScenario, setActiveScenario] = useState<string>('Baseline_Shift');
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [overview, setOverview] = useState<ProductionOverview | null>(null);
  const [flowStages, setFlowStages] = useState<ProductionStageFlow[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load state from backend
  const refreshData = useCallback(async (scenarioOverride?: string) => {
    setIsLoading(true);
    const targetScenario = scenarioOverride || activeScenario;

    try {
      const [statusRes, machRes, overviewRes, flowRes, scRes] = await Promise.all([
        fetchBackendStatus().catch(() => null),
        fetchMachines(targetScenario),
        fetchProductionOverview(targetScenario),
        fetchProductionFlow(targetScenario),
        fetchScenarios().catch(() => [])
      ]);

      if (statusRes) {
        setBackendOnline(true);
        setLastUpdated(statusRes.last_updated);
      } else {
        setBackendOnline(false);
      }

      setMachines(machRes);
      setOverview(overviewRes);
      setFlowStages(flowRes.stages || []);
      if (scRes && scRes.length > 0) {
        setScenarios(scRes);
      }
    } catch (err) {
      console.error('Error refreshing backend data:', err);
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeScenario]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Handle Scenario Change
  const handleSelectScenario = async (scenarioId: string) => {
    setActiveScenario(scenarioId);
    try {
      await runScenario(scenarioId);
      await refreshData(scenarioId);
    } catch (err) {
      console.error(err);
    }
  };

  // Navigate cleanly from inspection drawer directly to the selected machine's predictive analysis
  const handleNavigateToPredictive = (machineId: string) => {
    setInspectingMachineId(null); // cleanly close drawer
    setPredictiveMachineId(machineId); // select the target machine
    setCurrentTab('predictive'); // switch tab
  };

  const faultCount = machines.filter(
    (m) => m.status === 'Fault' || m.status === 'Maintenance'
  ).length;

  const overallStatus = faultCount > 0 ? 'Needs Attention' : 'Normal';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Persistent Left Sidebar with 3 Main Tabs */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tabId) => {
          setInspectingMachineId(null);
          setCurrentTab(tabId);
        }}
        faultCount={faultCount}
        overallStatus={overallStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          currentTab={currentTab}
          activeScenario={activeScenario}
          scenarios={scenarios}
          onSelectScenario={handleSelectScenario}
          backendOnline={backendOnline}
          lastUpdated={lastUpdated}
          onRefresh={() => refreshData()}
          isLoading={isLoading}
          selectedMachineId={currentTab === 'predictive' ? predictiveMachineId : inspectingMachineId}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <OverviewDashboard
              machines={machines}
              overview={overview}
              flowStages={flowStages}
              onSelectMachine={(mid) => {
                setInspectingMachineId(mid);
                setPredictiveMachineId(mid);
              }}
              onNavigateToPredictive={handleNavigateToPredictive}
            />
          )}

          {currentTab === 'predictive' && (
            <PredictiveAnalysis
              machines={machines}
              selectedMachineId={predictiveMachineId}
              onSelectMachine={(mid) => {
                setPredictiveMachineId(mid);
              }}
              activeScenario={activeScenario}
            />
          )}

          {currentTab === '3d-factory' && (
            <DigitalTwin3DPage
              machines={machines}
              selectedMachineId={inspectingMachineId}
              onSelectMachine={(mid) => {
                setInspectingMachineId(mid);
                setPredictiveMachineId(mid);
              }}
              activeScenario={activeScenario}
            />
          )}
        </main>
      </div>

      {/* Machine Inspection Side Drawer */}
      {inspectingMachineId && (
        <MachineDetailModal
          machineId={inspectingMachineId}
          onClose={() => setInspectingMachineId(null)}
          onNavigateToPredictive={handleNavigateToPredictive}
          activeScenario={activeScenario}
        />
      )}
    </div>
  );
}

export default App;
