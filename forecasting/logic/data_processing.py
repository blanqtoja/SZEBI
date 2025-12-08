import pandas as pd
import numpy as np
from django.db.models import Sum
from django.db.models.functions import TruncHour
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from acquisition.models import Measurement  # Twoje modele


class DataProcessing:
    def __init__(self):
        self.scaler = StandardScaler()
        self.data_from_acquisition = None

    def filterData(self):
        """
        Pobiera surowe dane z bazy i tworzy wstępny DataFrame.
        """
        # 1. Pobieramy Zużycie (Agregacja godzinowa)
        consumption_qs = Measurement.objects.filter(
            sensor__type__name='Licznik Energii'  # Upewnij się co do nazwy w bazie
        ).annotate(hour=TruncHour('timestamp')).values('hour').annotate(
            consumption=Sum('value')
        ).order_by('hour')

        # 2. Pobieramy Produkcję (Agregacja godzinowa)
        production_qs = Measurement.objects.filter(
            sensor__type__name='Inverter'
        ).annotate(hour=TruncHour('timestamp')).values('hour').annotate(
            production=Sum('value')
        ).order_by('hour')

        df_cons = pd.DataFrame(list(consumption_qs))
        df_prod = pd.DataFrame(list(production_qs))

        if df_cons.empty and df_prod.empty:
            print("Brak danych w bazie!")
            return None

        # Ustawiamy indeksy
        if not df_cons.empty: df_cons.set_index('hour', inplace=True)
        if not df_prod.empty: df_prod.set_index('hour', inplace=True)

        # Łączymy (Join)
        dataset = pd.DataFrame()
        if not df_cons.empty and not df_prod.empty:
            dataset = df_cons.join(df_prod, how='outer').fillna(0)
        elif not df_cons.empty:
            dataset = df_cons
            dataset['production'] = 0.0
        else:
            dataset = df_prod
            dataset['consumption'] = 0.0

        # Feature Engineering (Dodanie kolumn czasowych)
        dataset['hour_of_day'] = dataset.index.hour
        dataset['day_of_week'] = dataset.index.dayofweek
        dataset['month'] = dataset.index.month

        # MOCK Danych pogodowych (docelowo API)
        dataset['temp_outdoor'] = 15.0
        dataset['solar_radiation'] = dataset['hour_of_day'].apply(lambda h: 500 if 8 <= h <= 18 else 0)

        # Usuwamy NaN
        return dataset.dropna()

    def standardizeSplittingData(self, dataset):
        """
        Dzieli na X i Y oraz skaluje.
        """

        y = dataset[['consumption', 'production']]

        # X = Cechy
        X = dataset[['hour_of_day', 'day_of_week', 'month', 'temp_outdoor', 'solar_radiation']]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0, shuffle=False)

        # Skalowanie
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train.values, y_test.values

    def getTrainingData(self):
        dataset = self.filterData()

        if dataset is None:
            return None, None, None, None

        return self.standardizeSplittingData(dataset)

    def getPredictionInput(self):
        """
        Metoda pomocnicza (nie było jej w diagramie, ale jest niezbędna dla PredictionManager),
        zwraca dane wejściowe na 'JUTRO'.
        """
        from django.utils import timezone
        import datetime

        # Generujemy 24h w przód
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        future_dates = [now + datetime.timedelta(hours=i) for i in range(1, 25)]

        df_future = pd.DataFrame({'timestamp': future_dates})
        df_future.set_index('timestamp', inplace=True)

        # Te same cechy co w treningu
        df_future['hour_of_day'] = df_future.index.hour
        df_future['day_of_week'] = df_future.index.dayofweek
        df_future['month'] = df_future.index.month
        df_future['temp_outdoor'] = 10.0
        df_future['solar_radiation'] = df_future['hour_of_day'].apply(lambda h: 300 if 9 <= h <= 17 else 0)

        return self.scaler.fit_transform(df_future)