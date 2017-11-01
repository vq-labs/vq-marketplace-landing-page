const CONFIG = {};

CONFIG.APP_NAME = "vq-www";
CONFIG.APP_VERSION = "1.0.0";
CONFIG.LANGUAGE_DEFAULT = "en";
CONFIG.VQ_API_URL = process.env.VQ_API_URL || "http://localhost:8080/api";
CONFIG.VQ_TENANT_API_URL = process.env.VQ_TENANT_API_URL || "http://localhost:8081/api";
CONFIG.VQ_APP_URL = process.env.VQ_APP_URL || "http://localhost:3000";
CONFIG.PORT = process.env.PORT || 4000;

console.log(CONFIG);

module.exports = CONFIG;




    
    

