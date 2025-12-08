from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ForecastViewSet, TrainModelView, GenerateForecastView

# Router automatycznie tworzy standardowe ścieżki dla ViewSetów (lista, szczegóły)
# W tym przypadku obsłuży /history/ oraz /history/{id}/
router = DefaultRouter()
router.register(r'history', ForecastViewSet, basename='forecast-history')

urlpatterns = [
    # Ścieżka do treningu (wymaga metody POST)
    # Adres: http://127.0.0.1:8000/api/forecasting/train/
    path('train/', TrainModelView.as_view(), name='train-model'),

    # Ścieżka do generowania prognozy (metoda GET)
    # Adres: http://127.0.0.1:8000/api/forecasting/predict/
    path('predict/', GenerateForecastView.as_view(), name='generate-forecast'),

    # Dołączenie ścieżek z routera (obsługa historii)
    # Adres: http://127.0.0.1:8000/api/forecasting/history/
    path('', include(router.urls)),
]