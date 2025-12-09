from rest_framework import serializers
from optimization.models import OptimizationRule, UserPreference
from simulation.models import Device  # <--- Tego brakowało

class AlarmSerializer(serializers.Serializer):
    """
    Definicja formatu JSON, który przychodzi z Modułu Alarmów.
    """
    device_id = serializers.IntegerField(help_text="ID urządzenia, którego dotyczy problem")
    alarm_type = serializers.CharField(max_length=50)  # np. 'OVERHEAT', 'CONNECTION_LOST'
    severity = serializers.ChoiceField(choices=[
        ('INFO', 'Informacja'),
        ('WARNING', 'Ostrzeżenie'),
        ('CRITICAL', 'Błąd krytyczny')
    ])
    message = serializers.CharField(required=False, allow_blank=True)
    timestamp = serializers.DateTimeField(required=False)

class DeviceSerializer(serializers.ModelSerializer):
    """
    Tego brakowało! Służy do wysyłania listy urządzeń do Frontendu.
    """
    class Meta:
        model = Device
        fields = ['id', 'name', 'device_type', 'is_active', 'nominal_power']

class OptimizationResultSerializer(serializers.Serializer):
    """
    Tego też brakowało! Służy do zwracania wyniku po kliknięciu "Uruchom".
    """
    status = serializers.CharField()
    processed_devices = serializers.IntegerField()
    message = serializers.CharField()

class OptimizationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptimizationRule
        fields = '__all__'  

class UserPreferenceSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)

    class Meta:
        model = UserPreference
        fields = ['id', 'device', 'device_name', 'target_value', 'schedule']