import React, { useEffect, useState } from 'react';
import { Bell, Plus, AlertTriangle, Info, CheckCircle2, X, Trash2, SquarePen } from 'lucide-react';

const AlarmsPage = () => {
    const [showAddRuleModal, setShowAddRuleModal] = useState(false);
    const [rules, setRules] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [ackId, setAckId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        target_metric: '',
        operator: 'GREATER_THAN',
        threshold_min: '',
        threshold_max: '',
        duration_seconds: 0,
        priority: 'MEDIUM'
    });
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchRules = async () => {
        setRulesLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/alert-rules/');
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            // Expecting DRF list response: either array or {results: []}
            setRules(Array.isArray(data) ? data : data.results || data.alerts || []);
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się pobrać reguł.' });
        } finally {
            setRulesLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    
    const fetchAlerts = async () => {
        setAlertsLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/alerts/');
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            // Expecting DRF list response: either array or {results: []}
            setAlerts(Array.isArray(data) ? data : data.results || data.alerts || []);
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się pobrać alarmów.' });
        } finally {
            setAlertsLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleDelete = async (ruleId) => {
        const confirmed = window.confirm('Czy na pewno chcesz usunąć tę regułę?');
        if (!confirmed) return;
        setDeletingId(ruleId);
        try {
            const res = await fetch(`http://localhost:8000/api/alert-rules/${ruleId}/`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Delete failed');
            setNotification({ type: 'success', message: 'Reguła została usunięta.' });
            fetchRules();
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się usunąć reguły.' });
        } finally {
            setDeletingId(null);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleAckAlert = async (alertId, comment) => {
        const confirmed = window.confirm('Do you want to ack?');
        if (!confirmed) return;
        setAckId(alertId);
        try {
            const res = await fetch(`http://localhost:8000/api/alerts/${alertId}/acknowledge/`, {
                method: 'POST',
                content: {
                    "comment": comment
                }
            });
            if (!res.ok) throw new Error('Ack failed');
            setNotification({ type: 'success', message: 'Alarm potwierdzony' });
            fetchAlerts();
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się potweirdzić alarmu' });
        } finally {
            setAckId(null);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchAlerts();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Prepare data for API
            const ruleData = {
                name: formData.name,
                target_metric: formData.target_metric,
                operator: formData.operator,
                threshold_min: formData.threshold_min ? parseFloat(formData.threshold_min) : null,
                threshold_max: formData.threshold_max ? parseFloat(formData.threshold_max) : null,
                duration_seconds: parseInt(formData.duration_seconds) || 0,
                priority: formData.priority
            };

            const response = await fetch('http://localhost:8000/api/alert-rules/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ruleData)
            });

            if (response.ok) {
                setNotification({
                    type: 'success',
                    message: 'Reguła alarmu została pomyślnie utworzona!'
                });
                setFormData({
                    name: '',
                    target_metric: '',
                    operator: 'GREATER_THAN',
                    threshold_min: '',
                    threshold_max: '',
                    duration_seconds: 0,
                    priority: 'MEDIUM'
                });
                setShowAddRuleModal(false);
                fetchRules();
            } else {
                throw new Error('Failed to create rule');
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Nie udało się utworzyć reguły. Spróbuj ponownie.'
            });
        } finally {
            setLoading(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    return (
        <div className="alarms-page">
            {/* Notification Toast */}
            {notification && (
                <div className={`notification-toast notification-${notification.type}`}>
                    <div className="notification-content">
                        {notification.type === 'success' ? (
                            <CheckCircle2 size={20} />
                        ) : (
                            <AlertTriangle size={20} />
                        )}
                        <span>{notification.message}</span>
                    </div>
                    <button 
                        onClick={() => setNotification(null)}
                        className="notification-close"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-header-icon">
                        <Bell size={32} />
                    </div>
                    <div>
                        <h1 className="page-title">System Alarmów</h1>
                        <p className="page-subtitle">
                            Zarządzaj regułami alarmów i monitoruj status systemów
                        </p>
                    </div>
                </div>
                
            </div>
            
            <div className="rules-card">
                <div className="rules-card-header">
                    <h3>Lista alarmów</h3>
                    <button className="btn-secondary" onClick={fetchAlerts} disabled={alertsLoading}>
                        {alertsLoading ? 'Odświeżanie...' : 'Odśwież'}
                    </button>
                </div>
                <div className="rules-table-wrapper">
                    <table className="rules-table">
                        <thead>
                            <tr>
                                <th>Zasada</th>
                                <th>Komentarz</th>
                                <th>triggering value</th>
                                <th>generated at</th>
                                <th>ack at</th>
                                <th>closed at</th>
                                <th>status</th>
                                <th>priority</th>
                                <th>ack by</th>
                                <th>closed by</th>
                                <th>Akcje</th>

                            </tr>
                        </thead>
                        <tbody>
                            {alertsLoading ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">Ładowanie...</td>
                                </tr>
                            ) : rules.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">Brak alarmów do wyświetlenia</td>
                                </tr>
                            ) : (
                                alerts.map(alert => (
                                    <tr key={alert.id}>
                                        {console.log(alert)}
                                        <td>{alert.alert_rule ?? '-'}</td>
                                        <td>{alert.alert_comment ?? '-'}</td>
                                        <td>{alert.triggering_value ?? '-'}</td>
                                        <td>{alert.timestamp_generated ?? '-'}</td>
                                        <td>{alert.timestamp_acknowledged ?? '-'}</td>
                                        <td>{alert.timestamp_closed ?? '-'}</td>
                                        <td>{alert.status ?? '-'}</td>
                                        <td>{alert.priority ?? '-'}</td>
                                        <td>{alert.acknowledged_by ?? '-'}</td>
                                        <td>{alert.closed_by ?? '-'}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-ghost-edit"
                                                    onClick={() => handleAckAlert(alert.id)}
                                                    disabled={ackId === alert.id}
                                                >
                                                    {ackId === alert.id ? 'Potwierdzanie...' : <SquarePen size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <button 
                className="btn-add-rule"
                onClick={() => setShowAddRuleModal(true)}
            >
                <Plus size={20} />
                Dodaj regułę
            </button>
            {/* List of rules */}
            <div className="rules-card">
                <div className="rules-card-header">
                    <h3>Lista reguł</h3>
                    
                    <button className="btn-secondary" onClick={fetchRules} disabled={rulesLoading}>
                        {rulesLoading ? 'Odświeżanie...' : 'Odśwież'}
                    </button>
                </div>
                <div className="rules-table-wrapper">
                    <table className="rules-table">
                        <thead>
                            <tr>
                                <th>Nazwa</th>
                                <th>Metryka</th>
                                <th>Operator</th>
                                <th>Próg min</th>
                                <th>Próg max</th>
                                <th>Priorytet</th>
                                <th>Czas (s)</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rulesLoading ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">Ładowanie...</td>
                                </tr>
                            ) : rules.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">Brak reguł do wyświetlenia</td>
                                </tr>
                            ) : (
                                rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td>{rule.name}</td>
                                        <td>{rule.target_metric}</td>
                                        <td>{rule.operator}</td>
                                        <td>{rule.threshold_min ?? '-'}</td>
                                        <td>{rule.threshold_max ?? '-'}</td>
                                        <td>{rule.priority}</td>
                                        <td>{rule.duration_seconds}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-ghost-danger"
                                                    onClick={() => handleDelete(rule.id)}
                                                    disabled={deletingId === rule.id}
                                                >
                                                    {deletingId === rule.id ? 'Usuwanie...' : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Box */}
            <div className="info-box">
                <Info size={20} />
                <div>
                    <h3 className="info-title">Zarządzanie regułami alarmów</h3>
                    <p className="info-text">
                        Twórz reguły monitorowania, które automatycznie generują alarmy 
                        gdy wartości metryk przekroczą określone progi.
                    </p>
                </div>
            </div>

            {/* Add Rule Modal */}
            {showAddRuleModal && (
                <div className="modal-overlay" onClick={() => setShowAddRuleModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Dodaj nową regułę alarmu</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowAddRuleModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="rule-form">
                            <div className="form-grid">
                                {/* Rule Name */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="name" className="form-label">
                                        Nazwa reguły
                                        <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="np. Wysokie zużycie energii"
                                        required
                                    />
                                </div>

                                {/* Target Metric */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="target_metric" className="form-label">
                                        Metryka docelowa
                                        <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="target_metric"
                                        name="target_metric"
                                        className="form-input"
                                        value={formData.target_metric}
                                        onChange={handleInputChange}
                                        placeholder="np. power_consumption"
                                        required
                                    />
                                    <p className="form-hint">
                                        Nazwa metryki, która będzie monitorowana
                                    </p>
                                </div>

                                {/* Operator */}
                                <div className="form-group">
                                    <label htmlFor="operator" className="form-label">
                                        Operator
                                        <span className="required">*</span>
                                    </label>
                                    <select
                                        id="operator"
                                        name="operator"
                                        className="form-select"
                                        value={formData.operator}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="GREATER_THAN">Większe niż</option>
                                        <option value="LESS_THAN">Mniejsze niż</option>
                                        <option value="EQUALS">Równe</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div className="form-group">
                                    <label htmlFor="priority" className="form-label">
                                        Priorytet
                                        <span className="required">*</span>
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        className="form-select"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="LOW">Niski</option>
                                        <option value="MEDIUM">Średni</option>
                                        <option value="HIGH">Wysoki</option>
                                        <option value="CRITICAL">Krytyczny</option>
                                    </select>
                                </div>

                                {/* Threshold Min */}
                                <div className="form-group">
                                    <label htmlFor="threshold_min" className="form-label">
                                        Próg minimalny
                                    </label>
                                    <input
                                        type="number"
                                        id="threshold_min"
                                        name="threshold_min"
                                        className="form-input"
                                        value={formData.threshold_min}
                                        onChange={handleInputChange}
                                        placeholder="0.0"
                                        step="0.01"
                                    />
                                    <p className="form-hint">
                                        Używane dla operatora "mniejsze niż" lub "równe"
                                    </p>
                                </div>

                                {/* Threshold Max */}
                                <div className="form-group">
                                    <label htmlFor="threshold_max" className="form-label">
                                        Próg maksymalny
                                    </label>
                                    <input
                                        type="number"
                                        id="threshold_max"
                                        name="threshold_max"
                                        className="form-input"
                                        value={formData.threshold_max}
                                        onChange={handleInputChange}
                                        placeholder="100.0"
                                        step="0.01"
                                    />
                                    <p className="form-hint">
                                        Używane dla operatora "większe niż"
                                    </p>
                                </div>

                                {/* Duration */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="duration_seconds" className="form-label">
                                        Czas trwania (sekundy)
                                    </label>
                                    <input
                                        type="number"
                                        id="duration_seconds"
                                        name="duration_seconds"
                                        className="form-input"
                                        value={formData.duration_seconds}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="0"
                                    />
                                    <p className="form-hint">
                                        Jak długo warunek musi być spełniony przed wyzwoleniem alarmu
                                    </p>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddRuleModal(false)}
                                    disabled={loading}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Tworzenie...' : 'Utwórz regułę'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlarmsPage;
