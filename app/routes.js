const fs = require('fs');
const async = require("async");
const CONFIG = require("./config.js");
const i18n = require("./services/i18n.js");
const path = require('path');
const ejs = require('ejs');

const vqSDK = require("./vq-sdk/index.js")(CONFIG.VQ_API_URL, CONFIG.VQ_TENANT_API_URL);

const LAYOUT_MATERIAL = "layouts/material-layout.ejs";

const tenantData = {};

const categoryProvider = (tenantId, forceRequest, cb) => {
	cb = cb || function() {};

	tenantData[tenantId] = tenantData[tenantId] || {};

	if (!tenantData[tenantId].categories || forceRequest) {
		vqSDK.getCategories(tenantId, (err, rCategories) => {
			if (err) {
				return cb(err);
			}

			tenantData[tenantId].categories = rCategories;

			return cb(null, tenantData[tenantId].categories);
		});
	} else {
		return cb(null, tenantData[tenantId].categories);
	}
};

const appConfigProvider = (tenantId, forceRequest, cb) => {
	cb = cb || function() {};

	tenantData[tenantId] = tenantData[tenantId] || {};

	if (!tenantData[tenantId].appConfig || forceRequest) {
		return vqSDK.getAppConfig(tenantId, (err, rAppConfig) => {
			if (err) {
				return cb(err);
			}

			tenantData[tenantId].appConfig = tenantData[tenantId].appConfig || {};
			
			rAppConfig.map(label => {
				tenantData[tenantId].appConfig[label.fieldKey] = label.fieldValue;
			});

			const defaultLang = (tenantData[tenantId].appConfig["DEFAULT_LANG"] || 'en');

			appLabelProvider(tenantId, forceRequest, defaultLang, () => {});

			const languagesString = tenantData[tenantId].appConfig["LANGUAGES"];

			if (languagesString) {
				const langArr = (tenantData[tenantId].appConfig["LANGUAGES"] || '').split(",");
				
				langArr.forEach(LANG => appLabelProvider(tenantId,  forceRequest, LANG, () => {}));
			}
			
			return cb(null, tenantData[tenantId].appConfig);
		});
	}

	return cb(null, tenantData[tenantId].appConfig);
};

const postProvider = (tenantId, forceRequest, cb) => {
	cb = cb || function() {};

	tenantData[tenantId] = tenantData[tenantId] || {};

	if (!tenantData[tenantId].posts || forceRequest) {
		return vqSDK.getPosts(tenantId, (err, rPosts) => {
			if (err) {
				return cb(err);
			}

			tenantData[tenantId].posts = tenantData[tenantId].rPosts || {};
			
			rPosts
			.map(post => {
				tenantData[tenantId].posts[post.code] = post.body;
			});
			
			return cb(null, tenantData[tenantId].posts);
		});
	}

	return cb(null, tenantData[tenantId].posts);
};

const taskProvider = (tenantId, originalUrl, forceRequest, cb) => {
  cb = cb || function() {};
  if (originalUrl.includes('/app/task/')) {
		  const taskId = originalUrl.replace('/app/task/', '');

		  let taskRef = {};

      if (forceRequest) {
        return vqSDK.getTask(tenantId, taskId, (err, rTask) => {
          if (err) {
            return cb(err);
          }

          taskRef = rTask;

          return cb(null, taskRef);
        });
      }

      return cb(null, taskRef);
  }
	return cb(null);
};

const appLabelProvider = (tenantId, forceRequest, lang, cb) => {
	cb = cb || function() {};

	tenantData[tenantId] = tenantData[tenantId] || {};
	tenantData[tenantId].appLabels = tenantData[tenantId].appLabels || {};
	if (!tenantData[tenantId].appLabels[lang] || forceRequest) {
		return vqSDK.getAppLabels(tenantId, lang, (err, rLabels) => {
			if (err) {
				return cb(err);
			}

			tenantData[tenantId].appLabels[lang] = rLabels;

			i18n.initDictionary(tenantId, lang);

			rLabels.map(label => {
				i18n.setLabel(tenantId, lang, label.labelKey, label.labelValue);
			});

			return cb();
		});
	}

	return cb();
};

// refresh categories and app meta every 30 seconds
const getConfigs = () => {
	vqSDK
	.getTenants((err, tenants) => {
		if (err) {
			return console.error(err);
		}

		async
		.eachSeries(tenants, (tenant, cb) => {
			tenantData[tenant.tenantId] = tenantData[tenant.tenantId] || {};
			tenantData[tenant.tenantId].stripePublicKey = tenant.stripePublicKey;

			const tenantId = tenant.tenantId;

			categoryProvider(tenantId, true);
			appConfigProvider(tenantId, true);
			postProvider(tenantId, true);

			cb();
		}, err => {
			if (err) {
				console.error(err);
			}
		});
	});
};
	
getConfigs();

/**
 * @todo think about better way to do that as polling does not scale...
 */
setInterval(() => {
	getConfigs();
}, 60 * 1000);

const ResponseService = {};

ResponseService.error404 = function(res){
	return res.status(404).render("st.error.404.index.ejs", {
		layout: LAYOUT_MATERIAL,
		lang: 'en'
	});
};

ResponseService.error500 = function(res){
	return res.status(404).render("st.error.500.index.ejs", {
		layout: LAYOUT_MATERIAL,
		lang: 'en'
	});
};

// this should be part of the external config
const allowedDomains = {
	"rent.kitchen": "rental-kitchen",
	"clickforwork.hu": "click4work",
	"talentwand.de": "talentwand",
	"bitcoinswap.com": "bitcoinswap"
};

const render = (req, res, template, data) => {
	let tenantId = process.env.TENANT_ID || req.subdomains[req.subdomains.length - 1];

	if (!tenantId) {
		tenantId = allowedDomains[req.hostname];
	}

	if (!tenantId) {
		return res.status(404)
			.send('Marketplace does not exist.');
	}

	async.parallel([
		cb => categoryProvider(tenantId, false, cb),
		cb => appConfigProvider(tenantId, false, cb),
		cb => postProvider(tenantId, false, cb),
		cb => taskProvider(tenantId, req.originalUrl, true, cb),
	], (err, configs) => {
		if (err) {
			if (!configs[0] || !configs[1]) {
				return res.status(500).send(err);
			}
		}
		
		data = data || {};
		data.TENANT_ID = tenantId;
		data.VQ_API_URL = CONFIG.VQ_API_URL.replace('?tenantId?', tenantId);
		data.TENANT_STRIPE_PUBLIC_KEY = tenantData[tenantId].stripePublicKey;

		if (CONFIG.PRODUCTION) {
			data.VQ_WEB_APP_CSS_URL =
				'https://s3.eu-central-1.amazonaws.com/vq-marketplace/static/css/main.css';
			data.VQ_WEB_APP_JS_URL =
				'https://s3.eu-central-1.amazonaws.com/vq-marketplace/static/js/main.js';
		} else {
			data.VQ_WEB_APP_CSS_URL = 'https://s3.eu-central-1.amazonaws.com/vq-marketplace-dev/static/css/main.css';
			data.VQ_WEB_APP_JS_URL =
			'https://s3.eu-central-1.amazonaws.com/vq-marketplace-dev/static/js/main.js';
		}
		
		data.categories = configs[0];
		data.getConfig = fieldKey => configs[1][fieldKey];
		data.getPost = (code, hideError) => {
		  let postBody = configs[2][code];

		  if (!postBody && (hideError !== undefined && hideError === false)) {
		    postBody = fs.readFileSync(__dirname + "/../views/st.error.404.index.ejs", "utf8");
	      }
	      return postBody;
	    };

		const getLang = () => {
		  const defaultLang = data.getConfig('DEFAULT_LANG') || CONFIG.DEFAULT_LANGUAGE;
		  if (req.params.lang) {
		    return configs[1].LANGUAGES.indexOf(req.params.lang) !== -1 ? req.params.lang : defaultLang;
      } else if (req.query.lang) {
		    return configs[1].LANGUAGES.indexOf(req.query.lang) !== -1 ? req.query.lang : defaultLang;
      } else {
		    return defaultLang;
      }
    };
		data.translate = i18n.getFactory(
			tenantId,
			getLang()
		);
		data.originalUrl = req.originalUrl;

		data.layout = data.layout || "layouts/material-layout.ejs";
		data.lang = getLang();

		return res.render(template, data);
		/**
		if (typeof template === 'string') {
			return res.render(template, data);
		}

		const tmpl = fs.readFileSync(__dirname + "/../views/layouts/material-layout.ejs", "utf8");

		data.body = ejs.render(data.getPost(`${template.slug}`), data);

		// const renderedPost = ejs.render(tmpl, data, {});
		
		return res.send(data.body);
		*/
	}
)};

module.exports = app => {
	app.get('/app', (req, res) =>
		render(req, res, 'app/index.ejs', {
			layout: 'layouts/empty-bin.ejs'
		}));

	app.get('/app/**', (req, res) =>
		render(req, res, 'app/index.ejs', {
			layout: 'layouts/empty-bin.ejs'
		}));

	/**
	 * Landing page for Buyers / Clients (userType: 1)
	 */
	app.get("/:lang([a-zA-Z]{2})?", (req, res) => render(req, res, "index-client.ejs"));

	/**
	 * Landing page for Sellers / Taskers (userType: 2)
	 */
	app.get("/:lang([a-zA-Z]{2})?/:supplySideSlug", (req, res) => render(req, res, "index-provider.ejs"));

	app.get("/:lang([a-zA-Z]{2})?/:postCode", (req, res) => render(req, res, "index-post.ejs", { postCode: req.params.postCode.toLowerCase() }));

	app.get("/health", (req, res) => {
		res.send('Health OK');
	});


	/*/!*
	* You can create pages under views/pages
	* Subfolders will be mapped to main slugs and subslags to the file names as st.<subslug>.index.ejs
	*!/

	app.get("/:slug/:subSlug?", (req, res, next) => {
		const slug = req.params.slug.toLowerCase();
		const subSlug = req.params.subSlug ? req.params.subSlug.toLowerCase() : false;


		return render(req, res, { slug, subSlug}, {});

		return next();
	});	*/

	app.use((req, res) => {
		res.status(404);

		return render(req, res, "st.error.404.index.ejs");
	});
};