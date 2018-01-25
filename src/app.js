const makeVisible = id => {
  if (document.getElementById(id)) {
    document.getElementById(id).className =
    document.getElementById(id).className.replace(/\bhidden\b/,'');
  }
};

const makeInvisible = id => {
  if (document.getElementById(id)) {
    document.getElementById(id).className =
    document.getElementById(id).className += ' hidden';
  }
};

const toggleLoggedInMenuPoints = (shouldShow, userType) => {
  const toggle = shouldShow ? makeVisible : makeInvisible;

  if (shouldShow && userType === 1) {
    toggle("vq-header-buyer-btn");
    toggle("vq-header-browse-btn");
  }

  if (shouldShow && userType === 2) {
    toggle("vq-header-new-listing-btn");
    toggle("vq-header-new-listing-xs-btn");
    toggle("vq-header-user-landing-page-btn");
    toggle("vq-header-service-provider-landing-page-btn");
  }
  
  if (!shouldShow) {
    toggle("vq-header-new-listing-btn");
    toggle("vq-header-new-listing-xs-btn");
    toggle("vq-header-browse-btn");
    toggle("vq-header-browse-xs-btn");
  }
  toggle("vq-header-dashboard-btn");
  toggle("vq-header-dashboard-xs-btn");
  
  toggle("vq-header-logout-xs-btn");
  toggle("vq-profile-btn");
  toggle("vq-header-profile-xs-btn");
};

const toggleLoggedOutMenuPoints = (shouldShow) => {
  const toggle = shouldShow ? makeVisible : makeInvisible;

  toggle("vq-header-login-xs-btn");
  toggle("vq-header-signup-xs-btn");
  toggle("vq-header-login-btn");
  toggle("vq-header-signup-btn");
};

const app = angular.module("vqApp", [
  'ngMaterial',
  "viciauth"
]);

app.constant("API_URL", typeof VQ_API_URL === "undefined" ? "@@VQ_API_URL" : VQ_API_URL);

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
      toggleLoggedInMenuPoints(true, user.userType);

      makeVisible("vq-body");
    }, err => {
      toggleLoggedOutMenuPoints(true);
      toggleLoggedInMenuPoints(false);

      makeVisible("vq-body");

      ViciAuth.destroyUserCredentials();
    });
});

app.controller('headerCtrl', function(ViciAuth, $mdMenu, $mdSidenav) {
	const header = this;
	var originatorEv;

  header.toggleLeft = () => $mdSidenav('left').toggle();

	header.logout = () => {
    toggleLoggedInMenuPoints(false);
    toggleLoggedOutMenuPoints(true);

	  header.user = null;
	  
    ViciAuth.logout();
    
    location.reload();
  };

  ViciAuth
  .me(myProfile => {
		header.user = myProfile;
	}, err => {});
});

app.controller('taskAutoCompleteCtrl', function($timeout, $http, $q, $log) {
    var self = this;

    self.simulateQuery = false;
    self.isDisabled    = false;

    // list of `state` value/display objects
    self.states        = loadAll();
    self.querySearch   = querySearch;
    self.selectedItemChange = selectedItemChange;
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

    function selectedItemChange(item) {
      $log.info('Item changed to ' + JSON.stringify(item));
    }

    function loadAll() {
        var categories = stCategories.map(function(item) {
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