from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import Alert, AlertRule
from .services import AlertManager, MonitoringService
from .serializers import AlertSerializer, AlertRuleSerializer


class AlertViewSet(viewsets.ModelViewSet):
    """ViewSet dla alarmów"""
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Lista alarmów"""
        alerts = Alert.objects.select_related('alert_rule').all()
        # todo: dodac serializer do json, na razie zwracane sa surowe dane
        # todo: mozna dodac stronicowanie
        # todo: filtrowanie alarmow
        return Response({'alerts': list(alerts.values())})

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Potwierdź alarm"""
        alert = self.get_object()
        # todo: sprawdzic czy user zawsze istnieje, prawdopodobnie django nam go zapewnia
        user = request.user.szebi_profile
        comment = request.data.get('comment', None)

        success = AlertManager.acknowledge_alert(alert.id, user.id, comment)

        if success:
            return Response({'status': 'acknowledged'})
        return Response(
            {'error': 'Nie można potwierdzić alarmu'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Zamknij alarm"""
        alert = self.get_object()
        # todo: sprawdzic czy user zawsze istnieje
        user = request.user.szebi_profile
        comment = request.data.get('comment', None)

        success = AlertManager.close_alert(alert.id, user.id, comment)

        if success:
            return Response({'status': 'closed'})
        return Response(
            {'error': 'Nie można zamknąć alarmu'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AlertRuleViewSet(viewsets.ModelViewSet):
    """ViewSet dla reguł alarmów"""
    queryset = AlertRule.objects.all()
    serializer_class = AlertRuleSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request):
        """Utwórz nową regułę"""
        rule = AlertManager.create_rule(request.data)

        if rule:
            return Response({'id': rule.id}, status=status.HTTP_201_CREATED)
        return Response(
            {'error': 'Nie można utworzyć reguły'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, pk=None):
        """Edytuj regułę"""
        try:
            rule = AlertRule.objects.get(pk=pk)
            for key, value in request.data.items():
                # todo: brakuje walidacji danych
                setattr(rule, key, value)
            rule.save()
            return Response({'status': 'updated'})
        except AlertRule.DoesNotExist:
            return Response(
                {'error': 'Reguła nie istnieje'},
                status=status.HTTP_404_NOT_FOUND
            )

    def destroy(self, request, pk=None):
        """Usuń regułę"""
        try:
            rule = AlertRule.objects.get(pk=pk)
            rule.delete()
            return Response({'status': 'deleted'})
        except AlertRule.DoesNotExist:
            return Response(
                {'error': 'Reguła nie istnieje'},
                status=status.HTTP_404_NOT_FOUND
            )


class DataInspectionViewSet(viewsets.ViewSet):
    """ViewSet do inspectowania danych i sprawdzania reguł"""
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def check_rules(self, request):
        """
        POST endpoint do analizy danych i sprawdzenia złamania reguł.
        Oczekuje: metric_name, value, timestamp (opcjonalny)
        """
        try:
            metric_name = request.data.get('metric_name')
            value = request.data.get('value')
            timestamp = request.data.get('timestamp')

            # Walidacja wymaganych pól
            if not metric_name or value is None:
                return Response(
                    {'error': 'Wymagane pola: metric_name, value'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Użyj aktualnego czasu jeśli timestamp nie został podany
            if not timestamp:
                timestamp = timezone.now()

            # Uruchom analizę danych
            MonitoringService.inspect_data(metric_name, value, timestamp)

            return Response({
                'status': 'success',
                'message': 'Dane zostały przeanalizowane',
                'metric_name': metric_name,
                'value': value,
                'timestamp': timestamp
            })

        except Exception as e:
            return Response(
                {'error': f'Błąd podczas analizy danych: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
