import React, { useState } from 'react';
import { EmergencyBulletin, MonitoredLocation, NERState } from '../../types';
import { apiClient, ApiError } from '../../services/apiClient';
import { AlertTriangle, Bell, RefreshCw, Send } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

interface Props {
  selectedState: NERState | 'ALL';
  selectedDistrict: string;
  bulletins: EmergencyBulletin[];
  selectedLocation: MonitoredLocation | null;
  backendConnected: boolean | null;
  onRefresh: () => Promise<void>;
}

export const AlertsBulletinsPage: React.FC<Props> = ({
  selectedState,
  selectedDistrict,
  bulletins,
  selectedLocation,
  backendConnected,
  onRefresh
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = bulletins.filter((bulletin) => {
    const stateMatch = selectedState === 'ALL' || bulletin.targetState === selectedState;
    const districtMatch =
      selectedDistrict === 'ALL' ||
      bulletin.targetDistricts.length === 0 ||
      bulletin.targetDistricts.some((district) => district.toLowerCase() === selectedDistrict.toLowerCase());
    return stateMatch && districtMatch;
  });

  const generateWarning = async () => {
    setNotice(null);

    if (!backendConnected) {
      setNotice({ type: 'error', text: 'Backend offline. No warning was generated.' });
      return;
    }

    if (!selectedLocation || !/^\d+$/.test(selectedLocation.id)) {
      setNotice({
        type: 'error',
        text: 'Select a backend-backed monitored location before generating an early warning.'
      });
      return;
    }

    setIsGenerating(true);
    try {
      await apiClient.post(`/v1/alerts/auto-generate/${selectedLocation.id}`);
      await onRefresh();
      setNotice({ type: 'success', text: 'Warning generation request completed and alerts were refreshed.' });
    } catch (error) {
      const message = error instanceof ApiError
        ? `Warning generation failed (HTTP ${error.status || 'unavailable'}).`
        : 'Warning generation failed.';
      setNotice({ type: 'error', text: message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#F6F7F9] p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white border border-[#DDE2E7] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
              <Bell className="w-4 h-4 text-[#1D4E89]" />
              ALERTS & BULLETINS
            </div>
            <p className="text-xs text-[#5F6877] mt-1">
              Backend alert register and authority warning-generation controls.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void onRefresh()}
              className="px-3 py-2 border border-[#DDE2E7] rounded text-xs text-[#1D4E89] font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={() => void generateWarning()}
              disabled={isGenerating}
              className="px-3 py-2 bg-[#1D4E89] text-white rounded text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating…' : 'Generate Warning'}
            </button>
          </div>
        </div>

        <div className={`border rounded p-3 text-xs ${
          backendConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {backendConnected
            ? 'Backend connected. Warning actions use the project alert API.'
            : 'Backend offline. Existing prototype/fallback bulletins may still be visible, but no alert will be presented as newly generated.'}
        </div>

        {notice && (
          <div className={`border rounded p-3 text-xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notice.text}
          </div>
        )}

        <div className="bg-white border border-[#DDE2E7] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DDE2E7] flex items-center justify-between">
            <strong className="text-xs text-[#172033]">Alert register</strong>
            <span className="text-[10px] text-[#5F6877]">{filtered.length} visible</span>
          </div>

          <div className="divide-y divide-[#EEF1F4]">
            {filtered.map((bulletin) => (
              <article key={bulletin.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#172033]">{bulletin.title}</h3>
                    <p className="text-[11px] text-[#5F6877] mt-0.5">
                      {bulletin.targetState}
                      {bulletin.targetDistricts.length > 0 ? ` • ${bulletin.targetDistricts.join(', ')}` : ' • General target'}
                    </p>
                  </div>
                  <RiskBadge level={bulletin.severity} size="sm" />
                </div>

                <p className="text-xs text-[#172033]">{bulletin.summary || 'No message available.'}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] bg-[#F8F9FA] border border-[#DDE2E7] rounded p-2">
                  <div><span className="text-[#5F6877] block">Created</span><strong>{bulletin.issuedAt || 'Unavailable'}</strong></div>
                  <div><span className="text-[#5F6877] block">Valid until</span><strong>{bulletin.validUntil || 'Unavailable'}</strong></div>
                  <div><span className="text-[#5F6877] block">Source</span><strong>{bulletin.issuedBy || 'Unavailable'}</strong></div>
                </div>

                {bulletin.instructions.length > 0 && (
                  <div className="text-[10px] text-[#5F6877]">
                    {bulletin.instructions.join(' • ')}
                  </div>
                )}
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-[#5F6877] flex flex-col items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                No alerts match the active state and district filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
