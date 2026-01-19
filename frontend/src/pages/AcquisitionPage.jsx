import React, { useState, useEffect } from 'react';
import { getCookie } from '../utils/csrf';

const AcquisitionPage = () => {
  const [status, setStatus] = useState({ running: false, status_text: 'Ładowanie...' });
  const [stats, setStats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const API_URL = 'http://localhost:8000';

  const fetchData = async () => {
    try {
      const resStatus = await fetch(`${API_URL}/acquisition/api/status/`, { credentials: 'include' });
      const dataStatus = await resStatus.json();
      setStatus(dataStatus);

      const resStats = await fetch(`${API_URL}/acquisition/api/stats/`, { credentials: 'include' });
      const dataStats = await resStats.json();
      if (dataStats.stats) setStats(dataStats.stats);

      const resLogs = await fetch(`${API_URL}/acquisition/api/logs/?level=ERROR`);
      const dataLogs = await resLogs.json();
      if (dataLogs.logs) setLogs(dataLogs.logs);

    } catch (err) {
      console.error("Błąd pobierania danych", err);
    }
  };

  const handleControl = async (action) => {
    setLoading(true);
    setMsg(null);
    try {
      const csrftoken = getCookie('csrftoken') || '';

      const response = await fetch(`${API_URL}/acquisition/api/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },

        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(prev => ({ ...prev, running: data.running }));
        setMsg({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMsg({ type: 'error', text: 'Błąd: ' + data.error });
      }
    } catch (error) {
      console.error('Błąd akcji:', error);
      setMsg({ type: 'error', text: 'Wystąpił błąd podczas wysyłania żądania' });
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Panel Akwizycji Danych</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h2 className="text-xl font-semibold mb-4">Sterowanie Procesem MQTT</h2>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-600 mr-2">Status usługi:</span>
            <span className={`font-bold px-3 py-1 rounded ${status.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status.status_text}
            </span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => handleControl('start')}
              disabled={status.running || loading}
              className={`px-4 py-2 rounded text-white ${status.running ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Uruchom
            </button>
            <button
              onClick={() => handleControl('stop')}
              disabled={!status.running || loading}
              className={`px-4 py-2 rounded text-white ${!status.running ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Zatrzymaj
            </button>
          </div>
        </div>
        {msg && <div className={`mt-4 p-2 rounded ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Status Czujników</h3>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-2">Nazwa</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Pomiary</th>
                  <th className="px-4 py-2">Ostatnia aktyw.</th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">Brak danych</td></tr>
                ) : stats.map((s, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{s.sensor_name}</td>
                    <td className="px-4 py-2">{s.status}</td>
                    <td className="px-4 py-2">{s.total_measurements}</td>
                    <td className="px-4 py-2 text-gray-500">{s.last_seen ? new Date(s.last_seen).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-red-600">Ostatnie Błędy (DataLogs)</h3>
          <div className="overflow-auto max-h-96 bg-gray-50 p-2 rounded border">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center">Brak błędów.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li key={log.id} className="text-sm p-2 bg-white border-l-2 border-red-500 shadow-sm">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="font-bold text-red-500">{log.level}</span>
                    </div>
                    <p className="text-gray-800 break-words">{log.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionPage;