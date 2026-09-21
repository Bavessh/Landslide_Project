# VORTEXA Citizen Mobile — fixed build

This branch contains a drop-in Expo Go mobile source aligned with the government-style web Citizen Portal.

## Fixed
- Citizen-only role.
- Correct backend base URL fallback: http://192.168.1.11:8000
- Health: /api/v1/health
- Reports list: /api/v1/reports/
- Alerts list: /api/v1/alerts/
- Report creation now matches the integrated FastAPI backend, which expects latitude, longitude, report_type and description as query parameters.
- FastAPI validation errors are rendered as readable text instead of [object Object].
- Existing retry items can now succeed and be removed from the local queue.
- Image selection remains available in the UI, but image upload is skipped because the integrated backend has no /reports/{id}/media endpoint. A successful report is no longer marked failed because of missing media support.
- Light government UI aligned to the web portal (#F6F7F9, #FFFFFF, #1D4E89, #DDE2E7 and official risk colors).

## Run
1. npm install
2. Set EXPO_PUBLIC_API_BASE_URL in .env if the laptop IP changes.
3. npx expo start --go -c

Example .env:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.11:8000
EXPO_PUBLIC_DEV_USER_ID=1
EXPO_PUBLIC_DEV_USER_ROLE=citizen
