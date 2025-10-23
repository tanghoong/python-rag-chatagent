import { Link } from "react-router";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Settings {
  timezone: string;
  theme: string;
  apiUrl: string;
  showTimestamps: boolean;
  showThoughtProcess: boolean;
  enableVoiceInput: boolean;
  enableKeyboardShortcuts: boolean;
  maxTokens: number;
  temperature: number;
}

const DEFAULT_SETTINGS: Settings = {
  timezone: "UTC+8",
  theme: "dark",
  apiUrl: "http://localhost:8000",
  showTimestamps: true,
  showThoughtProcess: true,
  enableVoiceInput: true,
  enableKeyboardShortcuts: true,
  maxTokens: 2048,
  temperature: 0.7,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
        toast.error("Failed to load saved settings");
      }
    }
  }, []);

  const handleChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("appSettings", JSON.stringify(settings));
      setHasChanges(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast.info("Settings reset to defaults");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/chat"
                className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <h1 className="text-2xl font-bold gradient-text">Settings</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* General Settings */}
          <section className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">General</h2>
            <div className="space-y-4">
              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="UTC+8">UTC+8 (Singapore, Hong Kong, Beijing)</option>
                  <option value="UTC+0">UTC+0 (London, GMT)</option>
                  <option value="UTC-5">UTC-5 (New York, EST)</option>
                  <option value="UTC-8">UTC-8 (Los Angeles, PST)</option>
                  <option value="UTC+9">UTC+9 (Tokyo, JST)</option>
                  <option value="UTC+5:30">UTC+5:30 (India)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Current time: {new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })}
                </p>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange("theme", e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light (Coming Soon)</option>
                  <option value="auto">Auto (Coming Soon)</option>
                </select>
              </div>
            </div>
          </section>

          {/* API Settings */}
          <section className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">API Configuration</h2>
            <div className="space-y-4">
              {/* API URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={settings.apiUrl}
                  onChange={(e) => handleChange("apiUrl", e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Backend API endpoint URL
                </p>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Tokens: {settings.maxTokens}
                </label>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) => handleChange("maxTokens", Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>512</span>
                  <span>8192</span>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => handleChange("temperature", Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 (Focused)</span>
                  <span>2 (Creative)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Display Settings */}
          <section className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Display</h2>
            <div className="space-y-4">
              <ToggleSetting
                label="Show Message Timestamps"
                description="Display when messages were sent"
                checked={settings.showTimestamps}
                onChange={(checked) => handleChange("showTimestamps", checked)}
              />
              <ToggleSetting
                label="Show Thought Process"
                description="Display AI agent reasoning steps"
                checked={settings.showThoughtProcess}
                onChange={(checked) => handleChange("showThoughtProcess", checked)}
              />
            </div>
          </section>

          {/* Feature Settings */}
          <section className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
            <div className="space-y-4">
              <ToggleSetting
                label="Enable Voice Input"
                description="Use microphone to speak messages"
                checked={settings.enableVoiceInput}
                onChange={(checked) => handleChange("enableVoiceInput", checked)}
              />
              <ToggleSetting
                label="Enable Keyboard Shortcuts"
                description="Use keyboard shortcuts for quick actions"
                checked={settings.enableKeyboardShortcuts}
                onChange={(checked) => handleChange("enableKeyboardShortcuts", checked)}
              />
            </div>
          </section>

          {/* About */}
          <section className="glass rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">About</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <strong>Version:</strong> 1.0.0
              </p>
              <p>
                <strong>Build:</strong> Production
              </p>
              <p>
                <strong>Framework:</strong> React Router v7 + FastAPI
              </p>
              <p>
                <strong>AI Model:</strong> Google Gemini 2.0 Flash
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ label, description, checked, onChange }: Readonly<ToggleSettingProps>) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          checked ? "bg-purple-500" : "bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
