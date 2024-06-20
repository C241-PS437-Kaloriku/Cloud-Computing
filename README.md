# How To Run Backend Server
1. Clone repository
2. Install Node Package Manager and Dependencies ["npm install"]
3. Create service account with firestore and cloud storage permission
4. Put service-account.json into server folder
5. Run the backend server ["npm run start"]

## If you want to deploy it to Cloud Run
### 1. Install GCLOUD SDK
https://cloud.google.com/sdk/docs/install 
### 2. Deploy
```
gcloud run deploy --source . --port 8080
```

## Don't forget to input the service account into the server directory with the rules
1. Firebase Rules System
2. Firestore Service Agent
3. Storage Admin
