import pandas as pd
from datetime import datetime
from evidently.model_profile import Profile
from sklearn import datasets, ensemble, model_selection
from evidently.pipeline.column_mapping import ColumnMapping
from evidently.model_profile.sections import ClassificationPerformanceProfileSection

from evidently.dashboard import Dashboard
from evidently.dashboard.tabs import ClassificationPerformanceTab

bcancer = datasets.load_breast_cancer()
bcancer_frame = pd.DataFrame(bcancer.data, columns=bcancer.feature_names)

# TODO: biz buraya kullanıcının verdiği feedbackleri gireceğiz
bcancer_frame["feedback"] = bcancer.target

print("bcancer_frame")
print(bcancer_frame.head())

target = "feedback"
prediction = "prediction"

numerical_features = bcancer.feature_names
categorical_features = []

features = numerical_features.tolist() + categorical_features

# model performance dashboard
# train_data, test_data = model_selection.train_test_split(bcancer_frame, random_state=0)
train_data = bcancer_frame
model = ensemble.RandomForestClassifier(random_state=0)

model.fit(train_data[features], train_data[target])

train_predictions = model.predict(train_data[features])
# test_predictions = model.predict(test_data[features])

train_data[prediction] = train_predictions
# test_data[prediction] = test_predictions

print("train data")
print(train_data.head())

# print("test data")
# print(test_data.head())

# do column mapping to let evidently understand the data
bcancer_column_mapping = ColumnMapping()
bcancer_column_mapping.target = target
bcancer_column_mapping.prediction = prediction
bcancer_column_mapping.numerical_features = numerical_features

bcancer_model_performance_dashboard = Dashboard(tabs=[ClassificationPerformanceTab(verbose_level=1)])
bcancer_model_performance_dashboard.calculate(train_data, None, column_mapping=bcancer_column_mapping)

bcancer_model_performance_dashboard.save('./bcancer_model_performance.html')

bcancer_classification_performance_profile = Profile(sections=[ClassificationPerformanceProfileSection()])
bcancer_classification_performance_profile.calculate(train_data, None, column_mapping=bcancer_column_mapping)

result = bcancer_classification_performance_profile.json() 

with open("bcancer_results.json", "w") as outfile:
    outfile.write(result)


