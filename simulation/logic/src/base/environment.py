from weather import Weather
from simulation import Simulation

from util.utils import validate_name

from uuid import UUID, uuid4

import weakref


class Environment:
    weather: Weather
    
    uuid: UUID = uuid4()
    name: str
    
    
    def __init__(self, name: str, simulation: Simulation, initial_temp: float = 21.0, insulation: float = 0.85, ):
        self._simulation = weakref.ref(simulation)    
        self.weather = Weather(simulation)
        
        self.name = name
        
        self.temperature = initial_temp
        self.insulation = insulation

        # Moc dostarczona przez urządzenia HVAC w danym ticku
        self.heating_power = 0.0   # W
        self.cooling_power = 0.0   # W
        
    def sim(self) -> Simulation:
        s = self._simulation() 
        if s is None:
            raise RuntimeError('Environment exists outside of Simulation context')
        return s

    def update(self, millis_passed: int):
        self.weather.update(millis_passed)
        outside_temp = self.weather.get_temperature()
        inside_temp = self.temperature

        # 1. Wymiana ciepła z otoczeniem (prosty model)
        diff = outside_temp - inside_temp
        heat_flow = diff * (1 - self.insulation) * 0.01
        self.temperature += heat_flow

        # 2. Ogrzewanie / chłodzenie
        hours = millis_passed / (1000 * 3600)

        # Ogrzewanie - podnosi temperaturę
        self.temperature += (self.heating_power / 1000.0) * hours * 1.8

        # Chłodzenie - obniża temperaturę
        self.temperature -= (self.cooling_power / 1000.0) * hours * 2.0

        # Reset mocy po aktualizacji
        self.heating_power = 0.0
        self.cooling_power = 0.0

    def get_heating_power(self):
        return self.heating_power

    def get_cooling_power(self):
        return self.cooling_power
    
    def set_name(self, name: str) -> None:
        validate_name(name)
        self.name = name