# What is it?
Source files for the VQ-Marketplace Landing Page.

# How to start?
Review .env.example file and make necessary changes first then rename it to .env file. You should not commit this file because it might contain sensitive information, therefore we have an ignore rule in .gitignore so if you want to commit that, remove that from .gitignore

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
node ./node_modules/gulp/bin/gulp.js build --VQ_API_URL=https://taskrabbit.vqmarketplace.com/api node server.js
```

# License?
Apache 2.0