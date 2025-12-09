from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from optimization.models import OptimizationRule, UserPreference
from optimization.logic.controller import OptimizationController
from optimization.integration.repositories import DeviceRepository

# Serializery (Tu brakowało importów!)
from .serializers import (
    AlarmSerializer, 
    DeviceSerializer, 
    OptimizationResultSerializer,
    OptimizationRuleSerializer, 
    UserPreferenceSerializer
)

# --- Widoki Operacyjne ---

class AlarmWebhookView(APIView):
    """
    Endpoint: POST /api/optimization/alarm/
    Odbiera alarmy z innych modułów.
    """
    def post(self, request):
        serializer = AlarmSerializer(data=request.data)
        if serializer.is_valid():
            controller = OptimizationController()
            controller.receive_alarm(serializer.validated_data)
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeviceListView(APIView):
    """
    Endpoint: GET /api/optimization/devices/
    Zwraca listę urządzeń dla Frontendu.
    """
    def get(self, request):
        repo = DeviceRepository()
        devices = repo.get_all_active_devices()
        serializer = DeviceSerializer(devices, many=True)
        return Response(serializer.data)

class RunOptimizationView(APIView):
    """
    Endpoint: POST /api/optimization/run/
    Uruchamia cykl optymalizacji na żądanie.
    """
    def post(self, request):
        controller = OptimizationController()
        controller.run_optimization_cycle()
        
        result_data = {
            "status": "success", 
            "message": "Cykl optymalizacji zakończony pomyślnie.",
            "processed_devices": 0 # W przyszłości możesz tu zwrócić realną liczbę
        }
        serializer = OptimizationResultSerializer(data=result_data)
        if serializer.is_valid():
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=500)

# --- Widoki Konfiguracyjne (CRUD) ---

class OptimizationRuleViewSet(viewsets.ModelViewSet):
    """
    Endpointy: /api/optimization/rules/
    Zarządzanie regułami.
    """
    queryset = OptimizationRule.objects.all().order_by('-priority')
    serializer_class = OptimizationRuleSerializer

class UserPreferenceViewSet(viewsets.ModelViewSet):
    """
    Endpointy: /api/optimization/preferences/
    Zarządzanie preferencjami.
    """
    queryset = UserPreference.objects.all()
    serializer_class = UserPreferenceSerializer