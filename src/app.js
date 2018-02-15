

const makeVisible = id => {
  document.getElementById(id).className =
  document.getElementById(id).className.replace(/\bhidden\b/,'');
};

const makeInvisible = id => {
  document.getElementById(id).className =
  document.getElementById(id).className += ' hidden';
};

const toogleLoggedInMenuPoints = (shouldShow, userType) => {
  const toogle = shouldShow ? makeVisible : makeInvisible;

/*   if (shouldShow && userType === 1) {
    toogle("vq-header-new-listing-btn");
    toogle("vq-header-new-listing-xs-btn");
  }

  if (shouldShow && userType === 2) {
    toogle("vq-header-browse-btn");
    toogle("vq-header-browse-xs-btn");
  } */
  
/*   if (!shouldShow) {
    toogle("vq-header-new-listing-btn");
    toogle("vq-header-new-listing-xs-btn");
    toogle("vq-header-browse-btn");
    toogle("vq-header-browse-xs-btn");
  } */

  toogle("vq-header-dashboard-btn");
  toogle("vq-header-dashboard-xs-btn");
  
  
  toogle("vq-header-logout-xs-btn");
  toogle("vq-profile-btn");
  toogle("vq-header-profile-xs-btn");
};

const toogleLoggedOutMenuPoints = (shouldShow) => {
  const toogle = shouldShow ? makeVisible : makeInvisible;

  toogle("vq-header-login-xs-btn");
  toogle("vq-header-signup-xs-btn");
  toogle("vq-header-login-btn");
  toogle("vq-header-signup-btn");
};

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
      toogleLoggedInMenuPoints(true, user.userType);

      makeVisible("vq-body");
    }, err => {
      toogleLoggedOutMenuPoints(true);
      toogleLoggedInMenuPoints(false);

      makeVisible("vq-body");

      ViciAuth.destroyUserCredentials();
    });
});

app.controller('headerCtrl', function($scope, ViciAuth, $mdMenu, $mdSidenav, $window, $http, CONFIG) {
	const header = this;
  var originatorEv;

  const getConfig = (fieldKey) => {
    return CONFIG.find(c => c.fieldKey === fieldKey).fieldValue;
  }
  
  $scope.shouldShowButton = (buttonType) => {
    const isLoggedIn = header.user ? true : false;
    const userType = header.user ? Number(header.user.userType) : undefined;

    if (buttonType === 'dashboard') {
      if (isLoggedIn) {
        return true;
      }

      return false;
    }
  
    if (buttonType === 'browse') {
      if (
        $scope.CONFIG !== undefined &&
        (
          getConfig('LISTING_ENABLE_PUBLIC_VIEW') === "1" &&
          !isLoggedIn
        ) ||
        (
          isLoggedIn &&
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
  
    if (buttonType === 'new-listing') {
      if (
        $scope.CONFIG &&
        (
          isLoggedIn &&
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

    if (buttonType === 'listings') {
      if (
        $scope.CONFIG &&
        isLoggedIn &&
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
      ) {
        return true;
      }

      return false;
    }

    if (buttonType === 'requests') {
      if (
        CONFIG &&
        isLoggedIn &&
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
      ) {
        return true;
      }

      return false;
    }
  }

  header.toggleLeft = () => $mdSidenav('left').toggle();

	header.logout = () => {
    toogleLoggedInMenuPoints(false);
    toogleLoggedOutMenuPoints(true);

	  header.user = null;
	  
    ViciAuth.logout();
    
    location.reload();
  };

  ViciAuth
  .me(myProfile => {
		header.user = myProfile;
	}, err => {});
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