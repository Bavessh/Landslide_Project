# NER-LENS
## Complete Technical Architecture, Machine Learning, GIS, Emergency Intelligence & Jury Preparation Report

**Project:** NER-LENS, the NER Landslide Intelligence Platform  
**Purpose:** AI-assisted landslide early warning, monitoring, impact assessment, connectivity analysis, evacuation routing, shelter intelligence, citizen evidence, and emergency response for North Eastern India.  
**Analysis basis:** Read-only inspection of `e:\ner-landslide-intelligence-platform` and `e:\vortexa-backend` as they exist in this workspace on 2026-09-16.

> **Accuracy convention.** This report uses `FULLY IMPLEMENTED`, `PARTIALLY IMPLEMENTED`, `PROTOTYPE / SIMULATED`, `FALLBACK`, and `NOT IMPLEMENTED`. Where the repository does not contain the evidence, the report says **NOT CONFIRMED FROM CURRENT CODEBASE**.

---

## 1. Executive Summary

### A. Three-line explanation
NER-LENS combines environmental and terrain information with a trained CatBoost model to estimate landslide risk.  
It places risk stations and impact buffers on a North-East India GIS map, then connects risk to roads, routes, shelters, alerts, and reports.  
The current system is a working hackathon platform with real backend inference and database APIs alongside explicitly labelled prototype and fallback data.

### B. Thirty-second explanation
Landslides are difficult because failure depends on interacting rainfall, soil moisture, terrain, previous failures, and human infrastructure. NER-LENS retrieves or stores these inputs, predicts a probability with a serialized CatBoost model, converts that result into operational risk levels, and displays it geographically. The authority workflow continues from risk to affected assets, at-risk roads, ORS route geometry, shelter ranking, alerts, and field evidence. Citizen and rescue views expose simplified operational information. Some frontend stations, environmental values, route fallbacks, and decision-support features remain prototype or fallback behavior and are labelled accordingly.

### C. One-minute explanation
The system serves three roles: Authority, Citizen, and Rescue Team. A FastAPI backend uses SQLAlchemy and PostGIS tables for locations, environmental observations, terrain features, historical landslides, roads, settlements, shelters, predictions, impacts, alerts, and reports. The risk endpoint loads the latest environmental and terrain rows, computes historical landslide count and nearest-event distance within 5 km, and passes exactly seven features to a saved CatBoost classifier. The probability is stored as a risk prediction; positive predictions can mark nearby roads `AT_RISK` and create a duplicate-safe pending alert. The React/Vite frontend consumes these endpoints through `/api` and a development proxy, while preserving prototype datasets and clear truthfulness badges. OpenRouteService supplies route geometry, distance, and duration; NER-LENS separately evaluates route hazard exposure. The result is not only “high risk”, but a decision chain: risk, impact, connectivity, route, shelter, warning, and response.

**Primary sources:** `vortexa-backend/app/api/risk.py`, `app/services/ml_service.py`, `app/services/impact_service.py`, `app/services/route_recommendation_service.py`, `ner-landslide-intelligence-platform/src/App.tsx`, `src/services/backendAdapters.ts`, `src/components/gis/NERLeafletMap.tsx`.

## 2. Problem -> Solution

### Problem
Reactive reporting usually begins after a visible failure, road closure, or citizen call. It does not by itself answer which slope is becoming dangerous, what assets are exposed, whether an evacuation corridor is usable, or which shelter is safer. North Eastern India has steep terrain, intense monsoon rainfall, distributed settlements, road dependence, and difficult access, so a location-aware decision workflow is valuable.

### Solution in the current code

```text
Environmental records + terrain records + historical landslide context
                              |
                              v
                   Seven-feature CatBoost inference
                              |
                              v
       Probability -> threshold prediction -> risk score/level
                              |
                              v
                    GIS markers and risk buffers
                              |
                              v
                    PostGIS impact assessment
                              |
                              v
             Road-risk assessment and connectivity intelligence
                              |
                              v
     ORS route geometry / local route fallback + NER risk evaluation
                              |
                              v
                Prototype/backend-aware shelter ranking
                              |
                              v
                   Alerts, reports, authority/rescue actions
```

The backend prediction path is implemented. The complete chain is mixed: backend risk, impact, roads, shelters, locations, alerts, and reports are integrated; frontend route geometry remains ORS/fallback based and does not use backend safest-route as the primary provider; several forecasting and prioritization features are transparent frontend calculations.

## 3. Complete System Architecture

```text
+--------------------------- DATA SOURCES ----------------------------+
| PostgreSQL/PostGIS rows | environmental APIs/ingestion | local seed  |
| historical landslides   | OSM/Leaflet tiles           | prototypes  |
+-------------------------------+----------------------------------+
                                |
                                v
+------------------+   +------------------+   +------------------------+
| Environmental    |   | Terrain          |   | Historical landslide  |
| records, ingest, |   | elevation/slope/ |   | points and PostGIS    |
| validation, sim  |   | distances        |   | spatial features      |
+--------+---------+   +--------+---------+   +-----------+------------+
         +---------------------+-------------------------+
                               v
                    +-----------------------+
                    | PostgreSQL + PostGIS  |
                    +-----------+-----------+
                                v
                    +-----------------------+
                    | FastAPI risk endpoint |
                    | MLService + CatBoost  |
                    +-----------+-----------+
                                v
                    +-----------------------+
                    | Risk + alert + road   |
                    | side effects          |
                    +-----------+-----------+
                                v
        +-----------------------+------------------------+
        | Impact service | Road-risk | Alerts | Reports  |
        +-----------------------+------------------------+
                                v
     +-------------------------------------------------------+
     | Vite /api proxy -> apiClient -> backendAdapters       |
     +----------------------------+--------------------------+
                                  v
     +-------------------------------------------------------+
     | React + TypeScript + Leaflet + Recharts + Tailwind    |
     | Authority | Citizen | Rescue | GIS and common views  |
     +----------------------+-------------------------------+
                            |
                            +--> OpenRouteService (separate)
                                 driving-car GeoJSON geometry,
                                 distance, duration, avoid polygon
```

**OpenRouteService is deliberately separate from backend route recommendation.** The frontend `routingService.ts` calls ORS when `VITE_ORS_API_KEY` exists and otherwise creates a mapped-corridor fallback. `route-recommendation` exists in the backend, but the current frontend preserves the completed ORS implementation and uses backend road/impact/risk information as hazard intelligence.

## 4. Complete Feature Inventory

| Feature | Purpose | Frontend / Backend | Logic / source | Status |
|---|---|---|---|---|
| AI landslide prediction | Predict probability from seven features | `RiskIntelligencePage`, `riskService.ts`; `api/risk.py`, `ml_service.py` | CatBoost `predict_proba` | **FULLY IMPLEMENTED** |
| Risk probability | Probability in `[0,1]` | `RiskNowNext`; `risk.py` | model output | **FULLY IMPLEMENTED** |
| Risk score | Probability x 100 | frontend and backend | `round(probability * 100, 2)` | **FULLY IMPLEMENTED** |
| Risk classification | Operational level | `RiskBadge`; `risk.py` | prediction plus probability rules | **FULLY IMPLEMENTED** |
| Risk Now | Current risk display | `RiskNowNext` | current location score/backend overlay | **MIXED** |
| Risk Next | +6/+12/+24 projection | `riskService.ts` | transparent trend multipliers | **PROTOTYPE / SIMULATED** |
| Rain 1h/6h/24h/3d/7d | Environmental storage | backend environmental model/API | database columns | **FULLY IMPLEMENTED storage/API** |
| Antecedent rainfall index | Stored saturation-memory parameter | environmental model/API | database field | **FULLY IMPLEMENTED storage; final ML use not confirmed** |
| Rainfall memory | Explainability/forecast display | `riskService`, weather components | frontend synthetic trend/decay values | **PROTOTYPE / SIMULATED** |
| Soil moisture | ML and environmental input | backend + frontend mapping | seven-feature model uses it | **FULLY IMPLEMENTED** |
| Elevation/slope | Terrain and ML inputs | terrain API/frontend location | seven-feature model uses both | **FULLY IMPLEMENTED** |
| Curvature/ruggedness/distances | Stored terrain context | `terrain.py`, model | stored; not in seven-feature vector | **PARTIALLY IMPLEMENTED** |
| Historical density/nearest distance | Historical ML features | `risk.py` + PostGIS | `ST_DWithin` 5 km, `ST_Distance` | **FULLY IMPLEMENTED** |
| GIS map | Spatial operations display | `NERLeafletMap.tsx` | Leaflet + OSM | **FULLY IMPLEMENTED** |
| Risk stations | Show monitored locations | map + `getLocations` | merged prototype/backend list | **MIXED** |
| Risk buffers/heatmap | Visual susceptibility envelope | map | circles for HIGH/CRITICAL | **FULLY IMPLEMENTED frontend visualization** |
| Impact analysis | Radius and affected assets | `ImpactAnalysisPage`; `impact_service.py` | projected metre buffer + asset distances | **FULLY IMPLEMENTED backend; mixed UI** |
| Affected settlements | Exposure list | impact page/backend | asset classification | **FULLY IMPLEMENTED where assessment exists** |
| Affected roads | Exposure and road risk | road/impact modules | PostGIS proximity | **FULLY IMPLEMENTED backend** |
| Road-risk prediction | Road status/penalty | `road_risk.py` | distance <= 1000 m and risk score thresholds | **FULLY IMPLEMENTED backend** |
| Road connectivity | Operational road state | road services/pages | backend records + prototype fallback | **MIXED** |
| Alternative routing | Route A/B comparison | `routingService.ts` | ORS direct/avoid-polygon calls | **FULLY IMPLEMENTED / FALLBACK** |
| OpenRouteService | Geometry/distance/duration | `routingService.ts` | driving-car GeoJSON | **FULLY IMPLEMENTED when key exists** |
| Route hazard evaluation | Decide safety separately from ORS | `evaluateRouteSafety` | coordinate proximity and risk thresholds | **FULLY IMPLEMENTED frontend** |
| Backend route recommendation | Graph-based safety route | `route_recommendation_service.py` | NetworkX weighted graph | **BACKEND IMPLEMENTED; not primary frontend provider** |
| Shelter intelligence | Candidate ranking | `shelterService.ts`, shelter page | weighted prototype ranking, backend records when available | **MIXED** |
| Alerts | Store/retrieve/generate warnings | `alerts.py`, dashboard | HIGH/CRITICAL, duplicate pending check | **FULLY IMPLEMENTED backend** |
| Citizen reports | Submit and list field evidence | `CitizenPortal`, `reports.py` | PostGIS POINT, pending status | **MIXED; verify UI call path** |
| Authority dashboard | Monitoring/decision workspace | authority components | operational state in `App.tsx` | **FULLY IMPLEMENTED UI** |
| Citizen dashboard | Public risk/report view | `CitizenPortal.tsx` | simplified frontend view | **PARTIALLY IMPLEMENTED** |
| Rescue dashboard | Response operations | `RescueOperations.tsx` | frontend operations view | **PARTIALLY IMPLEMENTED** |
| Multilingual support | language selector/type | `App.tsx`, `Language` type | UI state exists | **PARTIALLY IMPLEMENTED** |
| What-if simulation | Counterfactual risk/impact | `scenarioService.ts` | transparent arithmetic scenario model | **PROTOTYPE / SIMULATED** |
| Response priority | Rank operational attention | `responsePriorityService.ts` | weighted prototype score | **PROTOTYPE / SIMULATED** |
| Prototype fallback | Continue on API failures | services/API | catches `ApiError`, local datasets | **FULLY IMPLEMENTED** |
| Offline concept | Keep UI alive with local data | services | fallbacks; not a full offline PWA | **PARTIALLY IMPLEMENTED** |
| Truthfulness labels | Distinguish provenance | `DataTruthfulnessBadge`, popups | provenance enum and labels | **FULLY IMPLEMENTED UI pattern** |
| PostgreSQL/PostGIS | Durable spatial backend | `database.py`, models | SQLAlchemy + GeoAlchemy2 | **FULLY IMPLEMENTED dependency/config path** |
| Frontend-backend integration | API consumption | `apiClient`, `backendAdapters` | Vite proxy `/api` | **FULLY IMPLEMENTED for integrated endpoints** |

## 5. Complete Tech Stack

| Layer | Technology | Purpose | Evidence |
|---|---|---|---|
| UI | React 19 | component UI and state | `package.json`, `.tsx` |
| Language | TypeScript | typed frontend contracts | `tsconfig.json`, `src/types` |
| Build | Vite | dev server, build, proxy | `vite.config.ts` |
| Styling | Tailwind CSS v4 Vite plugin | utility styling | `package.json`, `vite.config.ts` |
| GIS | Leaflet | interactive map/layers | `NERLeafletMap.tsx` |
| Basemap | OpenStreetMap tiles | map background | `NERLeafletMap.tsx` |
| Charts | Recharts | risk/rainfall charts | frontend chart components/package |
| Icons | Lucide React | interface icons | components/package |
| Backend | Python + FastAPI | HTTP API | `app/main.py`, requirements |
| Validation | Pydantic | request schemas | `app/schemas` |
| ORM | SQLAlchemy | database access/models | `app/models`, APIs |
| Spatial ORM | GeoAlchemy2 | geometry columns | models |
| Database | PostgreSQL, PostGIS expected | spatial persistence | `DATABASE_URL`, geometry casts |
| ML | CatBoost | binary classifier inference | `ml_service.py`, `.cbm` |
| Dataframe | pandas | inference input frame | `ml_service.py` |
| Array/scientific | NumPy/scipy dependencies | environment/model ecosystem | requirements; direct project use varies |
| Preprocessing | joblib serialized imputer | saved missing-value preprocessing | `landslide_imputer.joblib` |
| Graph | NetworkX | backend route graph/Dijkstra | `route_recommendation_service.py` |
| Geometry | Shapely | buffers, transformations, mappings | `impact_service.py` |
| Projection | PyProj | local metre-based impact calculations | `impact_service.py` |
| Routing | OpenRouteService HTTP API | route geometry/distance/duration | `routingService.ts` |
| Containers | Docker Compose file exists | deployment scaffolding | `docker-compose.yml`; exact runtime not confirmed |
| scikit-learn | Dependency exists | likely imputer artifact ecosystem | direct current import/training use not confirmed |

## 6. Machine Learning Overview

### Simple explanation
The deployed prediction service takes seven numeric values, applies the saved imputer, asks a CatBoost classifier for the positive-class probability, applies an operating threshold, and returns probability, binary prediction, human-readable model risk level, threshold, and model version.

### Verified implementation
- **Model library:** CatBoost.
- **Model file:** `e:\vortexa-backend\ml\models\catboost_landslide_model.cbm`.
- **Preprocessing file:** `e:\vortexa-backend\ml\models\landslide_imputer.joblib`.
- **Loader:** `MLService.load_model()` in `app/services/ml_service.py`.
- **Model version:** `catboost-v1`.
- **Inference:** `CatBoostClassifier().load_model(...)`, then `predict_proba(transformed_input)[0][1]`.
- **Features:** exactly `rainfall_24h`, `rainfall_7d`, `soil_moisture`, `elevation_m`, `slope_degrees`, `previous_landslides_5km`, `distance_to_previous_landslide_km`.
- **Missing values:** the saved joblib imputer is applied. The imputer strategy itself is **NOT CONFIRMED FROM CURRENT CODEBASE**.
- **Scaling:** no scaling is performed in `ml_service.py`; tree models generally do not require it, but the training pipeline is not present to confirm training preprocessing.
- **Categorical encoding:** no categorical inputs are accepted by `_validate_input`; **NOT CONFIRMED / NOT USED IN INFERENCE**.
- **Class imbalance:** no class-weight or resampling code appears in `ml_service.py`; **NOT CONFIRMED FROM CURRENT CODEBASE**.
- **Train/test split, random state, hyperparameters, dataset, target-generation script:** **NOT CONFIRMED FROM CURRENT CODEBASE**. No `train_model.py` was present under `e:\vortexa-backend\ml` during inspection.
- **Evaluation metrics:** backend tests check output validity and thresholds, not accuracy/precision/recall/AUC values. Metric values are **NOT CONFIRMED FROM CURRENT CODEBASE**.
- **Serialization:** CatBoost `.cbm` and joblib imputer are loaded at backend startup.

### Model classification
`MLService._classify_risk()` returns:

```text
if probability >= threshold:       High Risk
elif probability >= threshold*0.60: Moderate Risk
else:                              Low Risk
```

The API then maps the binary prediction into the platform's operational level:

```text
prediction == 1 and probability >= 0.75 -> CRITICAL
prediction == 1 and probability < 0.75  -> HIGH
prediction == 0 and probability >= 0.15 -> MEDIUM
otherwise                               -> LOW
```

The API returns both `ml_risk_level` and the platform `risk_level`; they are not identical labels.

## 7. Why CatBoost

### Simple explanation
CatBoost is a gradient-boosted decision-tree model. It is a reasonable choice for a small or medium tabular dataset where rainfall, soil, terrain, and historical context interact nonlinearly.

### Technical rationale
- Tree ensembles can represent thresholds and interactions such as steep slope plus high rainfall without manually fitting a linear equation.
- Numeric tabular inputs do not need standardization for tree splits.
- CatBoost has strong tabular-data performance and can handle more complex features if future versions add categorical fields.
- The current inference code explicitly relies on a saved imputer, not on undocumented CatBoost missing-value behavior.
- Suitability for the actual dataset size, validation quality, and hyperparameters cannot be confirmed because the training code/data are absent.

### Alternatives
- **Linear regression:** unsuitable for a binary event and nonlinear interactions; logistic regression would be the comparable classification baseline.
- **Logistic regression:** interpretable and useful as a baseline, but may underfit interactions unless engineered manually.
- **Random Forest:** strong tabular baseline and robust, but does not provide the same boosting formulation; actual comparative experiments are not present.
- **Neural network:** possible with enough labelled data, but adds tuning and scaling complexity not justified by verified repository evidence.
- **LSTM:** useful for dense temporal sequences; the deployed model receives one engineered row, not a time sequence.
- **CNN:** appropriate for images/rasters; the current inference path is tabular, not image-based.

## 8. Exact ML Features

| Feature | Meaning / unit | Database source | Landslide relevance | Final ML? |
|---|---|---|---|---|
| `rainfall_24h` | previous 24-hour rainfall, numeric amount | `environmental_data.rain_24h` | short-term loading/saturation | YES |
| `rainfall_7d` | previous seven-day rainfall, numeric amount | `environmental_data.rain_7d` | antecedent wetness | YES |
| `soil_moisture` | stored soil moisture value | `environmental_data.soil_moisture` | reduced shear strength/saturation | YES |
| `elevation_m` | elevation in metres | `terrain_features.elevation` | terrain context | YES |
| `slope_degrees` | slope angle | `terrain_features.slope` | gravitational susceptibility | YES |
| `previous_landslides_5km` | historical event count within 5 km | PostGIS query | local failure history | YES |
| `distance_to_previous_landslide_km` | nearest historical event distance, capped at 5 km when none exists | PostGIS `ST_Distance` | recurrence/proximity | YES |

### Collected/stored parameters
The environmental table stores `rain_1h`, `rain_6h`, `rain_24h`, `rain_3d`, `rain_7d`, `antecedent_rainfall_index`, and `soil_moisture`. The terrain table stores elevation, slope, curvature, ruggedness, distance to drainage, distance to road, and distance to settlement. These are available as backend records/API fields.

### Parameters actually passed to the final model
Only the seven fields listed above are constructed in `app/api/risk.py`. `rain_1h`, `rain_6h`, `rain_3d`, antecedent index, curvature, ruggedness, and terrain distances are stored or exposed but are not passed into `ml_service.predict()` in the verified code.

### Why they differ
A data model can collect more context than the current trained model consumes. This permits future retraining, explainability, monitoring, or alternate models without falsely claiming that every stored feature influences the current CatBoost prediction.

## 9. ML Dataset and Training

The deployed artifact exists and is tested for readiness, feature count, valid probability, binary prediction, and threshold behavior. The source dataset name, source institution, row count, class distribution, positive/negative label definition, duplicate policy, train/test split, random state, hyperparameters, feature-selection script, evaluation report, and export script are **NOT CONFIRMED FROM CURRENT CODEBASE**. No training source file was found under the inspected `ml` directory, which contains `models/catboost_landslide_model.cbm` and `models/landslide_imputer.joblib`.

Do not tell a jury an accuracy number or claim a particular split unless you have the missing training artifacts separately.

## 10. ML Training Pipeline

The verified runtime pipeline is:

```text
Database latest environmental + terrain rows
        + PostGIS historical count/distance
        -> seven-feature dictionary
        -> pandas DataFrame in exact feature order
        -> saved joblib imputer
        -> CatBoost predict_proba
        -> threshold comparison
        -> prediction, risk levels, persistence
```

The **training** pipeline is only partially documented by the artifact boundary:

```text
Raw training data -> cleaning -> feature engineering -> feature selection
                 -> train/test split -> CatBoost training -> evaluation
                 -> threshold selection -> .cbm + imputer export
```

The first five stages and their parameters are **NOT CONFIRMED FROM CURRENT CODEBASE**. Only the exported artifacts and inference contract are verified.

## 11. “How did you train the model?” answers

### Thirty-second answer
“We deployed a CatBoost classifier for tabular landslide risk. At inference, it uses seven engineered features: 24-hour and 7-day rainfall, soil moisture, elevation, slope, historical events within 5 km, and distance to the nearest previous event. A saved imputer prepares the row, CatBoost returns the positive-class probability, and operating-mode thresholds convert that probability into a binary prediction and risk level. The repository contains the trained artifact and inference tests; the original training script and dataset are not included in this checkout.”

### One-minute answer
“The backend loads `catboost_landslide_model.cbm` and `landslide_imputer.joblib` once. For a location, it selects the latest environmental and terrain records and runs a PostGIS 5 km historical query. It constructs exactly seven features in the order defined by `MLService.FEATURES`, applies the saved imputer, and calls `predict_proba`. The balanced threshold is `0.3256194668`; safety-first is `0.2505749091`. The result is persisted with model version `catboost-v1`, a 24-hour prediction window, and a platform risk level. The codebase does not contain enough evidence to state the training row count, split, hyperparameters, or measured evaluation scores.”

### Deep answer
See Sections 6, 8, 9, 10, 12, 14, and 15. The important distinction is between verified deployment/inference and unavailable training provenance.

## 12. ML Metrics

| Metric | Repository evidence | Status |
|---|---|---|
| Accuracy | no computed value found in inspected files | NOT CONFIRMED |
| Precision | no computed value found | NOT CONFIRMED |
| Recall | no computed value found | NOT CONFIRMED |
| F1 | no computed value found | NOT CONFIRMED |
| ROC-AUC | no computed value found | NOT CONFIRMED |
| PR-AUC | no computed value found | NOT CONFIRMED |
| Confusion matrix | no computed value found | NOT CONFIRMED |
| Calibration | no computed value found | NOT CONFIRMED |
| False positives/negatives | no measured report found | NOT CONFIRMED |
| Runtime validity | tests verify probability range, binary prediction, levels, thresholds | FULLY IMPLEMENTED test coverage |

Recall matters in early warning because missing a real dangerous slope can cost lives and isolate communities. However, safety-first thresholds can increase false alarms, so an honest production system must measure precision, recall, calibration, and operational false-alarm cost before deployment.

## 13. Full Prediction Request Trace

### On-demand backend prediction

```text
POST /api/v1/risk/predict?location_id=<id>&operating_mode=<mode>
  -> app/api/risk.py::predict_risk
  -> query Location
  -> latest EnvironmentalData by timestamp
  -> latest TerrainFeatures by calculated_at
  -> PostGIS historical_landslides ST_DWithin 5000 m
  -> COUNT(*) and MIN(ST_Distance(...))
  -> default nearest distance 5.0 km if none exists
  -> build seven-feature dictionary
  -> app/services/ml_service.py::MLService.predict
  -> _validate_input -> pandas DataFrame
  -> saved imputer.transform
  -> CatBoost predict_proba()[0][1]
  -> threshold and binary prediction
  -> risk score = probability * 100
  -> platform risk_level conversion
  -> insert RiskPrediction
  -> positive result updates nearby road status within 1000 m
  -> duplicate-safe pending Alert creation
  -> response with input features, prediction, actions
```

### Frontend read path

```text
App.tsx loadData
  -> intelligenceService.getLocations
  -> backendAdapters.getBackendLocations
  -> getBackendEnvironment / getBackendTerrain / getBackendRisk
  -> merge backend prediction stations with prototype stations
  -> RiskNowNext / RiskIntelligencePage
  -> riskService.getRiskNowNext for live risk overlay and forecast display
```

The frontend read endpoint `/api/v1/risk/{location_id}` returns the latest stored prediction; it does not itself train or recompute the model.

## 14. Risk Values Explained

| Value | Meaning |
|---|---|
| `landslide_probability` / `risk_probability` | CatBoost positive-class probability in `[0,1]`, e.g. `0.7896`. |
| `risk_score` | Backend display score, `round(probability * 100, 2)`, e.g. `78.96`. |
| `prediction` | Binary threshold decision, `1` when probability is at least the selected operating threshold. |
| `ml_risk_level` | `High Risk`, `Moderate Risk`, or `Low Risk` returned by `MLService`. |
| `risk_level` | Platform operational value `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`; `CRITICAL` is assigned when prediction is 1 and probability >= 0.75. |
| `confidence` | Stored nullable field; current `predict_risk` explicitly sets it to `None`. |
| `decision_threshold` | Threshold used for the binary decision. |
| `operating_mode` | `balanced` or `safety_first`. |
| `prediction_window` | Stored as `24h` by the API. |
| `model_version` | `catboost-v1`. |

The example `0.7896 -> 78.96 -> prediction 1 -> CRITICAL` is consistent with the API’s risk conversion if the selected threshold is below `0.7896`.

## 15. Operating Thresholds

```text
balanced    = 0.3256194668
safety_first = 0.2505749091
```

The binary prediction is `1` when probability is greater than or equal to the selected threshold. Safety-first is lower, so it is more sensitive and can warn earlier at the cost of more potential false positives. The repository does not contain a measured comparison of the two modes.

## 16. Environmental Data Module

| Parameter | Current source/status |
|---|---|
| `rain_1h`, `rain_6h`, `rain_24h`, `rain_3d`, `rain_7d` | PostgreSQL `environmental_data` columns and GET/POST API; ingestion/simulation modules also exist. Actual external source for stored rows is not confirmed. |
| Antecedent rainfall index | Stored API/database field; not used in the final seven-feature vector. |
| Soil moisture | Database field and one of the seven ML inputs. |
| Timestamp | `EnvironmentalData.timestamp`; latest row is selected for prediction. |
| Environmental simulation | `/api/v1/environmental-simulation/generate`, `generate-batch`, `generate-all`; explicitly writes `source=simulated`, `is_simulated=True`. |
| Frontend weather | `weatherService.ts` calls Open-Meteo directly for current weather; on failure it returns a historical baseline labelled offline fallback. |

Classification: database rows are **PROJECT API / DATABASE DATA**; simulator output is **SIMULATED DATA**; Open-Meteo success is **EXTERNAL LIVE DATA**; frontend weather fallback is **PROTOTYPE/FALLBACK**.

## 17. Rainfall Memory

The backend stores an antecedent rainfall index, but no backend rainfall-decay equation was found in the inspected production prediction path. The frontend includes prototype rainfall-memory and forecast logic. In `riskService.ts`, explanations use `rainfallDecayMemoryMm`, and trend/forecast values are generated from location fields and trend multipliers. `weatherService.ts` estimates soil moisture from the first six hourly values when available, otherwise from humidity.

A defensible jury sentence is: “The database schema supports antecedent rainfall memory, while the current CatBoost contract uses 24-hour and 7-day rainfall. The frontend also demonstrates transparent prototype memory/forecast views; these must not be described as a separately verified ML feature unless the training artifacts confirm it.”

## 18. Terrain Intelligence

| Parameter | Scientific meaning | Stored | Direct final ML use |
|---|---|---:|---:|
| Elevation | height above reference datum; terrain/climate context | yes | YES |
| Slope | local inclination; larger slope generally increases gravitational susceptibility | yes | YES |
| Curvature | concavity/convexity affecting flow and stress concentration | yes | NO in current seven-feature vector |
| Ruggedness | local terrain roughness | yes | NO |
| Distance to drainage | hydrological proximity/runoff influence | yes | NO |
| Distance to road | road-cut/infrastructure proximity | yes | NO |
| Distance to settlement | exposure context | yes | NO |

Terrain rows are selected latest by `calculated_at`. The scientific interpretation is useful for future feature engineering, but only elevation and slope are passed to the current model.

## 19. Historical Landslide Intelligence

Historical events are stored in `historical_landslides` as latitude, longitude, PostGIS `POINT`, event date, severity, source, and description. `risk.py` runs a SQL query using:

- `ST_DWithin(geom::geography, point::geography, 5000)` to select events within 5,000 metres.
- `COUNT(*)` as `previous_landslides_5km`.
- `MIN(ST_Distance(...))` as nearest distance in metres.
- Divide by 1,000 for kilometres.
- If no nearest event exists, use `5.0` km as the model feature default.

This is a real spatial feature-engineering path. The repository does not expose the actual number/source of historical rows in this report environment.

## 20. Database Architecture

| Table/model | Important columns | Relationships/module |
|---|---|---|
| `locations` | id, name, district, state, latitude, longitude, POINT geom | parent for environmental, terrain, risk, alerts, reports/impact |
| `environmental_data` | location_id, timestamp, rain 1h/6h/24h/3d/7d, antecedent index, soil moisture | risk input, environmental APIs |
| `terrain_features` | location_id, elevation, slope, curvature, ruggedness, distances, calculated_at | risk input/context |
| `historical_landslides` | lat/lon, POINT geom, date, severity, source, description | PostGIS historical features |
| `risk_predictions` | location_id, probability, score, levels, mode, threshold, prediction, confidence, version, window, timestamp | prediction persistence |
| `roads` | name, road_type, LINESTRING geom, status | road and routing graph |
| `road_risk_assessments` | road/location IDs, risk score/level/status, blocked, penalty, distance, impact, assessed_at | road intelligence and routing |
| `settlements` | name, population, POINT geom | impact/routing context |
| `shelters` | name, capacity, POINT geom, status | impact and evacuation |
| `impact_assessments` | risk linkage, radius, GeoJSON impact zone, summary counts | stored impact result |
| `impact_assessment_assets` | asset type/name/coordinates/distance/level/priority/status/geometry | affected assets |
| `alerts` | location/prediction IDs, severity/title/message/target/status/timestamps | warning workflow |
| `field_reports` | coordinates, type, description, POINT geom, status, created_at | citizen/field evidence |
| `monitoring_records` | model imported in `main.py`; exact fields not reviewed here | monitoring module |

`Base.metadata.create_all(bind=engine)` runs at application import/startup. Migrations are not evident in the inspected repository.

## 21. Why PostgreSQL + PostGIS

PostgreSQL provides relational integrity, timestamps, foreign keys, and queryability. PostGIS adds geometry types and geography-aware distance operations. This project uses:

- `POINT` for locations, settlements, shelters, historical events, reports.
- `LINESTRING` for roads.
- SRID 4326 for latitude/longitude.
- `geom::geography` for metre-based distance calculations.
- `ST_DWithin` for 5 km historical lookup, 1 km road-risk proximity, and 2 km settlement proximity near roads.
- `ST_Distance` for nearest-event and road/location distance.
- Shapely/PyProj for local metre-based impact buffers and GeoJSON output.

## 22. Impact Assessment Algorithm

`ImpactAssessmentService.RISK_RADII` is exact:

```text
LOW      -> 100 m
MODERATE -> 250 m
HIGH     -> 500 m
CRITICAL -> 1000 m
```

The service can accept a positive `radius_meters` override. It creates a local azimuthal-equidistant projection centered on the risk location, buffers the local point in metres, transforms the polygon back to EPSG:4326, and stores a GeoJSON Feature.

Assets are collected from all roads, settlements, and shelters. Roads use a representative midpoint; settlements and shelters use their point geometry. Local projected distance is calculated. Assets outside the radius are discarded.

Priority map:

```text
HOSPITAL, BRIDGE, MAIN_ROAD, SHELTER -> 5
SCHOOL, VILLAGE, SETTLEMENT          -> 4
BUILDING, MINOR_ROAD, ROAD            -> 2
default                                -> 2
```

Impact level:

```text
ratio = distance_m / radius_m
if ratio <= 0.25 or priority >= 5 -> CRITICAL
elif ratio <= 0.60              -> HIGH
elif ratio <= 1.00              -> MODERATE
else                            -> LOW
```

The summary counts total assets, road assets, villages/settlements, and critical assets. `impact_status` is currently `Potentially Affected`; it does not confirm damage. `GET /api/v1/impact/geojson/{location_id}` returns the zone and asset geometries.

## 23. Road Intelligence

Backend road records contain a name, road type, LINESTRING, and base status. Road-risk assessment uses the latest risk prediction in the current implementation, computes road-to-location distance, and treats a road within 1,000 m as affected.

Exact risk penalties:

```text
affected and score >= 75 -> AT_RISK, penalty 40
affected and score >= 50 -> AT_RISK, penalty 25
affected and score >= 25 -> AT_RISK, penalty 10
otherwise                -> SAFE, penalty 0
```

Confirmed `BLOCKED` is excluded from the backend route graph. Recognized statuses include `OPEN`, `AT_RISK`, `POTENTIALLY_BLOCKED`, `REPORTED_BLOCKED`, and `BLOCKED`; frontend types additionally use `SAFE`, `LIKELY BLOCKED`, and `CAUTION` for its operational UI. The frontend adapter maps backend `AT_RISK` to caution/pass-through styling while retaining hazard meaning in road intelligence.

## 24. Routing Algorithms

### A. Backend routing
`route_recommendation_service.py` loads roads and their latest road-risk assessment using a lateral SQL query. Each valid LINESTRING contributes an edge between deterministic endpoint nodes. Road length is calculated with `ST_Length(geom::geography)/1000`.

Blocked roads are skipped. Each edge stores road ID/name, length, status, risk score, risk level, risk penalty, geometry, and weight. `networkx` is used for graph routing; the remainder of the file should be treated as the implementation source for `find_route` and alternative route behavior. The verified cost function is:

```text
cost = length_km + risk_penalty * mode_multiplier
balanced:     multiplier 1.0
safety_first: multiplier 3.0
REPORTED_BLOCKED: add 1000 (normally excluded/defensive rule)
```

### B. Frontend ORS routing
`routingService.ts` calls:

```text
POST https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson
Authorization: VITE_ORS_API_KEY
```

It supplies `[longitude, latitude]` coordinates, requests fastest driving-car routing, optionally supplies a GeoJSON `avoid_polygons` hazard envelope, then converts returned coordinates back to Leaflet `[latitude, longitude]`. ORS supplies geometry, distance, and duration. The project evaluates safety independently by checking route-point proximity to the selected hazard location and its risk score.

When ORS is unavailable, the service generates high-fidelity corridor waypoints and approximate distance/duration; that is a **FALLBACK**, not live routing. Route A is direct; Route B is hazard-avoiding when Route A is unsafe. The frontend keeps this ORS implementation as primary and does not replace it with `/api/v1/route-recommendation/safest`.

## 25. Dijkstra Algorithm

The backend graph represents road endpoints as nodes and road segments as weighted edges. A shortest-path algorithm minimizes total edge weight, which here is distance plus risk penalty, rather than distance alone. Therefore a longer road may be preferred if its hazard penalty is lower. Exact call details for `find_route` are in the remainder of `route_recommendation_service.py`; the loaded graph and weights are verified. The same-node/zero-edge situation is a known operational limitation in the backend route-recommendation path and is not used as the frontend's primary route provider.

## 26. Shelter Intelligence

`ShelterService.getShelterRecommendations()` ranks shelters with these exact prototype weights:

```text
access safety       40%
hazard exposure      25%
capacity ratio      20%
distance/time        10%
facility readiness    5%
```

Hazard exposure is based on Haversine distance from the active hazard: <=2 km HIGH, <=4 km MODERATE, otherwise LOW. Access scores are derived from route status and route hazard exposure. Facility readiness is the fraction of medical post, power backup, food/water, and sanitation capabilities that are true. A hard failure exists for zero available capacity, HIGH shelter hazard, BLOCKED route, or CRITICAL route exposure. The highest non-failing candidate is recommended.

Backend shelter records are used when available; the ranking remains a transparent project-side score. “Nearest” is not automatically “safest”: a farther shelter with capacity and safe access can outrank a close shelter inside a hazard buffer.

## 27. GIS Architecture

`NERLeafletMap.tsx` initializes Leaflet, fits NER bounds, switches OSM/OpenTopoMap basemaps, and manages layer groups for state boundaries, districts, focus, heat buffers, roads, infrastructure, shelters, reports, slopes, and routes.

Key behaviors:

- OSM is the live base map when tiles load.
- Coordinates use WGS84-style latitude/longitude; backend geometry is SRID 4326.
- Risk markers use semantic colors: critical red, high orange/red, moderate amber, low green.
- HIGH/CRITICAL locations receive visual circles when the risk-heatmap toggle is enabled.
- Roads, shelters, settlements/infrastructure, field reports, and route lines are separate layer groups.
- State/district filters are applied before locations reach the map.
- Selected locations receive a visual marker emphasis and popup inspection action.
- Popup provenance distinguishes AI prediction from simulated station data.

## 28. GIS Prediction Point Merge

The current frontend merge is in `intelligenceService.getLocations()`:

1. Start with all `INITIAL_MONITORED_LOCATIONS`.
2. Fetch `/api/v1/locations/`.
3. Exclude backend location names containing `shelter` or `evacuation` from slope prediction stations.
4. For each remaining backend location, find a prototype match only when state and district match and coordinates are within 0.02 degrees in both axes.
5. Overlay backend ID/name/coordinates and successful environment/terrain/risk values onto the prototype record, or append a new backend prediction location.
6. On backend risk failure, preserve the station as `PROTOTYPE DATA` rather than claiming AI prediction.
7. Filter the merged list by state/district.

The inspected prototype file has **8 existing monitored stations** (`LOC-NL-01` through `LOC-TR-08`). The verified backend test data includes one valid prediction station, `Steep Forest Slope`, and one shelter-only location, `East Khasi Emergency Shelter`. Therefore the expected current count is approximately **8 prototype stations + 1 backend station = 9 markers**, unless the backend station coordinate-matches one of the eight prototype stations. No random stations are generated.

## 29. Data Provenance

| Label | Meaning in this project |
|---|---|
| `LIVE MAP` | OSM/OpenTopoMap cartographic tiles or live map layer context. |
| `LIVE WEATHER` | UI taxonomy for weather; `weatherService.ts` actually uses Open-Meteo on success. |
| `PROJECT API` | Value returned by the connected backend/API, especially operational records. |
| `AI PREDICTION` | Actual backend ML risk result or an explicitly model-derived value. |
| `HISTORICAL DATA` | Historical archive/context label. |
| `PROTOTYPE DATA` | Curated/simulated frontend values or a fallback value. |

Transparency matters because an attractive map can otherwise imply that every station is a government sensor, every rainfall number is live, or every route is officially safe.

## 30. Real vs Simulated Data

| Component | Classification | Source | UI treatment |
|---|---|---|---|
| OSM map | Real external map | OpenStreetMap tiles | `LIVE MAP` context |
| ORS route | Real external response when key exists | OpenRouteService | live-key indicator; fallback otherwise |
| Backend database | Real project API records | PostgreSQL/PostGIS | `PROJECT API` |
| ML prediction | Real deployed model inference/storage | CatBoost artifact + API | `AI PREDICTION`; disclaimer |
| Environmental API rows | Mixed | database/API; simulator can write explicit simulated rows | source/is_simulated backend fields; frontend labels vary |
| Terrain rows | Project database | terrain API | project/backend data |
| Prototype slope stations | Prototype | `INITIAL_MONITORED_LOCATIONS` | `PROTOTYPE DATA` / simulated station |
| Impact | Mixed | backend PostGIS assessment or frontend prototype service | `PROJECT API` when backend, prototype label otherwise |
| Roads | Mixed | backend roads/road-risk or curated frontend roads | backend status/project labels or fallback |
| Settlements | Mixed | backend settlement API or local GIS dataset | project API/fallback |
| Shelters | Mixed | backend records or prototype ranking dataset | source type and fallback ranking |
| Citizen reports | Mixed | backend report API plus frontend local fallback | field evidence/verification fields |
| Alerts | Mixed | backend alert API or prototype bulletins | alert status/source |
| Risk forecasts | Prototype unless separately sourced | frontend trend multipliers | prototype forecast label |

## 31. Simulation

Verified simulations include:

- Backend environmental simulator: generates, normalizes, validates, marks `source=simulated`, `is_simulated=True`, and stores records.
- Frontend future risk horizons: `RiskService` uses trend multipliers to project +6/+12/+24 hours.
- Frontend scenario/what-if: adjusts risk for rainfall change, soil moisture change, rainfall memory, drainage condition, road failure, and horizon; estimates population, settlements, roads, shelter demand, and route consequence.
- Frontend road failure demo: marks a selected prototype road blocked and switches route display.
- Fallback route geometry when ORS is unavailable.
- Prototype monitored locations and curated baseline environmental/risk values.

These are useful for a hackathon demonstration but are not claims of live sensing or guaranteed forecasts.

## 32. Frontend Architecture

- `App.tsx` owns role, tab, state/district filters, selected location/road/route/shelter, loading, backend connectivity, and initial parallel service loading.
- Authority components include overview, risk intelligence, weather, impact, roads, shelters, response priorities, field evidence, and what-if pages.
- `CitizenPortal.tsx` provides public-facing risk/report functionality.
- `RescueOperations.tsx` provides rescue-oriented operational views.
- GIS components include `NERLeafletMap` and `LocationIntelligenceDrawer`.
- Common components include loading/error/empty states, risk badges, truthfulness badges, connectivity, and Risk Now/Next.
- Services isolate data access and algorithmic logic.
- `types/index.ts` provides shared domain contracts.
- `data/nerGeography.ts` provides prototype locations, roads, shelters, reports, bulletins, and NER metadata.

State flows down from `App` through props. Selection callbacks move user choices back to `App`; service calls update local page state.

## 33. Frontend <-> Backend Integration

```text
React component
  -> service method
  -> backendAdapters.ts
  -> apiClient.ts
  -> /api/v1/... same-origin request
  -> Vite development proxy
  -> FastAPI router
  -> SQLAlchemy/PostGIS/ML service
```

- `apiClient.ts` provides typed GET/POST/etc., an eight-second abort timeout, JSON handling, and `ApiError`.
- `backendAdapters.ts` names location, environment, terrain, risk, impact, road, settlement, shelter, and alert calls.
- `intelligenceService.ts` merges locations and maps backend records to frontend contracts.
- `riskService.ts` overlays backend risk for numeric backend IDs and preserves prototype calculations for forecast/explanation views.
- `impactService.ts` uses backend impact for numeric backend locations and falls back to its transparent prototype generator.
- `roadService.ts` and `shelterService.ts` consume backend records while retaining local fallback/ranking behavior.
- `routingService.ts` remains ORS/local geometry based.
- Errors preserve fallback data and do not invent backend values.

## 34. Vite Proxy

The frontend calls `/api/v1/...`, not a hardcoded backend origin. In development, `vite.config.ts` proxies `/api` to `http://127.0.0.1:8000`. This gives same-origin browser requests, simplifies local CORS, and centralizes the backend target. Production requires a reverse proxy or deployment configuration that routes `/api` to FastAPI; the current Vite dev proxy alone is not a production ingress design.

## 35. API Documentation

| Method | Endpoint | Purpose | Frontend/backend consumer | Effect |
|---|---|---|---|---|
| GET | `/api/v1/health` | health | `apiClient.health`, connectivity | read |
| GET | `/api/v1/locations/` | list locations | `getBackendLocations` | read |
| GET | `/api/v1/locations/{id}` | one location | backend location lookup | read |
| GET/POST | `/api/v1/environment/{id}`, `/api/v1/environment/` | read/create environmental rows | adapters/admin workflows | POST writes |
| GET/POST | `/api/v1/terrain/{id}`, `/api/v1/terrain/` | read/create terrain | adapters/admin workflows | POST writes |
| GET | `/api/v1/risk/{id}` | latest stored risk | frontend risk overlay | read |
| POST | `/api/v1/risk/predict` | execute/store ML prediction | backend/test/operation | prediction, road and alert side effects |
| GET | `/api/v1/landslides/` | historical landslides | backend GIS/module | read |
| GET | `/api/v1/roads/` | road records | frontend services | read |
| GET | `/api/v1/road-risk/` | latest road-risk list | backend/operational consumers | read |
| POST | `/api/v1/road-risk/assess/{road_id}` | calculate road risk | backend operations | writes assessment |
| GET | `/api/v1/road-risk/road/{road_id}` | latest road assessment | backend operations | read |
| POST | `/api/v1/impact/assess/{location_id}` | generate/store impact | backend impact workflow | writes assessment/assets |
| GET | `/api/v1/impact/{location_id}` | latest impact | frontend impact adapter | read |
| GET | `/api/v1/impact/{id}/assets` | affected assets | impact consumer | read |
| GET | `/api/v1/impact/geojson/{id}` | zone/assets GeoJSON | GIS-capable consumer | read |
| GET | `/api/v1/impact/summary/all` | impact summaries | dashboard/operations | read |
| GET | `/api/v1/settlements/` | settlements | frontend GIS adapter | read |
| GET | `/api/v1/shelters/` | shelters | frontend shelter adapter | read |
| GET | `/api/v1/reports/` | field reports | intelligence service | read |
| POST | `/api/v1/reports/` | create field report | citizen path where connected | writes report |
| GET | `/api/v1/alerts/` | latest alerts | authority dashboard | read |
| POST | `/api/v1/alerts/` | create alert | backend/admin | writes alert |
| POST | `/api/v1/alerts/auto-generate/{id}` | generate alert from risk | backend operation | duplicate-safe write |
| GET | `/api/v1/dashboard/` | dashboard endpoint | backend dashboard module | read; exact payload not fully inspected |
| POST | `/api/v1/routes/...` | route module | backend routes router | exact paths not fully confirmed |
| POST | `/api/v1/route-recommendation/find` | graph route | backend route module | read/compute |
| POST | `/api/v1/route-recommendation/safest` | safety-first graph route | backend route module | read/compute |
| GET | `/api/v1/route-recommendation/network` | graph network | backend route module | read |
| GET | `/api/v1/route-recommendation/status` | route module status | backend route module | read |
| POST | `/api/v1/environmental-simulation/generate` | simulated row | simulation | writes simulated row |
| POST | `/api/v1/environmental-simulation/generate-batch` | batch simulation | simulation | writes simulated rows |
| POST | `/api/v1/environmental-simulation/generate-all` | all-location simulation | simulation | writes simulated rows |
| `/api/v1/environmental-records/*` | environmental record operations | module router | exact paths depend on router |
| `/api/v1/environmental-ingestion/*` | ingestion | module router | exact paths depend on router |
| `/api/v1/environmental-integration/*` | integration | module router | exact paths depend on router |
| `/api/v1/monitoring/*` | monitoring/assessment | module router | exact paths depend on router |
| `/api/v1/gis/*` | GIS backend module | module router | exact paths depend on router |

## 36. Citizen Reporting

The backend report path is:

```text
Citizen form -> latitude/longitude/report_type/description
  -> POST /api/v1/reports/
  -> FieldReport with POINT geometry and PENDING status
  -> PostgreSQL/PostGIS field_reports
  -> GET /api/v1/reports/
  -> authority/rescue mapping and verification display
```

The frontend has `CitizenPortal`, `FieldReport` types, and local report fallback behavior in `intelligenceService`. The exact current submit handler connection to the backend POST endpoint is **NOT CONFIRMED FROM CURRENT CODEBASE**; do not claim every citizen submission is persisted remotely without testing that UI path.

## 37. Alert Engine

The verified automatic trigger is in `POST /api/v1/risk/predict`:

1. Run ML.
2. Persist `RiskPrediction`.
3. If `prediction == 1`, mark non-blocked roads within 1,000 m `AT_RISK`.
4. Check for an existing pending alert with the same location and severity.
5. If none exists, create a `PENDING` community alert with severity, title, message, and prediction link.

The explicit `POST /api/v1/alerts/auto-generate/{location_id}` route separately creates an alert only for latest `HIGH` or `CRITICAL` risk, also with duplicate prevention by location/prediction. Alerts expose severity, title, message, target type, status, and created time to the frontend. `sent_at`, acknowledgement, and resolution fields exist in the model; delivery integration is not confirmed.

## 38. Authority Dashboard

### Monitoring
Location/state/district filters, backend connectivity, map layers, field reports, rainfall/weather panels.

### Prediction
Risk markers, Risk Now/Next, trend charts, explainability cards, fingerprint, threshold, reliability, deterioration cards. Some secondary analytics are prototype calculations.

### Impact
Risk-based radius, affected assets/settlements, infrastructure exposure, summaries, impact map context.

### Connectivity
Road inventory, road hazard statuses, road-risk context, route comparison.

### Evacuation and shelters
Shelter candidates, capacity, access exposure, ranking and selection.

### Evidence and response
Citizen/field reports, response priorities, alerts, what-if scenarios, authority action controls.

## 39. Citizen Dashboard

The citizen surface presents public risk context, warnings, map/risk information, and reporting controls. The code contains a Citizen role and `CitizenPortal`, but backend persistence, multilingual content completeness, and offline mobile delivery are **PARTIAL / NOT CONFIRMED**. Truthfulness badges and disclaimers are used to avoid presenting prototype estimates as official guarantees.

## 40. Rescue Dashboard

`RescueOperations.tsx` supplies a rescue-oriented view using the shared location, road, shelter, report, route, and risk concepts. The component is implemented as a frontend operational surface. Full external dispatch integration, live responder tracking, authentication, and task management are **NOT CONFIRMED FROM CURRENT CODEBASE**.

## 41. Algorithms Used

| Algorithm | Module | Input | Output | Complexity/status |
|---|---|---|---|---|
| CatBoost probability | ML | seven numeric features | probability | model complexity hidden in artifact; implemented inference |
| Threshold classification | ML | probability, mode | binary prediction/risk level | O(1) |
| PostGIS radius query | history/impact/road | geometries/radius | nearby rows | database spatial index/performance not confirmed |
| Haversine | shelter prototype | lat/lon pair | km distance | O(1) per pair |
| Local projected distance | backend impact | WGS84 points | metres | O(1) per pair |
| Geodesic buffer | impact | center/radius | GeoJSON polygon | O(geometry complexity) |
| Coordinate deduplication | frontend locations | state/district/coordinates | merged stations | O(B x P) current implementation |
| Route edge cost | backend routing | length/penalty/status/mode | weight | O(1) |
| Network shortest path | backend routing | weighted graph | route path | NetworkX implementation; exact path call not fully inspected |
| ORS routing | frontend | coordinates/polygon | route geometry/distance/time | external service |
| Route hazard evaluation | frontend | route points/hazard location | exposure/status/intersections | O(points) |
| Shelter weighted score | frontend | access/hazard/capacity/distance/readiness | ranking | O(shelters log shelters) due sorting |
| Response priority | frontend | risk/population/roads/shelters/reports | priority score | O(locations x related records) |
| Scenario arithmetic | frontend | input deltas | counterfactual result | O(1) plus array filters |
| Alert duplicate lookup | backend | location/prediction/severity | create/no-create | DB query |

## 42. Mathematical Formulas

### Risk score
```text
risk_score = round(landslide_probability * 100, 2)
```
Example: `0.7896 -> 78.96`.

### Decision
```text
prediction = 1 if probability >= decision_threshold else 0
```

### ML risk class
```text
High Risk       if p >= threshold
Moderate Risk   if p >= threshold * 0.60
Low Risk        otherwise
```

### Platform risk level
```text
prediction=1 and p>=0.75 -> CRITICAL
prediction=1 and p<0.75  -> HIGH
prediction=0 and p>=0.15 -> MEDIUM
otherwise                 -> LOW
```

### Backend route cost
```text
cost = length_km + risk_penalty * (3.0 if safety_first else 1.0)
```
A reported-blocked defensive penalty of `1000.0` is added, although blocked roads are normally excluded.

### Impact radius
```text
LOW=100, MODERATE=250, HIGH=500, CRITICAL=1000 metres
```

### Impact severity
```text
ratio = distance_m / radius_m
CRITICAL if ratio <= .25 or priority >= 5
HIGH     if ratio <= .60
MODERATE if ratio <= 1.00
LOW      otherwise
```

### Haversine
The frontend shelter code uses the standard spherical formula with Earth radius 6371 km, latitude/longitude deltas converted to radians, and `2R atan2(sqrt(a), sqrt(1-a))`.

### ORS fallback geometry
The fallback uses degree deltas, approximately `111 km/degree`, a curve offset, and a distance multiplier of `1.2` direct or `1.45` hazard-avoidance. This is explicitly approximate fallback logic.

### Scenario risk
`ScenarioService` combines rainfall effect `(rainfallChangePct / 10) * 1.2`, moisture effect `soilMoistureChangePct * 0.12`, memory adjustment, drainage adjustment, road-failure adjustment, and horizon multiplier, then clamps to `[0,100]`. It is a prototype decision-support formula, not the CatBoost model.

### Shelter score
```text
ranking = access*0.40 + hazard*0.25 + capacity_ratio*100*0.20
        + accessibility*0.10 + readiness*0.05
```

## 43. End-to-End Meghalaya Demo

Verified location example from the current project context:

```text
Location: Steep Forest Slope
District: East Khasi Hills
State: Meghalaya
Coordinates: 25.5788, 91.8933
Backend id: 1
```

Known current backend demonstration values supplied/verified during integration:

```text
risk probability: 0.7896
risk score: 78.96
risk level: CRITICAL
model: catboost-v1
prediction window: 24h
impact: total_assets 2, roads 1, villages 1, critical assets 1
assets: Shillong Hill Road / MAIN_ROAD / CRITICAL / priority 5
        Forest Slope Village / VILLAGE / HIGH / priority 4
road: Shillong Hill Road / AT_RISK
shelter: East Khasi Emergency Shelter / capacity 1200 / AVAILABLE
```

The safe way to present this is: “For the current seeded backend record, the stored result is 0.7896 probability and 78.96 score, classified CRITICAL by the platform. The impact assessment identifies the stored affected assets. The road is at risk, and the shelter record is available. Route geometry is still provided by ORS or the frontend corridor fallback; the route is separately evaluated for hazard.” Exact environmental and terrain numeric values for this location are **NOT CONFIRMED FROM CURRENT CODEBASE/report context** and must not be invented.

## 44. Full Feature Working Flow

```text
1. Vite starts React and /api proxy.
2. App.tsx loads locations, roads, shelters, reports, and bulletins.
3. Backend location/environment/terrain/risk adapters enrich matching stations.
4. Prototype stations remain visible and labelled.
5. Authority selects state/district/location.
6. GIS renders risk markers, buffers, roads, settlements, shelters, and reports.
7. Risk page loads temporal/prototype analytics and backend current risk.
8. Impact page requests latest backend assessment or uses its prototype fallback.
9. Road page uses backend/curated road intelligence and ORS Route A/B.
10. NER evaluates route proximity to hazards; ORS does not declare landslide safety.
11. Shelter page ranks backend or prototype facilities.
12. Alerts/reports/response priorities provide operational context.
```

## 45. Novelty Status

| Idea | Status | Evidence |
|---|---|---|
| Slope Risk Fingerprint | PARTIALLY IMPLEMENTED / prototype analytics | `SlopeRiskFingerprintCard`, `riskService` formulas |
| Self-learning threshold | NOT IMPLEMENTED | adaptive threshold is frontend prototype, not verified self-learning |
| Confidence/false alarm intelligence | PARTIALLY IMPLEMENTED | UI cards/types; backend confidence currently null |
| Counterfactual/What-if Disaster AI | PROTOTYPE / SIMULATED | `scenarioService.ts` |
| Preventive intervention recommendation | PARTIALLY IMPLEMENTED | action text/prototype decision support |
| Personal Risk Guardian | NOT CONFIRMED | no verified dedicated implementation |
| Community Risk Network | PARTIALLY IMPLEMENTED | reports/alerts/settlements concepts, no full network product |
| Multilingual voice alerts | NOT IMPLEMENTED / language UI partial | no verified voice pipeline |
| Predictive connectivity intelligence | FULLY/PARTIALLY IMPLEMENTED | backend road-risk and frontend road intelligence |
| Impact & Vulnerability Intelligence | FULLY IMPLEMENTED backend assessment; mixed UI | `impact_service.py` |
| Explainable Decision Intelligence | PARTIALLY IMPLEMENTED | prototype SHAP-style cards; current backend does not expose SHAP values |

## 46. Why This Is More Than a Simple Predictor

A simple predictor ends at “risk is high.” NER-LENS continues into consequences and decisions: what assets are inside a radius, which roads are at risk, whether Route A passes a hazard envelope, which Route B is less exposed, which shelter has capacity and access, who should receive an alert, and what field evidence is available. The distinction is important: risk prediction is model output; decision intelligence is the surrounding operational software.

## 47. Current Limitations

1. Training source code, dataset, split, hyperparameters, and metrics are absent from the inspected backend checkout.
2. Backend location coverage is limited to the records present in the local database; frontend prototype stations supplement it.
3. Environmental simulator and curated frontend values are not continuous sensor streams.
4. No deployed IoT/satellite ingestion pipeline is verified.
5. Historical row volume and provenance are not documented in the inspected repository.
6. Backend confidence is currently stored/returned as `None` by prediction generation.
7. Frontend forecasts, response priority, and what-if outputs are transparent prototype formulas.
8. ORS depends on an external key/network; fallback geometry is approximate.
9. Backend route recommendation has a same-nearest-node/zero-edge operational edge case; it is not the current frontend primary route provider.
10. Authentication, authorization/RBAC, audit logging, rate limiting, and production secrets management are not verified.
11. Local database configuration requires `DATABASE_URL`; deployment topology is not verified.
12. Citizen backend POST integration through the UI is not fully confirmed.
13. Offline behavior is fallback behavior, not a full offline-first PWA.
14. Open-Meteo is an external dependency and its fallback is a baseline, not current observation.
15. Frontend/backend status vocabularies differ in places and require careful adapters.

## 48. How to Solve Limitations

- Store training code, immutable datasets, feature schema, experiment runs, and validation reports.
- Add continuous IMD/rain-gauge/satellite/soil feeds with source timestamps and quality flags.
- Expand labelled historical failures and geographically hold out validation regions.
- Calibrate probabilities and measure recall, precision, PR-AUC, false alarms, and missed events.
- Compute confidence from a documented method rather than returning null.
- Add backend APIs for forecast, priority, and scenario results if they become operational features.
- Add route-node snapping/zero-length handling and integration tests for same-node cases.
- Use migrations, connection pooling, PostGIS indexes, authentication/RBAC, audit logs, and monitored deployment.
- Make the citizen POST path explicit, validate/triage reports, and add moderation workflows.
- Add queue-based alert delivery with SMS/push/email providers and acknowledgement/resolution state machines.

## 49. Future Production Architecture

**FUTURE PRODUCTION DEPLOYMENT, not current implementation:**

```text
IMD/rain gauges + satellite/SAR + DEM + soil moisture + GSI history
       -> authenticated ingestion/quality service
       -> PostGIS + time-series storage + object store
       -> feature pipeline/versioned model registry
       -> batch/stream inference + calibrated alert policy
       -> FastAPI services behind load balancer/API gateway
       -> React web + mobile/PWA + SMS/push/voice channels
```

Add cloud-managed PostgreSQL read replicas, PostGIS indexes, model retraining orchestration, RBAC, secret manager, audit logs, observability, backups, disaster recovery, and rate limiting. Government road databases and verified shelter registries should be synchronised with source timestamps. These are recommendations, not current claims.

## 50. Five-minute Presentation Script

**0:00-0:30 Problem:** “Landslides in the North Eastern states are not only a slope problem. They can cut roads, isolate settlements, overwhelm shelters, and delay rescue. Reactive reporting tells us what already happened; authorities need a connected view of risk and consequences.”

**0:30-1:00 Solution:** “NER-LENS is an AI-assisted landslide intelligence and emergency-response platform for Authority, Citizen, and Rescue users. It connects environmental and terrain data to prediction, GIS impact analysis, roads, routes, shelters, alerts, and field evidence.”

**1:00-2:00 Data and ML:** “Our FastAPI backend stores location, environmental, terrain, historical, road, shelter, and risk data in PostgreSQL/PostGIS. For a prediction, it takes seven features: 24-hour rainfall, 7-day rainfall, soil moisture, elevation, slope, previous landslides within 5 km, and distance to the nearest previous landslide. A serialized CatBoost classifier returns probability; thresholds support balanced and safety-first operation. The result is stored with model version and a 24-hour window.”

**2:00-3:00 GIS and impact:** “On the Leaflet map, backend AI predictions and prototype stations are shown together but labelled differently. The backend impact service turns risk level into a metre radius, creates a GeoJSON zone, and finds affected roads, villages, and shelters with spatial distance. So the authority sees not just a red point, but the assets that may need attention.”

**3:00-4:00 Roads, route, shelter:** “Road risk uses proximity and risk score to mark a corridor at risk. OpenRouteService provides Route A and a hazard-avoiding Route B with geometry, distance, and duration. Our own code evaluates whether the route passes near a high-risk slope; ORS does not declare a route landslide-safe. Shelter ranking balances access safety, hazard exposure, capacity, distance, travel time, and facility readiness.”

**4:00-4:40 Citizen, rescue, alerts:** “Citizens can contribute location-based hazard reports, authorities can review field evidence and alerts, and rescue teams get a response-oriented view of roads, routes, shelters, and incidents. A positive backend prediction can update nearby roads and create a duplicate-safe pending community alert.”

**4:40-5:00 Conclusion:** “The platform’s novelty is the chain from risk to impact to connectivity to evacuation action. We are transparent about boundaries: some stations, forecasts, and fallbacks are prototype data, while the CatBoost inference and spatial backend paths are real implemented components.”

## 51. Ten-minute Technical Presentation

| Time | Topic | Points |
|---|---|---|
| 0:00-0:45 | Problem | monsoon terrain, reactive gaps, three roles |
| 0:45-1:30 | Architecture | React/Vite -> proxy -> FastAPI -> SQLAlchemy/PostGIS |
| 1:30-2:45 | Data | environmental columns, terrain fields, history, roads/shelters/reports |
| 2:45-4:00 | ML | CatBoost artifact, seven features, imputer, probability, thresholds, risk mapping; missing training evidence disclosed |
| 4:00-5:00 | Database/PostGIS | POINT/LINESTRING, SRID 4326, ST_DWithin, ST_Distance, impact buffer |
| 5:00-6:00 | Impact | radius table, asset priority, severity formula, GeoJSON |
| 6:00-7:00 | Roads/routing | road-risk thresholds, NetworkX backend, ORS frontend, hazard evaluation, fallback |
| 7:00-7:45 | Shelters | weighted ranking and hard safety failures |
| 7:45-8:30 | GIS/frontend | layers, filters, merged AI/prototype stations, truthfulness labels |
| 8:30-9:15 | Citizen/rescue/simulation | reports, alerts, what-if, response priorities |
| 9:15-10:00 | Limitations/novelty | real vs prototype, edge case, future production path |

## 52. Five-minute Live Demo

| Step | What to click | What the judge sees | What to say / technical point |
|---|---|---|---|
| 1 | Authority role, select Meghalaya | operational dashboard | “This is the authority workflow.” |
| 2 | Show map with all layers | multiple prototype stations plus backend station | “Stations are merged, and provenance is explicit.” |
| 3 | Select Steep Forest Slope | AI popup and risk details | “This point uses the project API prediction; probability is not a guarantee.” |
| 4 | Open Risk Intelligence | risk now/next, metadata, charts | “Current risk is backend; forecasts/secondary analytics are labelled appropriately.” |
| 5 | Open Impact Analysis | radius/assets/village/road | “PostGIS impact assessment turns risk into affected assets.” |
| 6 | Open Road Intelligence | Shillong Hill Road at risk | “Road hazard intelligence is separate from route geometry.” |
| 7 | Run route comparison | Route A/Route B geometry and safety | “ORS supplies geometry; NER-LENS evaluates hazard proximity.” |
| 8 | Open Shelters | capacity/status/ranking | “Nearest is not automatically safest.” |
| 9 | Show alerts/reports | latest alerts and field evidence | “Positive risk can drive duplicate-safe alerts; reports need verification.” |
| 10 | Show Citizen then Rescue | simplified public/rescue views | “The same intelligence is adapted by role.” |

## 53. Sixty Jury Questions and Answers

### Problem and product

1. **Why landslides?**  
   **Short:** They combine hazard, exposure, and connectivity risk.  
   **Technical:** NER-LENS links slope risk to spatial assets, road status, routing, shelters, and warnings.

2. **Why North Eastern India?**  
   **Short:** Steep terrain, monsoon rainfall, dispersed settlements, and road dependence.  
   **Technical:** The prototype metadata covers eight NER states and district-level filtering.

3. **How is this different from a map?**  
   **Short:** It turns risk into response decisions.  
   **Technical:** Prediction feeds impact, road-risk, route evaluation, shelter ranking, alerts, and reports.

4. **Who uses it?**  
   **Short:** Authority, citizen, rescue.  
   **Technical:** `App.tsx` role state selects distinct authority/citizen/rescue surfaces.

5. **Is this a warning system or damage detector?**  
   **Short:** Primarily early-warning decision support.  
   **Technical:** Impact says potentially affected, not confirmed damage; reports provide evidence.

### Data and ML

6. **What model?**  
   **Short:** CatBoost classifier.  
   **Technical:** Loaded from `catboost_landslide_model.cbm`, with a saved joblib imputer.

7. **How many model features?**  
   **Short:** Seven.  
   **Technical:** The exact `FEATURES` constant controls validation and DataFrame order.

8. **Name them.**  
   **Short:** 24h rain, 7d rain, soil moisture, elevation, slope, count within 5 km, nearest-event distance.  
   **Technical:** See `MLService.FEATURES` and `risk.py` feature dictionary.

9. **Why not all stored terrain values?**  
   **Short:** Collection and model contracts are different.  
   **Technical:** Curvature/ruggedness/distances are stored but not passed to this model.

10. **What is the target?**  
    **Short:** A binary landslide prediction is consumed by the API.  
    **Technical:** The training label definition is not present in this checkout.

11. **What is accuracy?**  
    **Short:** No verified value in the repository.  
    **Technical:** Tests validate output behavior, not predictive metrics.

12. **How avoid overfitting?**  
    **Short:** The artifact is deployed, but the training controls are not documented here.  
    **Technical:** Do not claim a split or regularization setting without training files.

13. **How handle missing input?**  
    **Short:** A saved imputer preprocesses the seven-feature row.  
    **Technical:** Missing feature keys are rejected; present values are transformed by joblib.

14. **How handle imbalance?**  
    **Short:** Not confirmed from current training code.  
    **Technical:** No class weights/resampling appear in inference.

15. **Why CatBoost?**  
    **Short:** Nonlinear tabular interactions with little scaling overhead.  
    **Technical:** Rainfall, slope, moisture, and historical context can interact through tree splits.

16. **Why not deep learning?**  
    **Short:** Current input is a small tabular row, not imagery or a long sequence.  
    **Technical:** CNN/LSTM would require different data and training pipelines.

17. **What is confidence?**  
    **Short:** Nullable, currently `None` for generated backend predictions.  
    **Technical:** It must not be fabricated or displayed as a percentage when null.

18. **What is safety-first?**  
    **Short:** A lower threshold for earlier warnings.  
    **Technical:** `0.2505749091` versus balanced `0.3256194668`.

19. **Why does 0.7896 become 78.96?**  
    **Short:** Probability is multiplied by 100.  
    **Technical:** `round(risk_probability * 100, 2)`.

20. **Why can `ml_risk_level` differ from `risk_level`?**  
    **Short:** They are two classification layers.  
    **Technical:** ML service uses threshold-relative labels; API adds the CRITICAL >= 0.75 rule.

### GIS and database

21. **Why PostGIS?**  
    **Short:** Landslide response is spatial.  
    **Technical:** Geometry supports radius, nearest-event, road, and impact queries.

22. **What SRID?**  
    **Short:** 4326.  
    **Technical:** Stored POINT/LINESTRING values are converted to geography for metre distances.

23. **How find history?**  
    **Short:** Count and nearest distance within 5 km.  
    **Technical:** `ST_DWithin` and `ST_Distance` in `risk.py`.

24. **How form impact zones?**  
    **Short:** Risk level selects a metre radius.  
    **Technical:** PyProj local azimuthal-equidistant transform, Shapely buffer, GeoJSON output.

25. **What is an impact asset?**  
    **Short:** A road, settlement, or shelter inside the risk radius.  
    **Technical:** It receives distance, priority, impact level, and potential status.

26. **Is impact damage confirmed?**  
    **Short:** No.  
    **Technical:** The stored assessment note explicitly says it is a potential estimate.

27. **How many GIS points?**  
    **Short:** Eight prototype stations plus valid backend stations, deduplicated.  
    **Technical:** Shelter-only backend records are excluded.

28. **How distinguish prototype data?**  
    **Short:** Provenance labels and popup indicators.  
    **Technical:** Prototype stations use `PROTOTYPE DATA`; successful backend ML overlays use `AI PREDICTION`.

29. **What is live?**  
    **Short:** OSM/ORS/Open-Meteo can be live external services; not every displayed value is live.  
    **Technical:** Fallbacks and prototype datasets are explicitly separate.

30. **How do filters work?**  
    **Short:** App filters the merged location list by state/district.  
    **Technical:** Filtering occurs after source merge, so prototype stations are not lost.

### Backend and frontend

31. **Why FastAPI?**  
    **Short:** Typed, lightweight Python API for ML and spatial services.  
    **Technical:** Routers expose modules and SQLAlchemy sessions.

32. **Why an adapter layer?**  
    **Short:** It keeps API shapes separate from UI domain types.  
    **Technical:** `backendAdapters.ts` centralizes endpoint paths and response contracts.

33. **What if backend fails?**  
    **Short:** `ApiError` is caught and prototype data remains visible.  
    **Technical:** Services fall back to local arrays or transparent local formulas.

34. **What if the ML endpoint fails?**  
    **Short:** Do not fake an AI result.  
    **Technical:** Keep the prototype station values and provenance label.

35. **Why use `/api`?**  
    **Short:** Vite proxies same-origin development calls to FastAPI.  
    **Technical:** It simplifies local CORS and keeps the backend origin configurable.

36. **What is stored in RiskPrediction?**  
    **Short:** probability, score, levels, mode, threshold, prediction, confidence, version, window, timestamp.  
    **Technical:** It links back to `locations`.

37. **Does startup create tables?**  
    **Short:** The FastAPI app calls `Base.metadata.create_all`.  
    **Technical:** Migration strategy is not present in the inspected files.

38. **Is authentication implemented?**  
    **Short:** Not confirmed.  
    **Technical:** No verified RBAC/auth middleware appeared in the inspected core path.

39. **Is the API production ready?**  
    **Short:** It is a functional prototype backend.  
    **Technical:** Production hardening, migrations, observability, security, and deployment are incomplete/not confirmed.

40. **How are reports stored?**  
    **Short:** As POINT field reports with pending status.  
    **Technical:** `reports.py` constructs a WKT POINT and inserts `field_reports`.

### Roads and routing

41. **Does ORS know landslide risk?**  
    **Short:** No.  
    **Technical:** ORS supplies route geometry/distance/time; NER-LENS evaluates hazard proximity.

42. **What is Route A?**  
    **Short:** Direct corridor.  
    **Technical:** First ORS/fallback route with direct safety evaluation.

43. **What is Route B?**  
    **Short:** Hazard-avoiding alternative.  
    **Technical:** Requested with `avoid_polygons` when Route A is unsafe.

44. **What if ORS is unavailable?**  
    **Short:** Use mapped corridor waypoint fallback.  
    **Technical:** It is approximate and labelled non-live.

45. **What does backend routing use?**  
    **Short:** A NetworkX road graph with distance and risk costs.  
    **Technical:** At-risk multiplier is 1 in balanced and 3 in safety-first.

46. **Why not use backend safest route?**  
    **Short:** The frontend preserves ORS while backend same-node edge behavior is still limited.  
    **Technical:** Backend route intelligence remains available separately.

47. **What marks a road at risk?**  
    **Short:** Risk proximity and score.  
    **Technical:** Within 1,000 m, score >=25/50/75 yields increasing penalties but `AT_RISK`.

48. **Are blocked roads routable?**  
    **Short:** Backend graph excludes blocked roads.  
    **Technical:** Frontend can still show blocked/caution road intelligence.

### Shelter and operations

49. **How are shelters ranked?**  
    **Short:** Safety, hazard, capacity, accessibility, readiness.  
    **Technical:** 40/25/20/10/5 weights.

50. **Why not nearest shelter?**  
    **Short:** It may be inside the hazard area or lack access/capacity.  
    **Technical:** Hard safety failures can disqualify it.

51. **Are shelter records real?**  
    **Short:** Backend records are project API data; fallback shelters are prototype dataset records.  
    **Technical:** The adapter preserves source type.

52. **How are alerts generated?**  
    **Short:** Positive prediction can update roads and create a pending community alert.  
    **Technical:** Existing pending location/severity alerts prevent duplicates.

53. **Can reports override ML?**  
    **Short:** They provide field evidence and verification context, not an automatic model override.  
    **Technical:** Response priority counts verified reports in its prototype score.

54. **What is response priority?**  
    **Short:** A transparent ranking of attention.  
    **Technical:** risk, vulnerable population, worst road, shelter availability, verified evidence.

55. **What-if risk is this model?**  
    **Short:** No, it is prototype decision support.  
    **Technical:** `ScenarioService` uses explicit additive adjustments and a horizon multiplier.

### Reliability, scale, security, future

56. **Can this predict every landslide?**  
    **Short:** No; it is risk decision support, not a guarantee.  
    **Technical:** Coverage depends on data quality, model validation, and local conditions.

57. **How reduce false alarms?**  
    **Short:** Calibrate thresholds and measure precision/recall by region and season.  
    **Technical:** The current repository does not provide those evaluation results.

58. **How scale to all NER?**  
    **Short:** Add indexed spatial data, ingestion pipelines, queues, and regional model validation.  
    **Technical:** Use PostGIS spatial indexes, API horizontal scaling, and versioned features/models.

59. **What if internet fails?**  
    **Short:** Local prototype/fallback data keeps parts of the UI usable; ORS/live weather fail back.  
    **Technical:** This is not verified full offline synchronization.

60. **What if PostGIS fails?**  
    **Short:** Backend spatial prediction/impact paths fail; frontend local fallback may still display curated data.  
    **Technical:** It cannot honestly produce backend spatial results without the database.

61. **What if a citizen sends false information?**  
    **Short:** It should remain pending until authority verification.  
    **Technical:** The report model has status and the frontend has verification fields; a full moderation workflow is not confirmed.

62. **What if every road is blocked?**  
    **Short:** Backend can return unavailable; the frontend should show no safe evaluated route.  
    **Technical:** The backend route API has explicit unavailable responses.

63. **What if ML conflicts with a field report?**  
    **Short:** Treat both as different evidence streams and escalate for human review.  
    **Technical:** Current response priority can include verified evidence but does not automatically retrain/override ML.

64. **What is the main novelty?**  
    **Short:** Connecting prediction to impact and response.  
    **Technical:** Model, PostGIS impact, road risk, ORS hazard evaluation, shelter ranking, alerts, and reports share a workflow.

65. **What is the biggest limitation?**  
    **Short:** Training provenance and production live-data coverage are incomplete in this checkout.  
    **Technical:** The serialized model is real, but training dataset/metrics and continuous sensors are not documented.

## 54. Most Difficult ML Questions

- **Why CatBoost?** Tabular nonlinear interactions, no scaling requirement in current inference, compact deployment artifact.
- **How many features?** Seven in the final inference contract, although more environmental/terrain fields are stored.
- **Why these features?** They cover short/antecedent rainfall, moisture, terrain, and historical recurrence; exact training selection rationale is not documented.
- **What is the target?** Binary prediction is consumed; training label construction is not present.
- **How avoid overfitting?** Say validation controls are not verifiable from this checkout; do not invent them.
- **How handle imbalance?** Not confirmed; propose class weights/threshold/calibration only as future work.
- **How reduce false alarms?** Measure PR-AUC, precision, recall, calibration, regional holdouts, and human verification.
- **What is threshold?** Balanced `0.3256194668`, safety-first `0.2505749091`.
- **Why safety-first?** Earlier warnings prioritize missed-event cost, with an explicit false-alarm tradeoff.
- **How is confidence calculated?** It currently is not calculated by `predict_risk`; stored as null.
- **Why no deep learning?** Current data contract is seven tabular values, not raster imagery or long sequences.
- **How often retrain?** Not specified; future retraining should be tied to new verified events and drift monitoring.
- **Missing sensor data?** Saved imputer handles available input values; missing feature keys are rejected.
- **Can prediction be trusted?** It is an assistive estimate; trust requires external validation, calibration, field confirmation, and monitoring.

## 55. Most Difficult System Questions

- **Backend failure:** `ApiError` catches and frontend prototype fallbacks remain; no fake API values.
- **ORS failure:** mapped corridor geometry fallback is used and marked non-live.
- **Internet failure:** local UI datasets can display; external live services are unavailable.
- **PostGIS failure:** backend spatial queries fail; local prototype views do not replace the missing real result.
- **False citizen report:** pending status and authority verification are the intended controls; full moderation is partial.
- **Unsafe nearest shelter:** ranking includes hazard/access hard failures.
- **Every road blocked:** backend route returns unavailable; operational decision should escalate.
- **ML/field conflict:** preserve both evidence sources and require authority review.
- **Scalability:** add indexes, queues, replicas, API scaling, and model-serving separation.
- **Security:** production requires auth/RBAC, secrets, audit logs, validation, rate limits, and secure CORS/deployment.

## 56. Source Code Cheat Sheet

| File | Purpose | Important functions/classes | Jury point |
|---|---|---|---|
| `backend/app/main.py` | app/router registration | `app`, `include_router`, health | module composition |
| `backend/app/services/ml_service.py` | model loading/inference | `MLService.predict`, `FEATURES`, `THRESHOLDS` | exact ML contract |
| `backend/app/api/risk.py` | prediction API | `get_risk`, `predict_risk` | feature assembly and side effects |
| `backend/app/services/impact_service.py` | impact algorithm | `ImpactAssessmentService` | spatial buffer/asset priority |
| `backend/app/api/impact.py` | impact endpoints | assess/latest/geojson/assets | persistence/read APIs |
| `backend/app/services/route_recommendation_service.py` | graph routing | edge cost/network construction | distance + hazard cost |
| `backend/app/api/route_recommendation.py` | backend routes | find/safest/network/status | separate backend routing |
| `backend/app/api/road_risk.py` | road assessment | assess/list/latest | 1 km and score rules |
| `backend/app/models/*.py` | ORM/schema | Location, EnvironmentalData, TerrainFeatures, RiskPrediction, etc. | relational/spatial model |
| `frontend/src/App.tsx` | application state | `loadData`, selection/filter state | UI orchestration |
| `frontend/src/services/apiClient.ts` | HTTP client | `request`, `ApiError` | timeout/error contract |
| `frontend/src/services/backendAdapters.ts` | API adapter | `getBackend*` functions | endpoint isolation |
| `frontend/src/services/intelligenceService.ts` | source merge/mapping | `getLocations`, `getRoads`, `getShelters` | fallback and provenance |
| `frontend/src/services/riskService.ts` | risk UI logic | `getRiskNowNext` | backend current + prototype forecast |
| `frontend/src/services/impactService.ts` | impact UI fallback | `getImpactAnalysis` | backend/prototype impact |
| `frontend/src/services/routingService.ts` | ORS and safety | `getRoute`, `evaluateRouteSafety`, `getAlternativeRoutes` | ORS != safety verdict |
| `frontend/src/services/shelterService.ts` | shelter ranking | `getShelterRecommendations` | weighted decision support |
| `frontend/src/components/gis/NERLeafletMap.tsx` | map rendering | layer groups, marker popup | spatial presentation |
| `frontend/src/data/nerGeography.ts` | prototype dataset | `INITIAL_MONITORED_LOCATIONS` etc. | explicit fallback data |

## 57. Module-wise Cheat Sheet

| Module | Input | Processing | Output | Backend/API | Frontend |
|---|---|---|---|---|---|
| 1 ML Prediction | env/terrain/history | CatBoost + thresholds | risk | `/risk` | risk page/cards |
| 2 Environment | observations/simulation | normalize/validate/store | records | `/environment*` | weather/rainfall |
| 3 GIS | geometries | PostGIS/map layers | spatial context | `/gis`, locations | Leaflet |
| 4 Impact | risk/location/assets | buffer/distance/priority | zone/assets | `/impact` | impact page |
| 5 Road intelligence | road/risk/location | distance/status/penalty | road assessment | `/road-risk` | road page |
| 6 Routing | road graph or ORS coords | weighted path or ORS | route options | backend route APIs / ORS | `routingService` |
| 7 Shelters | facilities/context | weighted ranking | recommendation | shelters API | shelter page |
| Reports | citizen coordinates/text | store POINT/status | field evidence | `/reports` | citizen/authority/rescue |
| Alerts | prediction/severity | duplicate-safe generation | pending alert | `/alerts` | authority dashboard |
| Response priority | locations/roads/shelters/reports | transparent score | ranked actions | frontend service | response page |
| What-if | scenario inputs | arithmetic counterfactual | deltas/actions | frontend service | what-if page |

## 58. Real vs Prototype Sentences for the Jury

1. “The base map uses OpenStreetMap tiles.”
2. “The deployed risk inference uses a serialized CatBoost model.”
3. “The model contract currently uses seven features.”
4. “The backend stores environmental and terrain records in PostgreSQL/PostGIS.”
5. “Historical context is computed with a 5 km PostGIS query.”
6. “The impact zone is a potential exposure estimate, not confirmed damage.”
7. “OpenRouteService provides route geometry, distance, and duration.”
8. “Our code, not ORS, evaluates landslide hazard exposure on that route.”
9. “Some environmental rows can be generated by an explicitly marked simulator.”
10. “Prototype slope stations are retained for demonstration and labelled as prototype data.”
11. “A successful backend risk overlay is labelled AI PREDICTION.”
12. “The backend confidence field is nullable and currently may be unavailable.”
13. “Shelter ranking is transparent decision support, not a guaranteed evacuation order.”
14. “A positive prediction can mark nearby roads at risk and create a pending alert.”
15. “The current checkout does not include the original training script or evaluation report.”
16. “Fallback geometry and fallback datasets keep the demonstration usable when dependencies fail.”
17. “Citizen reports are evidence inputs and require verification.”
18. “The current system is a hackathon prototype with a production-oriented architecture.”

## 59. Things I Must Not Say

- Do not claim continuous satellite monitoring unless a verified ingestion path is deployed.
- Do not call prototype stations live sensor stations.
- Do not call simulated environmental values live telemetry.
- Do not say all stored terrain parameters enter CatBoost; only seven verified features do.
- Do not claim an accuracy, recall, or AUC value absent from the repository.
- Do not say confidence is computed if the current prediction path stores null.
- Do not say ORS guarantees a safe route.
- Do not say the backend safest-route endpoint is the current frontend primary provider.
- Do not claim physical sensors are deployed.
- Do not claim every citizen form submission is remotely persisted without testing its handler.
- Do not call potential impact confirmed damage.
- Do not call frontend what-if values ML predictions.
- Do not claim full offline operation, authentication, or production alert delivery without evidence.
- Do not hide the backend same-node route edge case.
- Do not say the training dataset is available in this checkout.

## 60. One-night Revision Sheet

- **Problem:** landslides create hazard plus exposure and connectivity failures.
- **Solution:** NER-LENS connects risk to impact, road, route, shelter, alert, and response.
- **Frontend:** React/TypeScript/Vite/Tailwind, Leaflet, Recharts, Lucide.
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL/PostGIS.
- **ML:** CatBoost artifact, saved imputer, seven features.
- **Features:** rain 24h, rain 7d, soil moisture, elevation, slope, previous events within 5 km, nearest event distance.
- **Thresholds:** balanced 0.3256194668; safety-first 0.2505749091.
- **Risk:** probability -> score x100 -> prediction -> platform level.
- **Impact:** risk radius 100/250/500/1000 m; PostGIS/Shapely/PyProj; priority assets.
- **Road:** risk within 1 km; penalties 10/25/40; blocked excluded from graph.
- **Routing:** ORS geometry and fallback; NER evaluates hazard.
- **Shelter:** safety 40%, hazard 25%, capacity 20%, access 10%, readiness 5%.
- **GIS:** merged eight prototype stations plus valid backend stations; shelter records excluded.
- **Reports/alerts:** POINT evidence, pending alerts, duplicate prevention.
- **Real:** backend ML/API, PostGIS, OSM/ORS/Open-Meteo when available.
- **Prototype:** stations, forecasts, what-if, response priority, fallback values.
- **Novelty:** operational chain, not only a risk label.
- **Limitation:** training artifacts/metrics and continuous live coverage are incomplete.

## 61. Thirty-second Final Pitch

“NER-LENS is an AI-assisted landslide intelligence platform for North Eastern India. It combines a deployed CatBoost risk model with PostgreSQL/PostGIS environmental, terrain, historical, and infrastructure data, then turns a risk probability into a map, impact zone, road warning, route evaluation, shelter ranking, alert, and response workflow. It is honest about provenance: real backend AI predictions are separated from prototype stations and fallbacks. That makes the system useful for a hackathon demonstration today and gives it a defensible path toward production early warning.”

## 62. One-minute Technical Summary

“React and Vite provide the role-based interface, Leaflet renders the spatial layers, and a typed service layer calls FastAPI through the Vite `/api` proxy. FastAPI uses SQLAlchemy, GeoAlchemy2, and PostGIS. On prediction, the backend takes the latest 24-hour/7-day rainfall, soil moisture, elevation, slope, 5 km historical count, and nearest historical-event distance; a saved imputer prepares the row and CatBoost returns probability. Thresholds support balanced and safety-first operation. The result is stored, nearby roads can become at risk, and a duplicate-safe alert can be created. Impact uses metre-based spatial buffers and priority rules. ORS supplies route geometry while NER-LENS evaluates hazard proximity. Shelter ranking combines safety, hazard, capacity, accessibility, and readiness. Prototype data remains visible but is explicitly labelled.”

## 63. Complete Data Flow Diagram

```text
[EnvironmentalData] [TerrainFeatures] [HistoricalLandslides]
          |                 |                    |
          +-----------------+--------------------+
                            v
                 app/api/risk.py
              feature construction
                            v
              app/services/ml_service.py
       imputer -> CatBoost -> p(probability)
                            v
       threshold -> prediction -> risk_level
                            v
                 RiskPrediction row
                 /              \
                v                v
       nearby roads         duplicate-safe alert
                |
                v
        road risk assessment
                |
                +------> impact_service.py
                |          radius/GeoJSON/assets
                v
     FastAPI -> /api proxy -> backendAdapters
                |
                v
 React App.tsx -> pages -> Leaflet/Recharts
                |
         authority/citizen/rescue
```

## 64. Complete Emergency Decision Flow

```text
DATA -> PREDICT -> UNDERSTAND -> ASSESS IMPACT -> CHECK CONNECTIVITY
     -> ROUTE -> SHELTER -> WARN -> RESPOND
```

- **Data:** latest environmental/terrain/history and field evidence.
- **Predict:** CatBoost probability and threshold decision.
- **Understand:** risk score/level, trends, explainability context.
- **Assess impact:** buffer and affected assets.
- **Check connectivity:** road status, risk, blocked corridors.
- **Route:** ORS geometry or fallback, then hazard evaluation.
- **Shelter:** rank facilities by safety, capacity, and readiness.
- **Warn:** pending alerts for high/critical outcomes.
- **Respond:** authority/rescue workflows and verified field reports.

## 65. Final Project Status

| Component | Status | Evidence | Remaining limitation |
|---|---|---|---|
| FastAPI app/router | WORKING | `app/main.py` | deployment hardening not confirmed |
| CatBoost inference | WORKING | `.cbm`, `MLService`, tests | training provenance/metrics absent |
| Risk persistence | WORKING | `risk.py`, `RiskPrediction` | confidence null |
| Historical spatial features | WORKING | PostGIS SQL in `risk.py` | row provenance/scale unknown |
| Environmental storage | WORKING | model/API/simulation modules | external live source not confirmed |
| Terrain storage | WORKING | model/API | generation source not confirmed |
| Impact assessment | WORKING | `ImpactAssessmentService` | potential, not damage confirmation |
| Road risk | WORKING | `road_risk.py` | latest global risk selection should be reviewed for production |
| Backend routing | PARTIAL | NetworkX service/API | same-node/zero-edge edge case |
| ORS frontend routing | WORKING/FALLBACK | `routingService.ts` | external key/network dependency |
| Shelter ranking | MIXED | backend records + frontend weighted service | project-side ranking |
| Alerts | WORKING | auto-generate and risk side effect | delivery channel not confirmed |
| Field reports | PARTIAL | backend API/model + frontend surfaces | UI POST path not fully confirmed |
| GIS map | WORKING | Leaflet layer groups | live data coverage limited |
| Backend/prototype station merge | WORKING | `intelligenceService.getLocations` | backend coverage remains limited |
| Authority dashboard | WORKING UI | authority components/App | some analytics prototype |
| Citizen dashboard | PARTIAL | `CitizenPortal.tsx` | persistence/language/offline completeness |
| Rescue dashboard | PARTIAL | `RescueOperations.tsx` | dispatch integration not confirmed |
| What-if | PROTOTYPE | `scenarioService.ts` | not backend ML |
| Response priority | PROTOTYPE | `responsePriorityService.ts` | replace with validated operational API |
| Truthfulness labels | WORKING | badge/provenance/popup patterns | maintain consistency across all new features |
| Production security | NOT IMPLEMENTED / NOT CONFIRMED | no verified auth/RBAC path | required before deployment |
| Training pipeline | NOT CONFIRMED | serialized artifacts only | preserve scripts/data/metrics |

## Source References by Major Section

- **Architecture/API:** `vortexa-backend/app/main.py`, `app/api/*`, `app/db/database.py`.
- **ML:** `vortexa-backend/app/services/ml_service.py`, `app/api/risk.py`, `ml/models/catboost_landslide_model.cbm`, `ml/models/landslide_imputer.joblib`, `tests/test_ml_service.py`.
- **Database:** `vortexa-backend/app/models/*.py`, `app/db/database.py`.
- **Impact:** `app/services/impact_service.py`, `app/api/impact.py`.
- **Road/routing:** `app/api/road_risk.py`, `app/services/route_recommendation_service.py`, `app/api/route_recommendation.py`, frontend `src/services/routingService.ts`.
- **Frontend integration:** `src/services/apiClient.ts`, `backendAdapters.ts`, `intelligenceService.ts`, `riskService.ts`, `impactService.ts`, `roadService.ts`, `shelterService.ts`.
- **GIS:** `src/components/gis/NERLeafletMap.tsx`, `src/data/nerGeography.ts`, `src/services/gisService.ts`.
- **Simulation/response:** `src/services/scenarioService.ts`, `responsePriorityService.ts`, backend environmental simulation APIs.
- **Roles/UI:** `src/App.tsx`, `src/components/authority/*`, `src/components/citizen/CitizenPortal.tsx`, `src/components/rescue/RescueOperations.tsx`.

---

## Final Accuracy Statement

This report documents what is present in the inspected repositories. The deployed inference path, API contracts, spatial algorithms, frontend integration, ORS routing, fallback behavior, and current prototype boundaries are documented as implemented where code supports them. Training-data statistics, model evaluation scores, full authentication, production deployment, continuous sensor coverage, and any feature without a direct implementation trace are intentionally marked **NOT CONFIRMED FROM CURRENT CODEBASE** rather than invented.
