# What is it?
Source files for the VQ-Marketplace Landing Page. It currently runs on Express to simulate kind of server side rendering for better SEO optimization and has some AngularJS code for managing Header menu etc.

We have plans to rewrite Landing Page with NextJS to benefit from React and Material-UI React components to be as close to our Web App both functionally and visually.

The Landing Page serves as the entry point for multi-tenancy as we determine the TENANT_ID and then setup the Web App accordingly. When used with multi-tenancy it includes the built js and css files of Web App in the Head section as script and link tags so that Web App can function seamlessly.

# How to start?
Review .env.example file and make necessary changes first then rename it to .env file. You should not commit this file because it might contain sensitive information, therefore we have an ignore rule in .gitignore so if you want to commit that, remove that from .gitignore

```
ENV=production  //if you run it with an env other than production,
                //npm start will also watch for file changes and restart.
PORT=4000
API_URL=http://localhost:8080/api   //this is the API url that you connect to.
                                    //If you run vq-marketplace-platform API, you can leave it as it is
TENANT_API_URL=http://localhost:8081/api    //this is the URL that manages multi-tenancy.
                                            //If you specify TENANT_ID it means you are only running one tenant 
                                            //therefore you can leave this as it is
TENANT_ID=test  //this is the TENANT_ID, in other terms the name of the marketplace that you want to setup.
                //can be anything. only accepts slug-style.
                //By default, all the TENANT_ID in all parts of the app (API, WEB-APP) are test.
                //If you change it please make sure that all your env files on every repository
                // related to this project has the same TENANT_ID
```

Then to run:
```
npm install

npm start
```

# Development
If your environment in .env file is not 'production', then npm start command will automatically watch changes for you.

## Connect to existing API:
```
node ./node_modules/gulp/bin/gulp.js build --API_URL=https://taskrabbit.vqmarketplace.com/api && node server.js
```

## Environments

We have tested the application in these environments but a .nvmrc and package.json engines have been setup for you to take a hint on:
(If you use NVM, you can do nvm use which will take .nvmrc file into account)
(If you want to install Node and NPM manually you can check the engines in package.json)

NodeJS 7.2.1 and NPM 3.10.9 on macOS Sierra 10.12.6,
NodeJS 8.3.0 and NPM 5.6 on Windows 10,
NodeJS 9.0.0 and NPM 5.5.1 on AWS Linux Ubuntu 16.04.2

# Deployment
We pull the latest git branch in our server then build the project with npm run build command. If you are using only one tenant you can set ENV to production and do npm start which runs the server without watching file changes. You can easily have server.js running with ForeverJS or PM2.

In the root folder of the project you can find a deploy script named deploy.sh which pulls from git, does npm install then restarts itself through PM2.

We also have an experimental deploy server that runs deploy.sh in each repository whenever you push to a designated branch of a repository. The vq-deploy-server manages the running processes through PM2 and if desired it can be easily coupled with Slack to report the status of deployments as well as a /servers command which you can use in Slack to get the status of the servers via PM2.

WIP - [https://github.com/vq-labs/vq-deploy-server.git](https://github.com/vq-labs/vq-deploy-server.git)

# Contribute
We follow the following branching model:
[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

# License
MIT

# Contributors
[VQ LABS](https://vq-labs.com)