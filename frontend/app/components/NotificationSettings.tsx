import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationSettings as Settings } from '../hooks/useNotifications';
import { Bell, BellOff, Volume2, VolumeX, Settings as SettingsIcon, TestTube, Check, X } from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper functions to reduce cognitive complexity
const getPermissionStatusStyle = (permission: NotificationPermission) => {
  if (permission === 'granted') return 'bg-green-100 text-green-800';
  if (permission === 'denied') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const getPermissionStatusText = (permission: NotificationPermission) => {
  if (permission === 'granted') return 'Granted';
  if (permission === 'denied') return 'Denied';
  return 'Not Requested';
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    permission,
    settings,
    isSupported,
    requestPermission,
    updateSettings,
    testNotification,
    canSendNotifications,
  } = useNotifications();

  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    const success = await testNotification();
    setTestResult(success ? 'success' : 'error');
    
    // Clear test result after 3 seconds
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleNotificationTypeChange = (type: keyof Settings['notificationTypes'], enabled: boolean) => {
    updateSettings({
      notificationTypes: {
        ...settings.notificationTypes,
        [type]: enabled,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isSupported ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <BellOff className="h-5 w-5" />
              <span className="font-medium">Notifications Not Supported</span>
            </div>
            <p className="text-red-600 text-sm mt-1">
              Your browser doesn't support desktop notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Permission Status */}
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Permission Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionStatusStyle(permission)}`}>
                  {getPermissionStatusText(permission)}
                </span>
              </div>
              
              {permission !== 'granted' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {permission === 'denied'
                      ? 'Notifications are blocked. Please enable them in your browser settings.'
                      : 'Click the button below to enable desktop notifications for reminders.'}
                  </p>
                  
                  {permission !== 'denied' && (
                    <button
                      onClick={handleRequestPermission}
                      disabled={requesting}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                      {requesting ? 'Requesting...' : 'Enable Notifications'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Main Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Enable Notifications</h3>
                <p className="text-sm text-gray-600">Receive desktop notifications for reminders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <span className="sr-only">Enable notifications</span>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                  disabled={permission !== 'granted'}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Sound Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    Sound Alerts
                  </h3>
                  <p className="text-sm text-gray-600">Play a sound when notifications appear</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <span className="sr-only">Enable sound alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                    disabled={!settings.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Volume Control */}
              {settings.soundEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {Math.round(settings.soundVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.soundVolume}
                    onChange={(e) => handleSettingChange('soundVolume', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              )}
            </div>

            {/* Background Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Background Notifications</h3>
                <p className="text-sm text-gray-600">Show notifications when app is not in focus</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <span className="sr-only">Enable background notifications</span>
                <input
                  type="checkbox"
                  checked={settings.showInBackground}
                  onChange={(e) => handleSettingChange('showInBackground', e.target.checked)}
                  disabled={!settings.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Notification Types */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Notification Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Overdue Reminders</span>
                    <p className="text-xs text-gray-500">When a reminder is past due</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <span className="sr-only">Enable overdue reminder notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notificationTypes.overdue}
                      onChange={(e) => handleNotificationTypeChange('overdue', e.target.checked)}
                      disabled={!settings.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Upcoming Reminders</span>
                    <p className="text-xs text-gray-500">When a reminder is due soon</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <span className="sr-only">Enable upcoming reminder notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notificationTypes.upcoming}
                      onChange={(e) => handleNotificationTypeChange('upcoming', e.target.checked)}
                      disabled={!settings.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Recurring Reminders</span>
                    <p className="text-xs text-gray-500">When a recurring reminder is triggered</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <span className="sr-only">Enable recurring reminder notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notificationTypes.recurrence}
                      onChange={(e) => handleNotificationTypeChange('recurrence', e.target.checked)}
                      disabled={!settings.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Test Notification */}
            {canSendNotifications && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Test Notifications</h3>
                    <p className="text-sm text-gray-600">Send a test notification to verify settings</p>
                  </div>
                  <button
                    onClick={handleTestNotification}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <TestTube className="h-4 w-4" />
                    Test
                  </button>
                </div>
                
                {testResult && (
                  <div className={`mt-2 p-2 rounded-md flex items-center gap-2 text-sm ${
                    testResult === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {testResult === 'success' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Test notification sent successfully!
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Failed to send test notification
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;