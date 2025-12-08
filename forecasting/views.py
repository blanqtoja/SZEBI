from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.decorators import action

# Importujemy modele i serializery
from .models import Forecast
from .serializers import ForecastSerializer

# Importujemy główny manager logiki biznesowej
# Upewnij się, że w folderze 'logic' masz plik __init__.py!
from .logic.prediction_manager import PredictionManager


class TrainModelView(APIView):
    """
    Endpoint: POST /api/forecasting/train/
    Służy do ręcznego uruchomienia procesu treningu modelu.
    Wymusza pobranie danych z 'acquisition' i przebudowanie modelu.
    """

    def post(self, request):
        manager = PredictionManager()
        try:
            # 1. Uruchom proces treningu (pobranie danych -> trening -> walidacja)
            # Metoda initiateTrainingCycle zwraca status lub kod błędu
            result = manager.initiateTrainingCycle()

            if result == "No data":
                return Response(
                    {"error": "Brak danych w module Acquisition. Uruchom generator danych lub poczekaj na pomiary."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Jeśli trening się udał, wdrażamy najlepszy model jako aktywny
            manager.deployBestModel()

            return Response(
                {"status": "Sukces", "message": "Model został pomyślnie wytrenowany i wdrożony."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # Łapiemy wszelkie nieprzewidziane błędy
            return Response(
                {"error": f"Wystąpił błąd podczas treningu: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GenerateForecastView(APIView):
    """
    Endpoint: GET /api/forecasting/predict/
    Generuje nową prognozę na następne 24h, zapisuje ją w bazie i zwraca wynik.
    """

    def get(self, request):
        manager = PredictionManager()
        try:
            # 1. Wywołujemy logikę generowania prognozy
            # Ta metoda pod spodem używa ForecastReporter do zapisu w bazie
            reporter = manager.generateAndPublishForecast()

            # 2. Sprawdzamy, czy udało się wygenerować raport
            if reporter and reporter.predictedValues is not None:
                return Response({
                    "status": "Prognoza wygenerowana",
                    "model_id": str(reporter.modelID),
                    "generated_at": reporter.creationTime,
                    # Konwertujemy numpy array na listę, żeby JSON to zrozumiał
                    "data": reporter.getPredictedValues().tolist()
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {
                        "error": "Nie udało się wygenerować prognozy. Upewnij się, że model jest wytrenowany (użyj /train/)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {"error": f"Błąd generowania prognozy: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ForecastViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint: GET /api/forecasting/history/
    Standardowy widok (CRUD) do przeglądania historii zapisanych prognoz.
    ReadOnly - bo nie chcemy, żeby ktoś ręcznie dodawał/edytował prognozy przez API.
    """
    queryset = Forecast.objects.all().order_by('-created_at')
    serializer_class = ForecastSerializer