
const app = angular.module("vqApp", [
  'ngMaterial',
  "viciauth"
]);

app.constant("API_URL", typeof VQ_API_URL === "undefined" ? "@@VQ_API_URL" : VQ_API_URL);
app.constant("CONFIG", typeof CONFIG === "undefined" ? {} : CONFIG);
app.constant("CATEGORIES", typeof stCategories === "undefined" ? [] : stCategories);

// see https://stackoverflow.com/questions/16098430/angular-ie-caching-issue-for-http
app.config($httpProvider => {
  //initialize get if not there
  if (!$httpProvider.defaults.headers.get) {
      $httpProvider.defaults.headers.get = {};    
  }    

  // Answer edited to include suggestions from comments
  // because previous version of code introduced browser-related errors

  // disable IE ajax request caching
  $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
  // extra
  $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
  $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
});

app.config($locationProvider => {
  $locationProvider.html5Mode(true);
});

app.run($http => {
    $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
});

app.run((ViciAuth, API_URL) => {
    ViciAuth.configure("API_URL", API_URL);
    ViciAuth.configure("LOGIN", "/login");
    ViciAuth.configure("SIGNUP", "/signup/email");
    ViciAuth.configure("ME", "/me");

    ViciAuth.loadUserCredentials();

    ViciAuth
    .me(user => {

    }, err => {

      ViciAuth.destroyUserCredentials();
    });
});

app.controller('headerCtrl', function($scope, ViciAuth, $mdMenu, $mdSidenav, $window, $http, CONFIG) {
	const header = this;
  var originatorEv;
  $scope.isLoading = true;

  const getConfig = (fieldKey) => {
    return CONFIG[fieldKey];
  }

  ViciAuth
  .me(myProfile => {
    header.user = myProfile;
    $scope.isLoading = false;
	}, err => {
    $scope.isLoading = false;
  });
  
  
  $scope.shouldShowButton = (buttonType) => {
    const isLoggedIn = header.user ? true : false;
    const userType = header.user ? Number(header.user.userType) : -1;

    if (CONFIG && !$scope.isLoading) {
      if (buttonType === 'dashboard') {
        if (isLoggedIn) {
          return true;
        }
  
        return false;
      }
    
      if (buttonType === 'browse') {
        if (
          (
            getConfig('LISTING_ENABLE_PUBLIC_VIEW') === "1" &&
            !isLoggedIn
          ) ||
          (
            isLoggedIn &&
            userType !== -1 &&
            (
              (
                userType === 0
              ) ||
              (
                userType === 1 &&
                getConfig('USER_TYPE_SUPPLY_LISTING_ENABLED') === "1"
              ) ||
              (
                userType === 2 &&
                getConfig('USER_TYPE_DEMAND_LISTING_ENABLED') === "1"
              )
            )
          )
        ) {
          return true;
        }
        return false;
      }
    
      if (buttonType === 'new-listing') {
        if (
          (
            getConfig('LISTING_ENABLE_PUBLIC_VIEW') === "1" &&
            !isLoggedIn
          ) ||
          (
            isLoggedIn &&
            userType !== -1 &&
            (
              (
                userType === 0
              ) ||
              (
                userType === 1 &&
                getConfig('USER_TYPE_DEMAND_LISTING_ENABLED') === "1"
              ) ||
              (
                userType === 2 &&
                getConfig('USER_TYPE_SUPPLY_LISTING_ENABLED') === "1"
              )
            )
          )
        ) {
          return true;
        }
        return false;
      }
  
      if (buttonType === 'listings') {
        if (
          isLoggedIn &&
          userType !== -1 &&
          (
            (
              userType === 0
            ) ||
            (
              userType === 1 &&
              getConfig('USER_TYPE_DEMAND_LISTING_ENABLED') === "1"
            ) ||
            (
              userType === 2 &&
              getConfig('USER_TYPE_SUPPLY_LISTING_ENABLED') === "1"
            )
          )
        ) {
          return true;
        }
  
        return false;
      }
  
      if (buttonType === 'requests') {
        if (
          isLoggedIn &&
          userType !== -1 &&
          (
            (
              userType === 0
            ) ||
            (
              userType === 1 &&
              getConfig('USER_TYPE_SUPPLY_LISTING_ENABLED') === "1"
            ) ||
            (
              userType === 2 &&
              getConfig('USER_TYPE_DEMAND_LISTING_ENABLED') === "1"
            )
          )
        ) {
          return true;
        }
  
        return false;
      }
  
      if (buttonType === 'register') {
        if (isLoggedIn) {
          return false;
        }
        return true;
      }
  
      if (buttonType === 'login') {
        if (isLoggedIn) {
          return false;
        }
        return true;
      }
      if (buttonType === 'profile') {
        if (isLoggedIn) {
          return true;
        }
        return false;
      }
    }
    return false;
  }


  $scope.browseButtonText = (type) => {
    const isLoggedIn = header.user ? true : false;
    const userType = header.user ? Number(header.user.userType) : undefined;
    
    if (CONFIG && !$scope.isLoading) {
      if (isLoggedIn && userType !== -1) {
        if (userType === 0 && type === 'supply') {
          return true
        }
        if (userType === 1 && type === 'supply') {
          return true
        }
        if (userType === 2 && type === 'demand') {
          return true
        }
      }
  
      if (getConfig('LISTING_PUBLIC_VIEW_MODE') === 2 && type === 'supply') {
        return true
      }
  
      if (getConfig('LISTING_PUBLIC_VIEW_MODE') === 1 && type === 'demand') {
        return true
      }
    }

    return false;
  }

  header.toggleLeft = () => $mdSidenav('left').toggle();

	header.logout = () => {

	  header.user = null;
	  
    ViciAuth.logout();
    
    location.reload();
  };
});

app.controller('taskAutoCompleteCtrl', function($timeout, $http, $q, $log, CONFIG, CATEGORIES) {
    var self = this;

    self.simulateQuery = false;
    self.isDisabled    = false;

    // list of `state` value/display objects
    self.states        = loadAll();
    self.querySearch   = querySearch;
    self.selectedItemChangeForSupplyUser = selectedItemChangeForSupplyUser;
    self.selectedItemChangeForDemandUser = selectedItemChangeForDemandUser;
    self.searchTextChange   = searchTextChange;

    self.newState = newState;

    function newState(state) {
      alert("Sorry! You'll need to create a Constitution for " + state + " first!");
    }

    function querySearch (query) {
      var results = query ? self.states.filter( createFilterFor(query) ) : self.states,
          deferred;
      if (self.simulateQuery) {
        deferred = $q.defer();
        $timeout(function () { deferred.resolve( results ); }, 1, false);
        return deferred.promise;
      } else {
        return results;
      }
    }

    function searchTextChange(text) {
      $log.info('Text changed to ' + text);
    }

    function selectedItemChangeForDemandUser(item) {
      if (CONFIG.USER_TYPE_SUPPLY_LISTING_ENABLED === "1") {
        window.location.replace("/app?category=" + item.code + "&utm_source=homepage");

        return;
      }

      window.location.replace("/app/new-listing?category=" + item.code + "&utm_source=homepage")
    }

    function selectedItemChangeForSupplyUser(item) {
      if (CONFIG.USER_TYPE_DEMAND_LISTING_ENABLED === "1") {
        window.location.replace("/app?category=" + item.code + "&utm_source=homepage");

        return;
      }

      window.location.replace("/app/new-listing?category=" + item.code + "&utm_source=homepage")
    }

    function loadAll() {
        var categories = CATEGORIES.filter(category => Number(category.status) === 0).map(function(item) {
        return {
          img: item.imageUrl,
          code: item.code,
          label: item.label
        }
      });

      return categories;
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(state) {
        return (state.label.toLowerCase().indexOf(lowercaseQuery) === 0);
      };

    }
});