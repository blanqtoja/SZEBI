from __future__ import annotations

from abc import ABC, abstractmethod
from simulation.logic.src.base.device import Device


class EnergySource(Device, ABC):
    def __init__(self, name: str, env):
        super().__init__(name, env)

    @abstractmethod
    def calculate_production(self, weather, millis_passed: int) -> float:
        pass
