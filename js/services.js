(function(angular) {
    var VisorGridSampleServices = angular.module('VisorGridSample.services', []);


    VisorGridSampleServices.factory('BaseService', function($http, $q) {
        var BaseService = {
            handleApiRequest: function(request) {
                var deffered = $q.defer();

                request.then(function(res) {
                    deffered.resolve(res.data);
                }, function(err) {
                    console.log(err);

                    deffered.reject(err);
                });

                return deffered.promise;
            }
        };

        return BaseService;
    });


    VisorGridSampleServices.factory('CountryService', function($http, $q, BaseService) {
        var LeadService = {
            findCountries: function(offset, limit) {
                return BaseService.handleApiRequest($http({
                    url: 'data/countries.json',
                    method: "GET",
                })).then(function(data) {
                    console.log(data);
                    return $q.resolve({
                        count: data.length,
                        countries: data.slice(offset, offset + limit)
                    });
                });
            }
        };

        return LeadService;
    });


})(angular);