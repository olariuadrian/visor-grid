(function(angular) {

    var VisorGridSample = angular.module('VisorGridSample', ['ngRoute', 'visorGridDirective', 'VisorGridSample.services']);

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


    VisorGridSample.controller('MainController', ['$scope', '$http', '$timeout', 'CountryService',
        function ( $scope, $http, $timeout, CountryService) {
            console.log('MainController');
            $scope.countries = [];

            $scope.itemsPerPage = 10;
            $scope.currentPage = 1;

            $scope.vGridControl = {};

            $scope.pageChanged = function() {
                CountryService.findCountries(($scope.currentPage - 1) * $scope.itemsPerPage, parseInt($scope.itemsPerPage, 10)).then(function(data) {
                    console.log(data);
                    $scope.countries = data.countries;
                    $scope.totalItems = data.count;
                });
            };
        }]);

})(angular);