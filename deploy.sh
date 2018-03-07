#!/bin/sh
git pull
npm install
npm run build
pm2 restart ../ecosystem.config.js --only 'Landing Page'