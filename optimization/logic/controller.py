class OptimizationController:
    """
    Główny kontroler logiki biznesowej.
    """
    def receive_alarm(self, alarm_data):
        """
        Metoda wywoływana, gdy przyjdzie alarm z zewnątrz.
        Zgodna z metodą receiveAlarm() z diagramu klas.
        """
        severity = alarm_data.get('severity')
        device_id = alarm_data.get('device_id')
        
        print(f"\n[LOGIC] !!! OTRZYMANO ALARM !!!")
        print(f"Urządzenie ID: {device_id}")
        print(f"Poziom: {severity}")
        print(f"Treść: {alarm_data.get('message')}")

        if severity == 'CRITICAL':
            print(f"[LOGIC] Uruchamiam procedurę awaryjną dla urządzenia {device_id}...")
            # TU W PRZYSZŁOŚCI: wysłanie komendy OFF do SimulationClient
            # self.simulation_client.publish_command(device_id, {"status": "OFF"})
        else:
            print("[LOGIC] Alarm zanotowany, brak akcji krytycznej.")