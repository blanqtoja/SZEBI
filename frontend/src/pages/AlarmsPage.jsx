import React, { useEffect, useState } from 'react';
import { Bell, Plus, AlertTriangle, Info, CheckCircle2, X, Trash2, SquarePen, XCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const AlarmsPage = () => {
    const [showAddRuleModal, setShowAddRuleModal] = useState(false);
    const [showAddAlertModal, setShowAddAlertModal] = useState(false);
    const [rules, setRules] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [ackId, setAckId] = useState(null);
    const [showAlertActionModal, setShowAlertActionModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [alertComment, setAlertComment] = useState('');
    const [alertActionLoading, setAlertActionLoading] = useState(false);
    const [alertFormData, setAlertFormData] = useState({
        alert_rule_id: '',
        triggering_value: '',
        timestamp: '',
        comment: ''
    });
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
            const response = await fetch(`${API_BASE_URL}/api/alert-rules/`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch alert rules');
            }

            const data = await response.json();
            setRules(Array.isArray(data) ? data : data.results || data.alerts || []);
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się pobrać reguł.' });
        } finally {
            setRulesLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    
    const fetchAlertsData = async () => {
        setAlertsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/alerts/`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch alerts');
            }

            const data = await response.json();
            setAlerts(Array.isArray(data) ? data : data.alerts || []);
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
            const response = await fetch(`${API_BASE_URL}/api/alert-rules/${ruleId}/`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to delete alert rule');
            }

            setNotification({ type: 'success', message: 'Reguła została usunięta.' });
            fetchRules();
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się usunąć reguły.' });
        } finally {
            setDeletingId(null);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const openAlertActionModal = (alert) => {
        setSelectedAlert(alert);
        setAlertComment('');
        setShowAlertActionModal(true);
    };

    const handleAcknowledgeAlert = async () => {
        if (!selectedAlert) return;
        setAlertActionLoading(true);
        try {
            const body = alertComment ? { comment: alertComment } : {};
            
            const response = await fetch(`${API_BASE_URL}/api/alerts/${selectedAlert.id}/acknowledge/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error('Failed to acknowledge alert');
            }

            setNotification({ type: 'success', message: 'Alarm potwierdzony' });
            setShowAlertActionModal(false);
            setSelectedAlert(null);
            setAlertComment('');
            fetchAlertsData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się potwierdzić alarmu' });
        } finally {
            setAlertActionLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleCloseAlert = async () => {
        if (!selectedAlert) return;
        setAlertActionLoading(true);
        try {
            const body = alertComment ? { comment: alertComment } : {};
            
            const response = await fetch(`${API_BASE_URL}/api/alerts/${selectedAlert.id}/close/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error('Failed to close alert');
            }

            setNotification({ type: 'success', message: 'Alarm zamknięty' });
            setShowAlertActionModal(false);
            setSelectedAlert(null);
            setAlertComment('');
            fetchAlertsData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Nie udało się zamknąć alarmu' });
        } finally {
            setAlertActionLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchAlertsData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAlertInputChange = (e) => {
        const { name, value } = e.target;
        setAlertFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAlertSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const alertData = {
                alert_rule_id: parseInt(alertFormData.alert_rule_id),
                triggering_value: parseFloat(alertFormData.triggering_value),
                timestamp: alertFormData.timestamp || undefined,
                comment: alertFormData.comment || undefined
            };

            const response = await fetch(`${API_BASE_URL}/api/alerts/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
            });

            if (!response.ok) {
                throw new Error('Failed to create alert');
            }
            
            setNotification({
                type: 'success',
                message: 'Alarm został pomyślnie utworzony!'
            });
            setAlertFormData({
                alert_rule_id: '',
                triggering_value: '',
                timestamp: '',
                comment: ''
            });
            setShowAddAlertModal(false);
            fetchAlertsData();
        } catch (error) {
            console.error(error);
            setNotification({
                type: 'error',
                message: 'Nie udało się utworzyć alarmu. Spróbuj ponownie.'
            });
        } finally {
            setLoading(false);
            setTimeout(() => setNotification(null), 5000);
        }
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

            const response = await fetch(`${API_BASE_URL}/api/alert-rules/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleData)
            });

            if (!response.ok) {
                throw new Error('Failed to create alert rule');
            }
            
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
        } catch (error) {
            console.error(error);
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
                    <button className="btn-secondary" onClick={fetchAlertsData} disabled={alertsLoading}>
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
                            ) : alerts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">Brak alarmów do wyświetlenia</td>
                                </tr>
                            ) : (
                                alerts.map(alert => (
                                    <tr key={alert.id}>
                                        {console.log(alert)}
                                        <td>{alert.alert_rule?.name ?? '-'}</td>
                                        <td>{alert.alert_comment?.text ?? '-'}</td>
                                        <td>{alert.triggering_value ?? '-'}</td>
                                        <td>{alert.timestamp_generated ?? '-'}</td>
                                        <td>{alert.timestamp_acknowledged ?? '-'}</td>
                                        <td>{alert.timestamp_closed ?? '-'}</td>
                                        <td>{alert.status ?? '-'}</td>
                                        <td>{alert.priority ?? '-'}</td>
                                        <td>{alert.acknowledged_by?.username ?? '-'}</td>
                                        <td>{alert.closed_by?.username ?? '-'}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-ghost-edit"
                                                    onClick={() => openAlertActionModal(alert)}
                                                    disabled={alert.status === 'CLOSED'}
                                                    title={alert.status === 'CLOSED' ? 'Alarm zamknięty' : 'Zarządzaj alarmem'}
                                                >
                                                    <SquarePen size={16} />
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

            <button 
                className="btn-add-rule"
                onClick={() => setShowAddAlertModal(true)}
                style={{ bottom: '90px' }}
            >
                <Plus size={20} />
                Dodaj alarm
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

            {/* Alert Action Modal */}
            {showAlertActionModal && selectedAlert && (
                <div className="modal-overlay" onClick={() => setShowAlertActionModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedAlert.status === 'NEW' ? 'Zarządzaj alarmem' : 'Zamknij alarm'}
                            </h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowAlertActionModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="rule-form">
                            {/* Alert Info */}
                            <div className="form-group form-group-full">
                                <label className="form-label">Reguła alarmu</label>
                                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                                    {selectedAlert.alert_rule?.name || 'Brak nazwy'}
                                </div>
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Status</label>
                                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                                    {selectedAlert.status}
                                </div>
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Wartość wyzwalająca</label>
                                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                                    {selectedAlert.triggering_value ?? '-'}
                                </div>
                            </div>

                            {/* Comment Field */}
                            <div className="form-group form-group-full">
                                <label htmlFor="alertComment" className="form-label">
                                    Komentarz
                                </label>
                                <textarea
                                    id="alertComment"
                                    className="form-input"
                                    value={alertComment}
                                    onChange={(e) => setAlertComment(e.target.value)}
                                    placeholder="Dodaj komentarz (opcjonalnie)..."
                                    rows="4"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="form-actions" style={{ gap: '12px' }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAlertActionModal(false)}
                                    disabled={alertActionLoading}
                                >
                                    Anuluj
                                </button>
                                
                                {selectedAlert.status === 'NEW' && (
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleAcknowledgeAlert}
                                        disabled={alertActionLoading}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <CheckCircle2 size={16} />
                                        {alertActionLoading ? 'Potwierdzanie...' : 'Potwierdź'}
                                    </button>
                                )}
                                
                                <button
                                    type="button"
                                    className="btn-ghost-danger"
                                    onClick={handleCloseAlert}
                                    disabled={alertActionLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <XCircle size={16} />
                                    {alertActionLoading ? 'Zamykanie...' : 'Zamknij'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Add Alert Modal */}
            {showAddAlertModal && (
                <div className="modal-overlay" onClick={() => setShowAddAlertModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Dodaj nowy alarm</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowAddAlertModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAlertSubmit} className="rule-form">
                            <div className="form-grid">
                                {/* Alert Rule Selection */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="alert_rule_id" className="form-label">
                                        Reguła alarmu
                                        <span className="required">*</span>
                                    </label>
                                    <select
                                        id="alert_rule_id"
                                        name="alert_rule_id"
                                        className="form-select"
                                        value={alertFormData.alert_rule_id}
                                        onChange={handleAlertInputChange}
                                        required
                                    >
                                        <option value="">Wybierz regułę...</option>
                                        {rules.map(rule => (
                                            <option key={rule.id} value={rule.id}>
                                                {rule.name} ({rule.target_metric})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="form-hint">
                                        Wybierz która reguła została złamana
                                    </p>
                                </div>

                                {/* Triggering Value */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="triggering_value" className="form-label">
                                        Wartość wyzwalająca
                                        <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="triggering_value"
                                        name="triggering_value"
                                        className="form-input"
                                        value={alertFormData.triggering_value}
                                        onChange={handleAlertInputChange}
                                        placeholder="0.0"
                                        step="0.01"
                                        required
                                    />
                                    <p className="form-hint">
                                        Wartość metryki, która spowodowała alarm
                                    </p>
                                </div>

                                {/* Timestamp (optional) */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="timestamp" className="form-label">
                                        Znacznik czasu (opcjonalnie)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="timestamp"
                                        name="timestamp"
                                        className="form-input"
                                        value={alertFormData.timestamp}
                                        onChange={handleAlertInputChange}
                                    />
                                    <p className="form-hint">
                                        Jeśli puste, użyte zostanie bieżące time
                                    </p>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddAlertModal(false)}
                                    disabled={loading}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Tworzenie...' : 'Utwórz alarm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Alert Modal */}
            {showAddAlertModal && (
                <div className="modal-overlay" onClick={() => setShowAddAlertModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Dodaj nowy alarm</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowAddAlertModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAlertSubmit} className="rule-form">
                            <div className="form-grid">
                                {/* Alert Rule Selection */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="alert_rule_id" className="form-label">
                                        Reguła alarmu
                                        <span className="required">*</span>
                                    </label>
                                    <select
                                        id="alert_rule_id"
                                        name="alert_rule_id"
                                        className="form-select"
                                        value={alertFormData.alert_rule_id}
                                        onChange={handleAlertInputChange}
                                        required
                                    >
                                        <option value="">Wybierz regułę...</option>
                                        {rules.map(rule => (
                                            <option key={rule.id} value={rule.id}>
                                                {rule.name} ({rule.target_metric})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="form-hint">
                                        Wybierz która reguła została złamana
                                    </p>
                                </div>

                                {/* Triggering Value */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="triggering_value" className="form-label">
                                        Wartość wyzwalająca
                                        <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="triggering_value"
                                        name="triggering_value"
                                        className="form-input"
                                        value={alertFormData.triggering_value}
                                        onChange={handleAlertInputChange}
                                        placeholder="0.0"
                                        step="0.01"
                                        required
                                    />
                                    <p className="form-hint">
                                        Wartość metryki, która spowodowała alarm
                                    </p>
                                </div>

                                {/* Timestamp (optional) */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="timestamp" className="form-label">
                                        Znacznik czasu (opcjonalnie)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="timestamp"
                                        name="timestamp"
                                        className="form-input"
                                        value={alertFormData.timestamp}
                                        onChange={handleAlertInputChange}
                                    />
                                    <p className="form-hint">
                                        Jeśli puste, użyte zostanie bieżący czas
                                    </p>
                                </div>

                                {/* Comment (optional) */}
                                <div className="form-group form-group-full">
                                    <label htmlFor="comment" className="form-label">
                                        Komentarz (opcjonalnie)
                                    </label>
                                    <textarea
                                        id="comment"
                                        name="comment"
                                        className="form-input"
                                        value={alertFormData.comment}
                                        onChange={handleAlertInputChange}
                                        placeholder="Dodaj komentarz do alarmu..."
                                        rows="4"
                                        style={{ resize: 'vertical' }}
                                    />
                                    <p className="form-hint">
                                        Dodatkowe informacje o alarmie
                                    </p>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddAlertModal(false)}
                                    disabled={loading}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Tworzenie...' : 'Utwórz alarm'}
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
