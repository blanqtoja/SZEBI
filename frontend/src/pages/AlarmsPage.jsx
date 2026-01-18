import React, { useEffect, useState } from 'react';
import { Bell, Plus, AlertTriangle, Info, CheckCircle2, X, Trash2, SquarePen, XCircle, NotebookTabs, ChevronDown, ChevronUp} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

// Helper function to get CSRF token from cookies
const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

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
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [selectedCommentAlert, setSelectedCommentAlert] = useState(null);
    const [alertComment, setAlertComment] = useState('');
    const [alertActionLoading, setAlertActionLoading] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [commentUpdateLoading, setCommentUpdateLoading] = useState(false);
    const [showClosedAlerts, setShowClosedAlerts] = useState(false);
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
            setNotification({ type: 'error', message: 'Failed to fetch rules.' });
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
            setNotification({ type: 'error', message: 'Failed to fetch alerts.' });
        } finally {
            setAlertsLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleDelete = async (ruleId) => {
        const confirmed = window.confirm('Are you sure you want to delete this rule?');
        if (!confirmed) return;
        setDeletingId(ruleId);
        try {
            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`${API_BASE_URL}/api/alert-rules/${ruleId}/`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete alert rule');
            }

            setNotification({ type: 'success', message: 'Rule deleted.' });
            fetchRules();
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to delete rule.' });
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

    const openCommentModal = (alert) => {
        setSelectedCommentAlert(alert);
        setIsAddingComment(false);
        setNewCommentText('');
        setShowCommentModal(true);
    };

    const handleAddComment = async () => {
        if (!selectedCommentAlert || !newCommentText.trim()) return;
        setCommentUpdateLoading(true);
        try {
            const csrftoken = getCookie('csrftoken');
            
            const response = await fetch(`${API_BASE_URL}/api/alerts/${selectedCommentAlert.id}/add_comment/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ 
                    comment: newCommentText 
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            setNotification({ type: 'success', message: 'Comment added' });
            setIsAddingComment(false);
            setNewCommentText('');
            fetchAlertsData();
            
            // Update local state
            const existingComment = selectedCommentAlert.alert_comment?.text || '';
            const separator = existingComment ? '\n\n---\n\n' : '';
            const updatedComment = existingComment + separator + newCommentText;
            
            setSelectedCommentAlert({
                ...selectedCommentAlert,
                alert_comment: {
                    ...selectedCommentAlert.alert_comment,
                    text: updatedComment
                }
            });
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to add comment' });
        } finally {
            setCommentUpdateLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleAcknowledgeAlert = async () => {
        if (!selectedAlert) return;
        setAlertActionLoading(true);
        try {
            const existingComment = selectedAlert.alert_comment?.text || '';
            const separator = existingComment && alertComment ? '\n\n---\n\n' : '';
            const updatedComment = existingComment + separator + alertComment;
            const body = alertComment ? { comment: updatedComment } : {};
            const csrftoken = getCookie('csrftoken');
            
            const response = await fetch(`${API_BASE_URL}/api/alerts/${selectedAlert.id}/acknowledge/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error('Failed to acknowledge alert');
            }

            setNotification({ type: 'success', message: 'Alert acknowledged' });
            setShowAlertActionModal(false);
            setSelectedAlert(null);
            setAlertComment('');
            fetchAlertsData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to acknowledge alert' });
        } finally {
            setAlertActionLoading(false);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleCloseAlert = async () => {
        if (!selectedAlert) return;
        setAlertActionLoading(true);
        try {
            const existingComment = selectedAlert.alert_comment?.text || '';
            const separator = existingComment && alertComment ? '\n\n---\n\n' : '';
            const updatedComment = existingComment + separator + alertComment;
            const body = alertComment ? { comment: updatedComment } : {};
            const csrftoken = getCookie('csrftoken');
            
            const response = await fetch(`${API_BASE_URL}/api/alerts/${selectedAlert.id}/close/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error('Failed to close alert');
            }

            setNotification({ type: 'success', message: 'Alert closed' });
            setShowAlertActionModal(false);
            setSelectedAlert(null);
            setAlertComment('');
            fetchAlertsData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to close alert' });
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

            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`${API_BASE_URL}/api/alerts/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(alertData)
            });

            if (!response.ok) {
                throw new Error('Failed to create alert');
            }
            
            setNotification({
                type: 'success',
                message: 'Alert created successfully!'
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
                message: 'Failed to create alert. Please try again.'
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

            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`${API_BASE_URL}/api/alert-rules/`, {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(ruleData)
            });

            if (!response.ok) {
                throw new Error('Failed to create alert rule');
            }
            
            setNotification({
                type: 'success',
                message: 'Alert rule created successfully!'
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
                message: 'Failed to create rule. Please try again.'
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
                        <h1 className="page-title">Alarm System</h1>
                        <p className="page-subtitle">
                            Manage alarm rules and monitor system status
                        </p>
                    </div>
                </div>
                
            </div>
            
            <button 
                className="btn-add-rule"
                onClick={() => setShowAddAlertModal(true)}
                style={{ bottom: '90px' }}
            >
                <Plus size={20} />
                Add Alert
            </button>
            <div className="rules-card">
                <div className="rules-card-header">
                    <h3>Active Alerts</h3>
                    <button className="btn-secondary" onClick={fetchAlertsData} disabled={alertsLoading}>
                        {alertsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <div className="rules-table-wrapper">
                    <table className="rules-table">
                        <thead>
                            <tr>
                                <th>Rule</th>
                                <th>Comment</th>
                                <th>Triggering Value</th>
                                <th>Generated At</th>
                                <th>Acknowledged At</th>
                                <th>Closed At</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Acknowledged By</th>
                                <th>Closed By</th>
                                <th>Actions</th>

                            </tr>
                        </thead>
                        <tbody>
                            {alertsLoading ? (
                                <tr>
                                    <td colSpan="11" className="table-empty">Loading...</td>
                                </tr>
                            ) : alerts.filter(a => a.status !== 'CLOSED').length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="table-empty">No active alerts</td>
                                </tr>
                            ) : (
                                alerts
                                    .filter(alert => alert.status !== 'CLOSED')
                                    .sort((a, b) => new Date(b.timestamp_generated) - new Date(a.timestamp_generated))
                                    .map(alert => (
                                    <tr key={alert.id}>
                                        {console.log(alert)}
                                        <td>{alert.alert_rule?.name ?? '-'}</td>
                                        <td>
                                            {alert.alert_comment ? (
                                                <button
                                                    className="btn-ghost-edit"
                                                    onClick={() => openCommentModal(alert)}
                                                    
                                                >
                                                    <NotebookTabs size={16}/>
                                                </button>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>{alert.triggering_value ?? '-'}</td>
                                        <td>{formatTimestamp(alert.timestamp_generated)}</td>
                                        <td>{formatTimestamp(alert.timestamp_acknowledged)}</td>
                                        <td>{formatTimestamp(alert.timestamp_closed)}</td>
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
                                                    title={alert.status === 'CLOSED' ? 'Alert closed' : 'Manage alert'}
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

            {/* Closed Alerts Section */}
            <div className="rules-card">
                <div 
                    className="rules-card-header" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowClosedAlerts(!showClosedAlerts)}
                >
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Closed Alerts ({alerts.filter(a => a.status === 'CLOSED').length})
                        {showClosedAlerts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </h3>
                </div>
                {showClosedAlerts && (
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
                                {alerts.filter(a => a.status === 'CLOSED').length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="table-empty">No closed alerts</td>
                                    </tr>
                                ) : (
                                    alerts
                                        .filter(alert => alert.status === 'CLOSED')
                                        .sort((a, b) => new Date(b.timestamp_closed) - new Date(a.timestamp_closed))
                                        .map(alert => (
                                        <tr key={alert.id}>
                                            <td>{alert.alert_rule?.name ?? '-'}</td>
                                            <td>
                                                {alert.alert_comment ? (
                                                    <button
                                                        className="btn-ghost-edit"
                                                        onClick={() => openCommentModal(alert)}
                                                    >
                                                        <NotebookTabs size={16}/>
                                                    </button>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>{alert.triggering_value ?? '-'}</td>
                                            <td>{formatTimestamp(alert.timestamp_generated)}</td>
                                            <td>{formatTimestamp(alert.timestamp_acknowledged)}</td>
                                            <td>{formatTimestamp(alert.timestamp_closed)}</td>
                                            <td>{alert.status ?? '-'}</td>
                                            <td>{alert.priority ?? '-'}</td>
                                            <td>{alert.acknowledged_by?.username ?? '-'}</td>
                                            <td>{alert.closed_by?.username ?? '-'}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn-ghost-edit"
                                                        onClick={() => openCommentModal(alert)}
                                                        title="Pokaż szczegóły"
                                                    >
                                                        <Info size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <button 
                className="btn-add-rule"
                onClick={() => setShowAddRuleModal(true)}
            >
                <Plus size={20} />
                Add Rule
            </button>

            {/* List of rules */}
            <div className="rules-card">
                <div className="rules-card-header">
                    <h3>Rule List</h3>
                    
                    <button className="btn-secondary" onClick={fetchRules} disabled={rulesLoading}>
                        {rulesLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <div className="rules-table-wrapper">
                    <table className="rules-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Metric</th>
                                <th>Operator</th>
                                <th>Min Threshold</th>
                                <th>Max Threshold</th>
                                <th>Priority</th>
                                <th>Duration (s)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rulesLoading ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">Loading...</td>
                                </tr>
                            ) : rules.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="table-empty">No rules to display</td>
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
                                                    {deletingId === rule.id ? 'Deleting...' : <Trash2 size={16} />}
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
                    <h3 className="info-title">Alarm Rules Management</h3>
                    <p className="info-text">
                        Create monitoring rules that automatically generate alerts 
                        when metric values exceed defined thresholds.
                    </p>
                </div>
            </div>

            {/* Alert Action Modal */}
            {showAlertActionModal && selectedAlert && (
                <div className="modal-overlay" onClick={() => setShowAlertActionModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedAlert.status === 'NEW' ? 'Manage Alert' : 'Close Alert'}
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
                                <label className="form-label">Alert Rule</label>
                                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    {selectedAlert.alert_rule?.name || 'No name'}
                                </div>
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Status</label>
                                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    {selectedAlert.status}
                                </div>
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Triggering Value</label>
                                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    {selectedAlert.triggering_value ?? '-'}
                                </div>
                            </div>

                            {/* Existing Comment (if any) */}
                            {selectedAlert.alert_comment?.text && (
                                <div className="form-group form-group-full">
                                    <label className="form-label">Existing Comment</label>
                                    <div style={{ 
                                        padding: '12px', 
                                        background: 'rgba(255, 255, 255, 0.05)', 
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        minHeight: '60px',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                        opacity: 0.8
                                    }}>
                                        {selectedAlert.alert_comment.text}
                                    </div>
                                </div>
                            )}

                            {/* Comment Field */}
                            <div className="form-group form-group-full">
                                <label htmlFor="alertComment" className="form-label">
                                    {selectedAlert.alert_comment?.text ? 'Add New Comment Part' : 'Comment'}
                                </label>
                                <textarea
                                    id="alertComment"
                                    className="form-input"
                                    value={alertComment}
                                    onChange={(e) => setAlertComment(e.target.value)}
                                    placeholder="Add comment (optional)..."
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
                                        {alertActionLoading ? 'Acknowledging...' : 'Acknowledge'}
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
                                    {alertActionLoading ? 'Closing...' : 'Close'}
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
                            <h2 className="modal-title">Add New Alert Rule</h2>
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

            {/* Comment Modal */}
            {showCommentModal && selectedCommentAlert && (
                <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Alert Comment</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowCommentModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="rule-form">
                            <div className="form-group form-group-full">
                                <label className="form-label">Reguła alarmu</label>
                                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    {selectedCommentAlert.alert_rule?.name || 'Brak nazwy'}
                                </div>
                            </div>

                            <div className="form-group form-group-full">
                                <label className="form-label">Istniejący komentarz</label>
                                <div style={{ 
                                    padding: '12px', 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    minHeight: '100px',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    opacity: 0.8
                                }}>
                                    {selectedCommentAlert.alert_comment?.text || 'Brak komentarza'}
                                </div>
                            </div>

                            {isAddingComment && (
                                <div className="form-group form-group-full">
                                    <label className="form-label">Dodaj nową część komentarza</label>
                                    <textarea
                                        className="form-input"
                                        value={newCommentText}
                                        onChange={(e) => setNewCommentText(e.target.value)}
                                        placeholder="Wpisz nowy fragment komentarza..."
                                        rows="6"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            )}

                            <div className="form-group form-group-full">
                                <label className="form-label">Data dodania komentarza</label>
                                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                    {formatTimestamp(selectedCommentAlert.alert_comment?.timestamp)}
                                </div>
                            </div>

                            <div className="form-actions">
                                {!isAddingComment ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setIsAddingComment(true)}
                                        >
                                            <Plus size={16} style={{ marginRight: '8px' }} />
                                            Dodaj komentarz
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={() => setShowCommentModal(false)}
                                        >
                                            Zamknij
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => {
                                                setIsAddingComment(false);
                                                setNewCommentText('');
                                            }}
                                            disabled={commentUpdateLoading}
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={handleAddComment}
                                            disabled={commentUpdateLoading || !newCommentText.trim()}
                                        >
                                            {commentUpdateLoading ? 'Zapisywanie...' : 'Zapisz'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlarmsPage;
