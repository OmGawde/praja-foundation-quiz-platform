import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    platformName: 'PRAJA QUIZ', heroText: '', openRegistration: true,
    autoApproveHosts: false, publicLeaderboards: true, defaultLanguage: 'en', timezone: 'Asia/Kolkata'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved!');
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSettings({ ...settings, logoUrl: res.data.url });
      toast.success('Logo uploaded!');
    } catch (err) { toast.error('Upload failed'); }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to their default values? This cannot be undone.')) return;
    try {
      const res = await api.delete('/settings');
      setSettings(res.data);
      toast.success('Settings reset to defaults');
    } catch (err) { toast.error('Failed to reset settings'); }
  };

  const Toggle = ({ checked, onChange }) => (
    <div className="relative cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
        <div className={`absolute top-[2px] w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}></div>
      </div>
    </div>
  );

  return (
    <div className="p-8 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
      {/* Header — Stitch Design 13 */}
      <div className="mb-12">
        <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mb-2">Platform Settings</h1>
        <p className="text-on-surface-variant">Manage global configurations and core platform identity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* General Identity */}
        <section className="lg:col-span-2 bg-surface-container-low rounded-xl p-8 flex flex-col gap-8">
          <div className="border-b border-outline-variant/15 pb-4">
            <h2 className="text-lg font-headline font-semibold text-on-surface">General Identity</h2>
            <p className="text-sm text-on-surface-variant mt-1">Configure the public-facing identity of the national platform.</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-semibold">Platform Name</label>
              <input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface input-focus-ring w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-semibold">Homepage Hero Text</label>
              <textarea value={settings.heroText} onChange={(e) => setSettings({ ...settings, heroText: e.target.value })} rows={3}
                className="bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface input-focus-ring w-full resize-none" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-semibold">Brand Logo</span>
              {settings.logoUrl ? (
                <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col items-center justify-center gap-4 ghost-border relative">
                  <img src={settings.logoUrl} alt="Brand Logo" className="h-20 object-contain" />
                  <button onClick={() => setSettings({ ...settings, logoUrl: '' })} className="text-sm text-error hover:underline absolute top-4 right-4">Remove</button>
                </div>
              ) : (
                <label className="bg-surface-container-lowest rounded-xl p-6 flex flex-col items-center justify-center gap-4 border border-outline-variant/15 border-dashed relative overflow-hidden group hover:bg-surface transition-colors cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-2">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-on-surface">Click to upload new logo</p>
                    <p className="text-sm text-on-surface-variant mt-1">SVG, PNG, or JPG (max. 2MB)</p>
                  </div>
                  <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
          </div>
          <div className="mt-auto pt-4 flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="gradient-primary text-on-primary px-8 py-3 rounded-xl font-medium transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/15 flex items-center gap-2 disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">save</span>
              {saving ? 'Saving...' : 'Save Identity Changes'}
            </button>
          </div>
        </section>

        {/* Right Column */}
        <div className="flex flex-col gap-8 lg:col-span-1">
          {/* Permissions */}
          <section className="bg-surface-container-lowest rounded-xl p-6 ghost-border flex flex-col gap-6 ambient-shadow">
            <div className="border-b border-outline-variant/15 pb-3">
              <h2 className="font-headline font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>Permissions
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              <div 
                onClick={() => setSettings({ ...settings, openRegistration: !settings.openRegistration })}
                className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-surface-container-low transition-colors -mx-3"
              >
                <span className="text-sm text-on-surface font-medium">Open Registration</span>
                <Toggle checked={settings.openRegistration} onChange={() => {}} />
              </div>
              <div 
                onClick={() => setSettings({ ...settings, autoApproveHosts: !settings.autoApproveHosts })}
                className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-surface-container-low transition-colors -mx-3"
              >
                <span className="text-sm text-on-surface font-medium">Auto-approve Hosts</span>
                <Toggle checked={settings.autoApproveHosts} onChange={() => {}} />
              </div>
              <div 
                onClick={() => setSettings({ ...settings, publicLeaderboards: !settings.publicLeaderboards })}
                className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-surface-container-low transition-colors -mx-3"
              >
                <span className="text-sm text-on-surface font-medium">Public Leaderboards</span>
                <Toggle checked={settings.publicLeaderboards} onChange={() => {}} />
              </div>
            </div>
          </section>

          {/* Global Defaults */}
          <section className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-6">
            <div className="border-b border-outline-variant/15 pb-3">
              <h2 className="font-headline font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>Global Defaults
              </h2>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-semibold">Default Language</label>
                <select value={settings.defaultLanguage} onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  className="bg-surface-container-highest border-none rounded-lg px-4 py-2 text-on-surface input-focus-ring">
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-semibold">System Timezone</label>
                <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="bg-surface-container-highest border-none rounded-lg px-4 py-2 text-on-surface input-focus-ring">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-error-container/30 rounded-xl p-6 border border-error/20 flex flex-col gap-4">
            <h3 className="font-semibold text-error flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>Danger Zone
            </h3>
            <p className="text-sm text-on-surface-variant">Actions here are irreversible. Proceed with caution.</p>
            <button onClick={handleResetDefaults} className="bg-error/10 text-error hover:bg-error/20 px-4 py-2 rounded-lg font-medium text-sm transition-colors w-full text-center mt-2 border border-error/20">
              Reset Platform Defaults
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
