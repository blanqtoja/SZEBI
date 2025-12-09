from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from simulation.models import Device

class ApiTestCase(TestCase):
    """
    Testy integracyjne API (views.py).
    Sprawdzamy, czy endpointy odbierają żądania i zwracają poprawne kody HTTP.
    """
    
    def setUp(self):
        self.client = APIClient()
        # Tworzymy urządzenie, bo endpoint alarmu sprawdza poprawność device_id
        self.device = Device.objects.create(
            name="Test Device", 
            device_type="CONSUMER", 
            nominal_power=1.0, 
            is_active=True
        )

    def test_alarm_endpoint_success(self):
        """
        Czy wysłanie poprawnego alarmu zwraca 200 OK?
        """
        data = {
            "device_id": self.device.id,
            "alarm_type": "FIRE",
            "severity": "CRITICAL",
            "message": "Test ognia"
        }
        
        response = self.client.post('/api/optimization/alarm/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'received')

    def test_alarm_endpoint_bad_request(self):
        """
        Czy wysłanie śmieci zwraca 400 Bad Request?
        """
        # Brakuje pola 'severity' i 'device_id' - serializer powinien to odrzucić
        data = {"alarm_type": "ERROR"}
        
        response = self.client.post('/api/optimization/alarm/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_run_optimization_endpoint(self):
        """
        Czy ręczne uruchomienie cyklu działa?
        """
        response = self.client.post('/api/optimization/run/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

    def test_device_list_endpoint(self):
        """
        Czy endpoint GET /devices/ zwraca listę urządzeń?
        """
        response = self.client.get('/api/optimization/devices/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Powinniśmy dostać listę z jednym urządzeniem (tym utworzonym w setUp)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Test Device")