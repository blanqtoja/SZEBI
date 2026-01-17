from typing import Dict, Callable
from ..models import Measurement, DataLog, DataLogLevel

class Transformer:
    def __init__(self, db_manager):
        # self.conversion_table_dict: Dict = {}

        self.db_manager = db_manager

        self.conversion_table: Dict[str, Callable[[float], float]] = {
            "C": lambda x: x,  # stopnie Celsjusza → stopnie Celsjusza
            "F": lambda x: (x - 32) * 5 / 9,  # Fahrenheit → °C
            "m/s": lambda x: x,  # metry na sekundę → metry na sekundę
            "km/h": lambda x: x / 3.6,  # km/h → m/s
            "mm": lambda x: x,  # mm, → mm
            "mm/h": lambda x: x,  # mm/h → mm/h
            "lux": lambda x: x,  # lux → lux
            "lumen": lambda x: x / 100,  # lumeny → lux (przykład)
            "W": lambda x: x,  # W → W
            "kW": lambda x: x * 1000,  # kW → W
            "kWh": lambda x: x,  # kWh → kWh
            "%": lambda x: x / 100.0,  # procenty → 0.0–1.0
            "fraction": lambda x: x  # ułamek → 0.0–1.0
        }

    def convert_units(self, measurement: Measurement) -> Measurement:
        # if hasattr(measurement, "unit"):
        #     unit = measurement.unit
        #     # przykładowa logika:
        #     if unit == "C":
        #         measurement.value = measurement.value
        #     elif unit == "lumen":
        #         # konwertujemy np. lumeny → lux
        #         measurement.value = measurement.value / 100
        #     elif unit == "W":
        #         # moc → kWh
        #         measurement.value = measurement.value / 1000
        #     # ... inne jednostki
        #
        # return measurement
        unit = getattr(measurement, "unit", None)
        if unit in self.conversion_table:
            try:
                measurement.value = self.conversion_table[unit](measurement.value)
            except Exception as e:
                msg = f"TRANSFORMER ERROR: błąd konwersji {measurement.value} [{unit}]: {e}"
                print(msg)
                self.db_manager.insert_data_log(DataLog(
                    measurement=measurement,
                    level=DataLogLevel.ERROR,
                    message=msg[:255]
                ))
        else:
            msg = f"TRANSFORMER WARNING: jednostka {unit} nie jest zdefiniowana w tabeli konwersji"
            print(msg)
            self.db_manager.insert_data_log(DataLog(
                measurement=measurement,
                level=DataLogLevel.WARNING,
                message=msg[:255]
            ))
        return measurement