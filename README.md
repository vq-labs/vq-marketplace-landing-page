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

# Environments

We have tested the application in these environments but a .nvmrc and package.json engines have been setup for you to take a hint on:
(If you use NVM, you can do nvm use which will take .nvmrc file into account)
(If you want to install Node and NPM manually you can check the engines in package.json)

NodeJS 7.2.1 and NPM 3.10.9 on macOS Sierra 10.12.6,
NodeJS 8.3.0 and NPM 5.6 on Windows 10,
NodeJS 9.0.0 and NPM 5.5.1 on AWS Linux Ubuntu 16.04.2

# License?
Apache 2.0