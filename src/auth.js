angular.module("viciauth",[ ])

.value("API", {
	API_URL: "@@API_URL",
	ME: "@@API_PATHS.ME",
	LOGIN: "@@API_PATHS.LOGIN",
	SIGNUP: "@@API_PATHS.SIGNUP",
	VALIDATE: "@@API_PATHS.VALIDATE",
	FACEBOOK: "@@API_PATHS.FACEBOOK",
	LOGOUT: "@@API_PATHS.LOGOUT"
})

.factory("apiFactory", (API) => method => API.API_URL + API[method])

.service("ViciAuth", ($window, $http, $q, API, apiFactory) => {
    const LOCAL_TOKEN_KEY = 'ST_AUTH_TOKEN';
    const LOCAL_USER_ID_KEY = 'ST_AUTH_USERID';
    
	let username = '';
	let isAuthenticated = false;
	let role = '';
	let authToken;
	let authUserId;

	const configure = (configKey, configValue) => API[configKey] = configValue;

	const useCredentials = (token, userId) => {
		isAuthenticated = true;
		authToken = token;
		authUserId = userId;

		$http.defaults.headers.common['X-Auth-Token'] = token;
	};
	
	const storeUserCredentials = (token, userId) => {
		$window.localStorage.setItem(LOCAL_USER_ID_KEY, userId);
		$window.localStorage.setItem(LOCAL_TOKEN_KEY, token);

		useCredentials(token, userId);
	};

	const loadUserCredentials = () => {
		const token = $window.localStorage.getItem(LOCAL_TOKEN_KEY);
		const userId = $window.localStorage.getItem(LOCAL_USER_ID_KEY);

		if (token) {
			useCredentials(token, userId);
		}
	}

	const destroyUserCredentials = () => {
		authToken = undefined;
		authUserId = undefined;
		isAuthenticated = false;

		$http.defaults.headers.common['X-Auth-Token'] = undefined;
		
		$window.localStorage.removeItem(LOCAL_TOKEN_KEY);
		$window.localStorage.removeItem(LOCAL_USER_ID_KEY);
	}

	const loginSignupFnFactory = loginOrSignup => postData => $q((resolve, reject) =>
		$http.post(apiFactory(loginOrSignup), postData)
		.success(data => {
			storeUserCredentials(data.token, data.userId);
			
			return resolve(data);
		})
		.error(data => reject(data)));

	const login = loginSignupFnFactory('LOGIN');

	const signup = loginSignupFnFactory('SIGNUP');

	const validate = callback => $http.post(apiFactory("VALIDATE"), {
		token: $window.localStorage.getItem(LOCAL_TOKEN_KEY)
	}).then(response => callback(response.data));

	const logout = () => $http.post(apiFactory("LOGOUT")).then(data => destroyUserCredentials());
 
	const me = (callback, errFn) => $http.get(apiFactory("ME"))
		.then(response => callback(response.data), response => errFn(response));

	return {
		me, configure, validate, login, signup, logout, loadUserCredentials, destroyUserCredentials,
		getUserId: () => authUserId,
		getToken: () => authToken,
		isAuthenticated: () => isAuthenticated,
	};
})

.run(ViciAuth => ViciAuth.loadUserCredentials());
