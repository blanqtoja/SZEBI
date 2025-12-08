from .data_processing import DataProcessing
from .model_repository import ModelRepository
from .forecast_reporter import ForecastReporter

class PredictionManager:
    def __init__(self):
        self.repository = ModelRepository()
        self.dataProcessor = DataProcessing()
        self.forecastReporter = ForecastReporter()

    def initiateTrainingCycle(self):
        # 1. Pobierz dane
        X_train, X_test, y_train, y_test = self.dataProcessor.getTrainingData()

        if X_train is None:
            print("Brak danych treningowych.")
            return

        # 2. Pobierz model
        active_model = self.repository.getActiveModel()

        # 3. Trenuj i Waliduj
        print(f"Trenowanie modelu {active_model.modelID}...")
        active_model.train(X_train, y_train)
        active_model.validate(X_test, y_test)

        # 4. Zapisz
        self.repository.save(active_model)

    def deployBestModel(self):
        best_model = self.repository.selectBestModel()
        self.repository.deployModel(best_model.modelID)

    def generateAndPublishForecast(self):
        # 1. Pobierz dane wejściowe na przyszłość (X)
        # Używamy nowej metody pomocniczej w DataProcessing
        input_data = self.dataProcessor.getPredictionInput()

        # 2. Pobierz aktywny model
        active_model = self.repository.getActiveModel()

        # 3. Wykonaj predykcję
        try:
            prediction_result = active_model.predict(input_data)
        except Exception as e:
            print(f"Model niegotowy: {e}")
            return self.forecastReporter

        # 4. Generuj raport i zapisz
        self.forecastReporter.generateReport(prediction_result, active_model.modelID)
        self.forecastReporter.saveToDatabase()

        return self.forecastReporter