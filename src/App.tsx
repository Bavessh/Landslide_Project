import React, { useState, useEffect } from 'react';
import {
  Role,
  NERState,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  EmergencyBulletin,
  Language,
  NavigationTab,
  AffectedSettlement,
  RoadRisk,
  RouteOption,
  ShelterRecommendation
} from './types';
import { intelligenceService } from './services/intelligenceService';
import { apiClient } from './services/apiClient';
import { GovernmentHeader } from './components/layout/GovernmentHeader';
import { Sidebar } from './components/layout/Sidebar';
import { StateDistrictFilter } from './components/layout/StateDistrictFilter';
import { AuthorityOverview } from './components/authority/AuthorityOverview';
import { RiskIntelligencePage } from './components/authority/RiskIntelligencePage';
import { WeatherRainfallPage } from './components/authority/WeatherRainfallPage';
import { ImpactAnalysisPage } from './components/authority/ImpactAnalysisPage';
import { RoadIntelligencePage } from './components/authority/RoadIntelligencePage';
import { ShelterIntelligencePage } from './components/authority/ShelterIntelligencePage';
import { WhatIfSimulationPage } from './components/authority/WhatIfSimulationPage';
import { FieldEvidencePage } from './components/authority/FieldEvidencePage';
import { ResponsePrioritiesPage } from './components/authority/ResponsePrioritiesPage';
import { CitizenPortal } from './components/citizen/CitizenPortal';
import { RescueOperations } from './components/rescue/RescueOperations';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('AUTHORITY');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const [selectedState, setSelectedState] = useState<NERState | 'ALL'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  // Application Data States
  const [locations, setLocations] = useState<MonitoredLocation[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [shelters, setShelters] = useState<ShelterFacility[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [bulletins, setBulletins] = useState<EmergencyBulletin[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MonitoredLocation | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<AffectedSettlement | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadRisk | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<ShelterRecommendation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Load Data via Service Abstraction
  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [locs, rds, shls, reps, buls] = await Promise.all([
        intelligenceService.getLocations(
          selectedState !== 'ALL' ? selectedState : undefined,
          selectedDistrict !== 'ALL' ? selectedDistrict : undefined
        ),
        intelligenceService.getRoads(
          selectedState !== 'ALL' ? selectedState : undefined
        ),
        intelligenceService.getShelters(
          selectedState !== 'ALL' ? selectedState : undefined,
          selectedDistrict !== 'ALL' ? selectedDistrict : undefined
        ),
        intelligenceService.getFieldReports(
          selectedState !== 'ALL' ? selectedState : undefined
        ),
        intelligenceService.getBulletins(
          selectedState !== 'ALL' ? selectedState : undefined
        )
      ]);

      setLocations(locs);
      setRoads(rds);
      setShelters(shls);
      setFieldReports(reps);
      setBulletins(buls);
    } catch (err: any) {
      console.error('Failed to load operational data:', err);
      setLoadError(err?.message || 'Could not load data telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedState, selectedDistrict]);

  useEffect(() => {
    apiClient.health()
      .then((health) => setBackendConnected(health.status === 'healthy'))
      .catch(() => setBackendConnected(false));
  }, []);

  const handleSelectLocation = (location: MonitoredLocation | null) => {
    if (location?.id !== selectedLocation?.id) {
      setSelectedSettlement(null);
      setSelectedRoad(null);
      setSelectedRoute(null);
      setSelectedShelter(null);
    }
    setSelectedLocation(location);
  };

  useEffect(() => {
    const locationMatchesFilter = selectedLocation &&
      (selectedState === 'ALL' || selectedLocation.state === selectedState) &&
      (selectedDistrict === 'ALL' || selectedLocation.district === selectedDistrict);

    if (selectedLocation && !locationMatchesFilter) {
      handleSelectLocation(null);
      return;
    }

    const matchesFilter = (item: { state: NERState; district: string } | null) =>
      !!item &&
      (selectedState === 'ALL' || item.state === selectedState) &&
      (selectedDistrict === 'ALL' || item.district === selectedDistrict);

    if (!matchesFilter(selectedSettlement)) setSelectedSettlement(null);
    if (!matchesFilter(selectedRoad)) {
      setSelectedRoad(null);
      setSelectedRoute(null);
    }
    if (!matchesFilter(selectedShelter)) setSelectedShelter(null);
  }, [selectedState, selectedDistrict]);

  const handleFieldReportSubmit = async (
    newReport: Omit<FieldReport, 'id' | 'timestamp' | 'verifiedByAuthority'>
  ) => {
    await intelligenceService.addFieldReport(newReport);
    await loadData();
  };

  // Summary Metrics for Quick Counter Bar
  const summaryStats = {
    totalMonitored: locations.length,
    criticalCount: locations.filter((l) => l.riskLevel === 'CRITICAL').length,
    highCount: locations.filter((l) => l.riskLevel === 'HIGH').length,
    blockedRoadsCount: roads.filter((r) => r.status === 'BLOCKED').length,
    availableSheltersCount: shelters.filter((s) => s.status === 'AVAILABLE').length
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] text-[#172033] font-sans antialiased">
      {/* Official Government Header & Emergency Advisory Ticker */}
      <GovernmentHeader
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          handleSelectLocation(null);
        }}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        language={language}
        onLanguageChange={setLanguage}
        activeBulletins={bulletins}
        onViewAlertArea={(st, dist) => {
          setSelectedState(st);
          if (dist) setSelectedDistrict(dist);
        }}
        onGenerateWarning={() => {
          alert('CAP Emergency Warning Bulletin initiated for active sector.');
        }}
      />

      {/* State & District Navigation Filters with Multi-Tier Search & Live Counters */}
      <StateDistrictFilter
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        onStateChange={setSelectedState}
        onDistrictChange={setSelectedDistrict}
        locations={locations}
        roads={roads}
        shelters={shelters}
        onSelectLocation={handleSelectLocation}
        summaryStats={summaryStats}
      />

      {currentRole === 'AUTHORITY' && (selectedLocation || selectedSettlement || selectedRoad || selectedRoute || selectedShelter) && (
        <div className="bg-white border-b border-[#DDE2E7] px-3 py-1.5 text-[10px] text-[#172033] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-bold uppercase tracking-wider text-[#1D4E89]">Active Response Chain</span>
          {selectedLocation && <span><strong>Hazard:</strong> {selectedLocation.name}</span>}
          {selectedSettlement && <span><strong>Settlement:</strong> {selectedSettlement.name}</span>}
          {selectedRoad && <span><strong>Road:</strong> {selectedRoad.name}</span>}
          {selectedRoute && <span><strong>Route:</strong> {selectedRoute.name}</span>}
          {selectedShelter && <span><strong>Shelter:</strong> {selectedShelter.name}</span>}
        </div>
      )}

      {backendConnected !== null && (
        <div className={`px-3 py-1 text-[10px] border-b ${backendConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
          {backendConnected ? 'BACKEND CONNECTED' : 'BACKEND UNAVAILABLE • PROTOTYPE FALLBACK ACTIVE'}
        </div>
      )}

      {/* Main Layout: Collapsible Sidebar + Workspace */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Authority Navigation Sidebar (Only for Authority role) */}
        {currentRole === 'AUTHORITY' && (
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Content Workspace Area */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {isLoading && locations.length === 0 ? (
            <LoadingState message="Loading NER GIS layers and telemetry..." />
          ) : loadError ? (
            <ErrorState
              title="Telemetry Synchronization Error"
              message={loadError}
              onRetry={loadData}
            />
          ) : (
            <>
              {currentRole === 'AUTHORITY' && (
                <>
                  {currentTab === 'overview' && (
                    <AuthorityOverview
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'risk_intelligence' && (
                    <RiskIntelligencePage
                      selectedLocation={selectedLocation}
                      locations={locations}
                      selectedState={selectedState === 'ALL' ? (selectedLocation?.state || 'Nagaland') : selectedState}
                      selectedDistrict={selectedDistrict}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'weather' && (
                    <WeatherRainfallPage
                      selectedLocation={selectedLocation}
                      locations={locations}
                      selectedState={selectedState === 'ALL' ? (selectedLocation?.state || 'Nagaland') : selectedState}
                      selectedDistrict={selectedDistrict}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'impact' && (
                    <ImpactAnalysisPage
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      selectedSettlement={selectedSettlement}
                      onSelectSettlement={setSelectedSettlement}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'roads' && (
                    <RoadIntelligencePage
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      selectedSettlement={selectedSettlement}
                      selectedRoad={selectedRoad}
                      selectedRoute={selectedRoute}
                      onSelectRoad={(road) => {
                        setSelectedRoad(road);
                        setSelectedRoute(null);
                      }}
                      onSelectRoute={setSelectedRoute}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'shelters' && (
                    <ShelterIntelligencePage
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      selectedSettlement={selectedSettlement}
                      selectedRoad={selectedRoad}
                      selectedRoute={selectedRoute}
                      selectedShelter={selectedShelter}
                      onSelectShelter={setSelectedShelter}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'what_if' && (
                    <WhatIfSimulationPage
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      selectedRoad={selectedRoad}
                      selectedRoute={selectedRoute}
                      selectedShelter={selectedShelter}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'field_reports' && (
                    <FieldEvidencePage
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      fieldReports={fieldReports}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {currentTab === 'response_priorities' && (
                    <ResponsePrioritiesPage
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}

                  {/* Fallback for other authority tabs */}
                  {!['overview', 'risk_intelligence', 'weather', 'impact', 'roads', 'shelters', 'what_if', 'field_reports', 'response_priorities'].includes(currentTab) && (
                    <AuthorityOverview
                      selectedState={selectedState}
                      selectedDistrict={selectedDistrict}
                      locations={locations}
                      roads={roads}
                      shelters={shelters}
                      fieldReports={fieldReports}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleSelectLocation}
                      onNavigateTab={(tab) => setCurrentTab(tab)}
                    />
                  )}
                </>
              )}

              {currentRole === 'CITIZEN' && (
                <CitizenPortal
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  locations={locations}
                  shelters={shelters}
                  onSubmitFieldReport={handleFieldReportSubmit}
                />
              )}

              {currentRole === 'RESCUE' && (
                <RescueOperations
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  locations={locations}
                  roads={roads}
                  fieldReports={fieldReports}
                  onSelectLocation={(loc) => {
                    handleSelectLocation(loc);
                    setCurrentRole('AUTHORITY');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Official Standard Disclosure Footer */}
      <footer className="bg-[#FFFFFF] border-t border-[#DDE2E7] px-3 py-1.5 text-xs text-[#5F6877] flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
          <span className="font-semibold text-[#172033]">
            NER-LENS Landslide Intelligence Platform
          </span>
          <span>•</span>
          <span>Coverage: 8 North Eastern States</span>
          <span>•</span>
          <span>Base Map: OpenStreetMap (EPSG:4326)</span>
          <span>•</span>
          <span className="text-amber-800 font-medium">
            AI estimate — not a guaranteed prediction
          </span>
        </div>
        <div className="text-[10px] text-slate-500">
          Smart India Hackathon • Ministry of DoNER / NDMA Emergency Prototype
        </div>
      </footer>
    </div>
  );
}
