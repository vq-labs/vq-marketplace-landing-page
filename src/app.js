const app = angular.module("vqApp", [
  'ngMaterial',
  "viciauth"
])

app.constant("API_URL", VQ_API_URL || "@@VQ_API_URL");

app.config(function($locationProvider) {
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

    const makeVisible = id => {
      document.getElementById(id).className =
      document.getElementById(id).className.replace(/\bhidden\b/,'');
    }

    ViciAuth
    .me(user => {
      if (user.userType === 1) {
        makeVisible("vq-header-new-listing-btn");
        makeVisible("vq-header-new-listing-xs-btn");
      }

      if (user.userType === 2) {
        makeVisible("vq-header-browse-btn");
        makeVisible("vq-header-browse-xs-btn");
      }
      
      makeVisible("vq-header-dashboard-btn");
      makeVisible("vq-header-dashboard-xs-btn");
      
      
      makeVisible("vq-header-logout-xs-btn");
      makeVisible("vq-profile-btn");
      makeVisible("vq-header-profile-xs-btn");
      makeVisible("vq-body");
    }, err => {
      makeVisible("vq-header-login-xs-btn");
      makeVisible("vq-header-signup-xs-btn");
      makeVisible("vq-header-login-btn");
      makeVisible("vq-header-signup-btn");
      makeVisible("vq-body");

      ViciAuth.destroyUserCredentials();
    });
});

app.controller('headerCtrl', function(ViciAuth, $mdMenu, $mdSidenav) {
	const header = this;
	var originatorEv;

  header.toggleLeft = () => $mdSidenav('left').toggle();

	header.logout = () => {
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