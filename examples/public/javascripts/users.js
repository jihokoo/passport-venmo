'use strict';

angular.element(document).ready(function() {
    //Fixing facebook bug with redirect
    if (window.location.hash === '#_=_') window.location.hash = '#!';

    //Then init the app
    angular.bootstrap(document, ['venmo_example']);
});

angular.module('venmo_example', ['ngRoute', 'ngResource', 'ui.router'])
  .factory('Global', [
      function() {
          var _this = this;
          _this._data = {
              user: window.user,
              authenticated: !! window.user
          };

          return _this._data;
      }
  ])
  .controller('IndexController', ['$scope', '$http', '$location', 'Global', function ($scope, $http, $location, Global) {
      $scope.global = Global;
    }
  ])
  .controller('UserController', ['$scope', '$http', '$location', 'Global', function ($scope, $http, $location, Global) {
      $scope.global = Global;
    }
  ]);
