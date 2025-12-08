from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor
from .prediction_model import PredictionModel


class XGBoostModel(PredictionModel):
    def __init__(self, learningRate=0.1, nEstimators=100, maxDepth=3):
        super().__init__()

        self.learningRate = learningRate
        self.nEstimators = nEstimators
        self.maxDepth = maxDepth

        self.internalModel = MultiOutputRegressor(
            XGBRegressor(
                learning_rate=self.learningRate,
                n_estimators=self.nEstimators,
                max_depth=self.maxDepth,
                objective='reg:squarederror'
            )
        )

    def train(self, X_train, y_train):
        self.internalModel.fit(X_train, y_train)

    def predict(self, X_input):
        return self.internalModel.predict(X_input)