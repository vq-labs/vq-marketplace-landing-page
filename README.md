# What is it?
Source files for the VQ-Marketplace Landing Page.

# How to start?
Review .env file and make necessary changes first!

```
npm install

npm start
```

# Development
If your environment in .env file is not 'production', then npm start command will automatically watch changes for you.

# Deployment
Make sure that you have s3-deploy installed globally:
```
npm install s3-deploy --g
```

The following command will prepare, build and deploy the app to S3 bucket:
```
gulp deploy
```

## Connect to existing API:
```
TENANT_ID=talentwand VQ_API_URL=https://talentwand.vqmarketplace.com/api VQ_TENANT_API_URL=https://vqmarketplace.vqmarketplace.com/api npm run start
```

# License?
Apache 2.0