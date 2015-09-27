(function(angular) {

    var VisorGridSample = angular.module('VisorGridSample', ['ngRoute', 'visorGridDirective']);

    VisorGridSample.config(['$routeProvider', '$locationProvider',
        function($routeProvider, $locationProvider) {

            $routeProvider
                .otherwise({
                    redirectTo: '/',
                    controller: 'MainController'
                });

            // use the HTML5 History API
            $locationProvider.html5Mode(true);
        }]);


    VisorGridSample.controller('MainController', ['$scope', '$http', '$timeout',
        function ( $scope, $http, $timeout) {
            console.log('MainController');
            $scope.countries = [];

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;

            $scope.vGridControl = {};

            $scope.pageChanged = function() {
                $http({
                    url: 'data/countries.json',
                    method: "GET",
                    data: {
                        offset: ($scope.currentPage - 1) * $scope.itemsPerPage,
                        limit: parseInt($scope.itemsPerPage, 10)
                    }
                }).then(function(response) {
                    console.log(response.data);
                    $scope.countries = response.data.countries.country;
                    $scope.totalItems = $scope.countries.length;
                });
            };

            $scope.pageChanged();
        }]);

})(angular);