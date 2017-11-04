const request = require("request");
const async = require("async");

const API_PATHS = {
   CATEGORIES: "/app_task_categories",
   APP_LABEL: "/app_label",
   APP_CONFIG: "/app_config"
};

module.exports = (VQ_API_URL, VQ_TENANT_API_URL) => {
    VQ_TENANT_API_URL = VQ_TENANT_API_URL || "http://localhost:8081/api";
    VQ_API_URL = VQ_API_URL || "http://localhost:8080/api";

    return {
      getTenants,
      getCategories,
      getAppLabels,
      getAppConfig
    };

    function getTenants (callback) {
        var url = VQ_TENANT_API_URL + '/tenan?status=3';

        makeRequest(url, (err, data) => callback(err, data || []));
    }

    function getAppConfig (tenantId, callback) {
        var url = VQ_API_URL + API_PATHS.APP_CONFIG;

        url = url.replace('?tenantId?', tenantId);

        makeRequest(url, (err, data) => callback(err, data || []));
    }

    function getAppLabels (tenantId, lang, callback) {
        var url = VQ_API_URL + API_PATHS.APP_LABEL + '?lang=' + lang;

        url = url.replace('?tenantId?', tenantId);

        makeRequest(url, (err, data) => callback(err, data || []));
    }

    function getAppMeta (tenantId, callback) {
        var url = VQ_API_URL + API_PATHS.APP_META;

        url = url.replace('?tenantId?', tenantId);

        makeRequest(url, (err, data) => callback(err, data ? data[0]: {}));
    }

    function getCategories (tenantId, callback) {
        var url = VQ_API_URL + API_PATHS.CATEGORIES;

        url = url.replace('?tenantId?', tenantId);

        makeRequest(url, callback);
    }

    /**
        Makes requests to ST API
    */
    function makeRequest(url, callback){
        console.log("[VQ-SDK] Request to " + url);

        request(url, (err, response, body) => {
            if (err) {
                return callback(errDTO(err));
            }

            const resObj = parseJSON(body);

            if (response.statusCode !== 200) {
                if (resObj.code === "TENANT_NOT_FOUND") {
                    return callback({ status:404 });
                }

                return callback(errDTO("Status code:" + response.statusCode, response.statusCode));
            }

            return callback(null, resObj);
       });

       function parseJSON (json) {
            try {
                json = JSON.parse(json);
            } catch (err) {
                console.error("vqSDK: Error parsing json",err);
                json = {};
            }

            return json;
        }

       function errDTO(err, statusCode) {
          return {
            err: true,
            status: statusCode ? statusCode : 502,
            data: err
          };
       }

    }
     
};

