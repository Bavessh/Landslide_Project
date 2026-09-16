import React, { useState } from 'react';
import { NERState, MonitoredLocation, ShelterFacility, FieldReport } from '../../types';
import { DataTruthfulnessBadge } from '../common/DataTruthfulnessBadge';
import {
  ShieldAlert,
  MapPin,
  Compass,
  Home,
  Camera,
  AlertTriangle,
  PhoneCall,
  Send,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  locations: MonitoredLocation[];
  shelters: ShelterFacility[];
  onSubmitFieldReport: (report: Omit<FieldReport, 'id' | 'timestamp' | 'verifiedByAuthority'>) => void;
}

export const CitizenPortal: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  locations,
  shelters,
  onSubmitFieldReport
}) => {
  // Field hazard reporting state
  const [reportCategory, setReportCategory] = useState<FieldReport['category']>('SLOPE_CRACK');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Highest severity location in citizen's area
  const localLocations = locations.filter((l) => {
    if (selectedState !== 'ALL' && l.state !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && l.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
    return true;
  });

  const dominantRiskLocation = localLocations.sort((a, b) => b.riskScore - a.riskScore)[0] || locations[0];

  const nearbyShelters = shelters.filter((s) => {
    if (selectedState !== 'ALL' && s.state !== selectedState) return false;
    return true;
  });

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc || !reportLocation) return;

    onSubmitFieldReport({
      locationName: reportLocation,
      state: selectedState === 'ALL' ? 'Nagaland' : selectedState,
      district: selectedDistrict === 'ALL' ? 'Kohima' : selectedDistrict,
      lat: dominantRiskLocation ? dominantRiskLocation.lat + 0.005 : 25.68,
      lng: dominantRiskLocation ? dominantRiskLocation.lng + 0.005 : 94.05,
      category: reportCategory,
      severity: reportCategory === 'SLOPE_CRACK' || reportCategory === 'ROAD_COLLAPSE' ? 'CRITICAL' : 'HIGH',
      reporterType: 'CITIZEN',
      description: reportDesc
    });

    setSubmittedMessage(true);
    setReportDesc('');
    setReportLocation('');
    setTimeout(() => setSubmittedMessage(false), 5000);
  };

  const getCitizenBanner = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          title: 'RED ALERT: EVACUATION RECOMMENDED FOR HILLSIDE RESIDENTS',
          bg: 'bg-red-700 text-white',
          advice: 'Immediate caution. Move away from steep slopes, hill cuttings, and natural drainage ravines immediately. Follow community ward instructions.'
        };
      case 'HIGH':
        return {
          title: 'ORANGE WARNING: HIGH LANDSLIDE SUSCEPTIBILITY',
          bg: 'bg-orange-600 text-white',
          advice: 'Heavy rainfall saturation. Avoid travel along mountain roads. Stay prepared to evacuate if ground cracking or unusual spring water seepage is observed.'
        };
      case 'MODERATE':
        return {
          title: 'YELLOW ADVISORY: MODERATE LANDSLIDE WATCH',
          bg: 'bg-amber-600 text-white',
          advice: 'Rainfall is increasing. Keep emergency lights and battery radios ready. Clear roof drainage away from slope edges.'
        };
      default:
        return {
          title: 'NORMAL: LOW RISK IN MONITORED SECTORS',
          bg: 'bg-emerald-700 text-white',
          advice: 'Slopes in normal baseline range. Continue monitoring local weather updates.'
        };
    }
  };

  const banner = getCitizenBanner(dominantRiskLocation?.riskLevel || 'LOW');

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Official Citizen Emergency Status Header */}
      <div className={`p-4 rounded-md shadow-sm ${banner.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span className="font-bold text-xs uppercase tracking-wider text-white/90">
              State Disaster Management Citizen Advisory
            </span>
          </div>
          <DataTruthfulnessBadge provenance="AI PREDICTION" size="sm" />
        </div>
        <h2 className="text-lg font-black tracking-tight">{banner.title}</h2>
        <p className="text-sm mt-1 text-white/95 leading-relaxed">{banner.advice}</p>
        <div className="mt-3 pt-2 border-t border-white/20 text-xs flex flex-wrap items-center justify-between gap-2">
          <span>
            Active Region:{' '}
            <strong>
              {selectedDistrict !== 'ALL' ? `${selectedDistrict} District, ` : ''}
              {selectedState !== 'ALL' ? selectedState : 'North Eastern Region'}
            </strong>
          </span>
          <span className="text-white/80 italic text-[11px]">
            AI estimate — not a guaranteed prediction. In emergency, call 112 or 1070.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nearest Safe Evacuation Shelter Card */}
        <div className="bg-white p-5 rounded-md border border-[#DDE2E7] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#1D4E89] font-bold text-sm border-b border-slate-200 pb-2">
            <Home className="w-4 h-4 text-[#1D4E89]" />
            <h3>Your Nearest Safe Evacuation Shelter</h3>
          </div>

          {nearbyShelters.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3 bg-[#F8F9FA] rounded border border-[#DDE2E7]">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-[#172033]">{nearbyShelters[0].name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {nearbyShelters[0].status}
                  </span>
                </div>
                <p className="text-xs text-[#5F6877] mt-1">
                  {nearbyShelters[0].district} • Capacity: {nearbyShelters[0].capacity} persons
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs flex flex-wrap gap-2 text-[#172033]">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    Medical Post: {nearbyShelters[0].hasMedicalPost ? 'Available' : 'No'}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    Food & Water: {nearbyShelters[0].hasFoodWaterSupply ? 'Stocked' : 'Limited'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[#5F6877]">Officer: {nearbyShelters[0].officerInCharge}</span>
                  <a
                    href={`tel:${nearbyShelters[0].contactNumber}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1D4E89] text-white rounded text-xs font-semibold hover:bg-[#153966]"
                  >
                    <PhoneCall className="w-3 h-3" />
                    Call Officer
                  </a>
                </div>
              </div>

              {nearbyShelters.length > 1 && (
                <div className="text-xs text-[#5F6877]">
                  <strong>Alternative Option:</strong> {nearbyShelters[1].name} ({nearbyShelters[1].district})
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#5F6877]">No designated shelters registered in selected filter.</p>
          )}

          {/* Emergency Helplines Box */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-[#172033] block">Toll-Free Emergency Helpline Numbers:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5F6877]">
              <div>National Disaster: <strong>1070</strong></div>
              <div>Police & Emergency: <strong>112</strong></div>
              <div>State Control Room: <strong>1077</strong></div>
              <div>Ambulance: <strong>108</strong></div>
            </div>
          </div>
        </div>

        {/* Community Hazard Reporting Form */}
        <div className="bg-white p-5 rounded-md border border-[#DDE2E7] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#1D4E89] font-bold text-sm border-b border-slate-200 pb-2">
            <Camera className="w-4 h-4 text-[#1D4E89]" />
            <h3>Report Hazard (Slope Cracks / Rockfall)</h3>
          </div>

          <p className="text-xs text-[#5F6877]">
            Citizen field alerts inform the State Emergency Operations Center and trigger instant re-evaluation of slope risks.
          </p>

          {submittedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Report successfully sent to Emergency Operations Control. Thank you for keeping your community safe.</span>
            </div>
          )}

          <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
            <div>
              <label htmlFor="report-location-input" className="block font-semibold text-[#172033] mb-1">
                Specific Location / Milestone / Village:
              </label>
              <input
                id="report-location-input"
                type="text"
                required
                placeholder="e.g., Near Sechü Zubza milestone 42, hillside cutting"
                value={reportLocation}
                onChange={(e) => setReportLocation(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#DDE2E7] rounded px-3 py-2 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#1D4E89]"
              />
            </div>

            <div>
              <label htmlFor="report-category-select" className="block font-semibold text-[#172033] mb-1">Hazard Category:</label>
              <select
                id="report-category-select"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as FieldReport['category'])}
                className="w-full bg-[#F8F9FA] border border-[#DDE2E7] rounded px-3 py-2 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#1D4E89]"
              >
                <option value="SLOPE_CRACK">Ground / Slope Tension Crack</option>
                <option value="ROCKFALL">Rockfall / Falling Boulders</option>
                <option value="BLOCKED_CULVERT">Blocked Hill Drainage / Overflowing Culvert</option>
                <option value="WATER_SEEPAGE">Unusual Muddy Spring Water Seepage</option>
                <option value="ROAD_COLLAPSE">Road Shoulder Subsidence / Collapse</option>
              </select>
            </div>

            <div>
              <label htmlFor="report-desc-input" className="block font-semibold text-[#172033] mb-1">Detailed Observation:</label>
              <textarea
                id="report-desc-input"
                rows={3}
                required
                placeholder="Describe size of cracks, movement noticed, leaning trees, or blocked paths..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#DDE2E7] rounded px-3 py-2 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#1D4E89]"
              />
            </div>

            <button
              id="citizen-submit-hazard-btn"
              type="submit"
              className="w-full bg-[#1D4E89] hover:bg-[#153966] text-white font-semibold py-2 px-4 rounded text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Hazard Report to Emergency Authority
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
