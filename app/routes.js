const async = require("async");
const i18n = require("./services/i18n.js");
const ejs = require('ejs');


const vqSDK = require("./vq-sdk/index.js");
const routeProvider = vqSDK.routeProvider();

const LAYOUT_MATERIAL = "layouts/material-layout.ejs";

const tenantData = {};

const categoryProvider = (tenantId, forceRequest, cb) => {
	cb = cb || function() {};

	tenantData[tenantId] = tenantData[tenantId] || {};

	if (!tenantData[tenantId].categories || forceRequest) {
		routeProvider.getCategories(tenantId, (err, rCategories) => {
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
		return routeProvider.getAppConfig(tenantId, (err, rAppConfig) => {
			if (err) {
				return cb(err);
			}

			tenantData[tenantId].appConfig = tenantData[tenantId].appConfig || {};
			
			rAppConfig.map(label => {
				tenantData[tenantId].appConfig[label.fieldKey] = label.fieldValue;
			});

			const languagesString = tenantData[tenantId].appConfig["LANGUAGES"] || 'en';
			if (languagesString) {
				const langArr = languagesString.split(",");
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
		return routeProvider.getPosts(tenantId, (err, rPosts) => {
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
        return routeProvider.getTask(tenantId, taskId, (err, rTask) => {
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
		return routeProvider.getAppLabels(tenantId, lang, (err, rLabels) => {
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
	routeProvider
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
	"rent.kitchen": "rentkitchen",
	"clickforwork.hu": "click4work",
	"talentwand.de": "talentwand",
	"bitcoinswap.com": "bitcoinswap"
};

const renderTaskerPage = (res, data) => {
	return res.render('index-provider.ejs', data);
}


const renderCustomPage = (req, res, template, data) => {
	const uncompiledPost = data.getPost(`${template.slug}`);

	if (!uncompiledPost) {
		return render(req, res, "st.error.404.index.ejs");
	}

	data.body = `
		<section style="margin-top:100px; margin-bottom: 50px;">
			${ejs.render(uncompiledPost, data)}
		</section>`;

	ejs.renderFile(__dirname + "/../views/layouts/material-layout.ejs", data, (err, result) => {
		if (!err) {
			res.end(result);

			return;
		}

		res.end(err.toString());
	});
}

const render = (req, res, template, data) => {
	let domainTenant;
	if (req.subdomains.length) {
		if (req.subdomains[req.subdomains.length - 1] === "www") {
			domainTenant = allowedDomains[req.hostname.replace("www.", "")];
		} else {
			domainTenant = req.subdomains[req.subdomains.length - 1];
		}
	} else {
		domainTenant = allowedDomains[req.hostname];
	}
	let tenantId = domainTenant || process.env.TENANT_ID;

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
		data.VQ_API_URL = process.env.API_URL.replace('?tenantId?', tenantId);
		data.TENANT_STRIPE_PUBLIC_KEY = tenantData[tenantId].stripePublicKey;

		if (process.env.ENV.toLowerCase() === 'production') {
			data.VQ_WEB_APP_CSS_URL = 'https://s3.eu-central-1.amazonaws.com/vq-marketplace/static/css/main.css';
			data.VQ_WEB_APP_JS_URL = 'https://s3.eu-central-1.amazonaws.com/vq-marketplace/static/js/main.js';
		} else {
			data.VQ_WEB_APP_CSS_URL = 'https://s3.eu-central-1.amazonaws.com/vq-marketplace-dev/static/css/main.css';
			data.VQ_WEB_APP_JS_URL = 'https://s3.eu-central-1.amazonaws.com/vq-marketplace-dev/static/js/main.js';
		}

		data.categories = configs[0];
		data.CONFIG = configs[1];
		data.getConfig = fieldKey => configs[1][fieldKey];
		data.getPost = code => {
		  let postBody = configs[2][code];

	      return postBody;
		};

		data.getTask = () => configs[3] === undefined ? undefined : configs[3];
		data.stripHTML = (html) => {
			return html.replace(/<(?:.|\n)*?>/gm, '');
		}

		const getLang = () => {
			const defaultLang = data.getConfig('DEFAULT_LANG') || 'en';

			if (req.params.lang) {
				return configs[1].LANGUAGES.indexOf(req.params.lang) !== -1 ? req.params.lang : defaultLang;
			}
			
			if (req.query.lang) {
				return configs[1].LANGUAGES.indexOf(req.query.lang) !== -1 ? req.query.lang : defaultLang;
			}

			return defaultLang;
		};

		data.translate = i18n.getFactory(
			tenantId,
			getLang()
		);

		data.originalUrl = req.originalUrl;

		data.lang = getLang();
		data.layout = data.layout || "layouts/material-layout.ejs";

		if (typeof template === "string") {
			return res.render(template, data);
		}

		const marketplaceLanguages = configs[1].LANGUAGES.split(',').concat(configs[1].DEFAULT_LANG);

		// if slug is a language
		if (
			template.slug && marketplaceLanguages.indexOf(template.slug) !== -1
		) {
			//we set the language and translate function accordingly
			data.lang = template.slug;
			data.translate = i18n.getFactory(
				tenantId,
				template.slug
			);
			
			//if there is a subslug like /en/taskers or /en/how-it-works
			if (template.subSlug) {

				const supplySlug = data.getConfig("LANDING_PAGE_HEADER_BUTTON_TEXT_FOR_SELLERS");
				//if the subslug is either taskers or the user defined one from the database
				if (
					template.subSlug === "taskers" ||
					(
						supplySlug && supplySlug === template.subSlug
					)
				) {
					//we render the tasker page
					return renderTaskerPage(res, data);
				}

				//else if the slug is not the tasker page and a custom page like /how-it-works
				template.slug = template.subSlug;
				return renderCustomPage(req, res, template, data);
			}

			//if there is no subSlug we render the root page in selected language
			return res.render('index-client.ejs', data);
		
		//if there is a slug which is not a language (meaning that it is either a custom page or the tasker page)
		} else if (template.slug && !marketplaceLanguages.indexOf(template.slug) !== -1) {

			//if the slug is either taskers or the user defined one from the database
			const supplySlug = data.getConfig("LANDING_PAGE_HEADER_BUTTON_TEXT_FOR_SELLERS");
			if (
				template.slug === "taskers" ||
				(
					supplySlug && supplySlug === template.slug
				)
			) {
				//we render the tasker page
				return renderTaskerPage(res, data);
			}

			//else we render the custom page

			return renderCustomPage(req, res, template, data);
		}

		//if all else
		if (typeof template === "string") {
			return res.render(template, data);
		}

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


	app.get("/:slug/:subSlug?", (req, res, next) => {
		const slug = req.params.slug.toLowerCase();
		const subSlug = req.params.subSlug ? req.params.subSlug.toLowerCase() : false;

		return render(req, res, {
			slug,
			subSlug
		}, {}, next);
	});

	app.get("/", (req, res) => render(req, res, "index-client.ejs"));


	/**
	 * Landing page for Sellers / Taskers (userType: 2)
	
	app.get("/:lang([a-zA-Z]{2})?/:supplySideSlug", (req, res) => render(req, res, "index-provider.ejs"));
	*/

	// app.get("/:lang([a-zA-Z]{2})?/:postCode", (req, res) => render(req, res, "index-post.ejs", { postCode: req.params.postCode.toLowerCase() }));

	app.get("/health", (req, res) => {
		res.send('Health OK');
	});

	app.use((req, res) => {
		res.status(404);

		return render(req, res, "st.error.404.index.ejs");
	});
};