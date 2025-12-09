from abc import ABC
from base.device import Device
from base.environment import Environment



class SmartDevice(Device, ABC):
    power_usage: float
    
    def __init__(self, name: str, env: Environment, power_usage_watt: float):
        if type(self) is SmartDevice:
            raise TypeError("SmartDevice is abstract")
        self.level = 0.0

        super().__init__(name, env)
        self.power_usage = power_usage_watt

    def get_power_usage(self, millis_passed: int) -> float:
        if not self.is_active:
            return 0.0

        hours = millis_passed / 3600000
        return (self.power_usage * hours) / 1000.0

    def publish_state(self, extra=None):
        env = self.env()
        mqtt = env.mqtt
        topic = f"szebi/{env.uuid}/device/{self.uuid}/state"

        payload = {
            "name": self.name,
            "is_active": self.is_active,
            "level": self.level,
            "ts": int(self.sim().get_current_date().timestamp())
        }

        if extra:
            payload.update(extra)

        mqtt.publish(topic, json.dumps(payload), qos=1, retain=True)
