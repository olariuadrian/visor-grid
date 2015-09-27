(function(angular) {

    angular.module('visorGridDirective', ['ui.bootstrap'])

    .directive('visorGrid',function($compile, $rootScope, $filter, $timeout) {
        return {
            scope: {
                rows: '=',
                rowCount: '=',
                control: '=?',

                showPagination: '=?',
                pageChange: '&?',
                currentPage: '=?',
                itemsPerPage: '=?',

                sortChange: '&?',
                sortField: '=?',
                sortOrder: '=?'
            },
            restrict: 'E',
            transclude: true,
            templateUrl: 'templates/visorGrid/visor-grid.html',
            controller: function($scope, $element) {
                $scope.Math = Math;

                $scope.control = $scope.control || {};
                $scope.currentPage = $scope.currentPage || 1;
                $scope.itemsPerPage = 10;
                $scope.showPagination = $scope.showPagination===undefined?true:$scope.showPagination;


                var columns = $scope.columns = $scope.control.columns = [];

                this.addColumn = function(colScope) {
                    columns.push({
                        field: colScope.field,
                        header: colScope.header,
                        cellTemplate: colScope.cellTemplate,
                        visible: colScope.visible,
                        isIndex: colScope.isIndex,
                        sortable: colScope.sortable,

                        sorted: colScope.field && colScope.field==$scope.sortField,
                        sortOrder: $scope.sortOrder || 1
                    });
                };

                this.changeColumnVisibility = $scope.control.changeColumnVisibility = function(header, visible) {
                    columns.forEach(function(cell) {
                        if ( cell.header == header ) {
                            cell.visible = !!visible;
                        }
                    });
                };

                $scope.changeSortBy = function(col) {
                    if (!col.sortable) return;

                    columns.forEach(function(c) {
                        c.sorted = false;
                    });

                    col.sorted = true;
                    col.sortOrder = (col.sortOrder || 1) * -1;

                    $scope.sortField = col.field;
                    $scope.sortOrder = col.sortOrder;
                    $scope.sortChange(col.field, col.sortOrder);

                    console.log(col);
                };

                $scope._pageChange = function() {
                    $timeout(function() {
                        if ($scope.pageChange) $scope.pageChange();
                    });
                };

                $scope.control.getHeaders = function() {
                    var gridHeaders = [];
                    var gridFields = [];
                    columns.forEach(function(column) {
                        if(column.field) {
                            gridHeaders.push(column.header);
                            gridFields.push(column.field);
                        }
                    });
                    return {
                        'headers': gridHeaders,
                        'fields': gridFields
                    };
                };

                $scope.$watch('itemsPerPage', function() {
                    $scope.pageChange();
                });

                $scope.$watch('columns', function() {
                    $scope.$$phase || $scope.$root.$$phase || $rootScope.$apply();
                });
            },
            link: function(scope, elem, attrs, gridCtrl) {
                scope.selectColumn = function($event, col) {
                    $event.stopPropagation();
                    $event.preventDefault();

                    gridCtrl.changeColumnVisibility(col.header, !col.visible);
                };
            }
        };
    })

    .directive('visorGridCol',function($compile) {
        return {
            require: '^visorGrid',
            scope: {
                field: '@',
                header: '@',
                isIndex: '=?',
                visible: '=?',
                sortable: '=?'
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'templates/visorGrid/visor-grid-cell.html',
            link: function(scope, elem, attrs, gridCtrl) {
                scope.visible = scope.visible===undefined?true:!!scope.visible;
                scope.isIndex = scope.isIndex===undefined?false:!!scope.isIndex;
                scope.sortable = scope.sortable===undefined?false:!!scope.sortable;

                //console.log('visorGridCol link', scope.header, scope.field, scope.visible, scope.isIndex);
                var domContent = elem.html();

                scope.cellTemplate = domContent;

                gridCtrl.addColumn(scope);
            }
        };
    })

    .directive('visorGridCell', function($compile) {
        return {
            scope: {
                col: '=',
                rowData: '=',
                row: '=',
                index: '='
            },
            restrict: 'E',
            replace: true,
            link: function(scope, elem, attrs) {
                if (scope.col.isIndex) {
                    elem.html('<div>{{vGridIndex}}</div>');
                } else {
                    elem.html(scope.col.cellTemplate);
                }

                var compileScope = scope.$new(true);
                angular.extend(compileScope, scope.rowData);
                angular.extend(compileScope, {
                    vGridIndex: scope.index,
                    context: {
                        index: scope.index
                    }
                });
                $compile(elem.contents())(compileScope);
            }
        };
    })
    
    
    .directive('convertToNumber', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
                });
                ngModel.$formatters.push(function(val) {
                    return '' + val;
                });
            }
        };
    })



    .run(["$templateCache", function($templateCache) {
        $templateCache.put("templates/visorGrid/visor-grid.html",
            '<style type="text/css">\n' +
            '    .visor-grid .pagination {margin: 0;}\n' +
            '</style>\n' +

            '<div class="visor-grid">\n' +
            '    <div style="display: none" ng-transclude></div>\n' +
            '    <div class="row" style="position: relative">\n' +
            '        <div class="dropdown vg-col-dropdown" style="position: absolute; top: 8px; right: 3px;">\n' +
            '            <a id="dLabel" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n' +
            '                <i class="fa fa-columns"></i>\n' +
            '            </a>\n' +
            '            <ul class="dropdown-menu" role="menu" aria-labelledby="dLabel" style="right: 0;left: auto;">\n' +
            '                <li ng-repeat="col in columns">\n' +
            '                    <a href="javascript: void();" ng-click="selectColumn($event, col)">\n' +
            '                        <input type="checkbox" ng-model="col.visible" ng-click="$event.preventDefault()" />\n' +
            '                        {{col.header}}\n' +
            '                    </a>\n' +
            '                </li>\n' +
            '            </ul>\n' +
            '        </div>\n' +
            '        <div class="table-responsive">\n' +
            '            <table class="table table-striped table-hover">\n' +
            '                <thead>\n' +
            '                    <tr>\n' +
            '                        <td ng-repeat="col in columns" ng-if="col.visible" ng-click="changeSortBy(col)">\n' +
            '                            <strong>{{col.header}}</strong>\n' +
            '                            <span ng-if="col.sorted" class="order" ng-class="{\'-1\':\'dropup\', \'1\':\'dropdown\'}[col.sortOrder]">\n' +
            '                                <span class="caret" style="margin: 10px 5px;"></span>\n' +
            '                            </span>\n' +
            '                        </td>\n' +
            '                    </tr>\n' +
            '                </thead>\n' +
            '                <tbody>\n' +
            '                    <tr ng-repeat="row in rows">\n' +
            '                        <td ng-repeat="col in columns" ng-if="col.visible">\n' +
            '                            <visor-grid-cell\n' +
            '                                col="col"\n' +
            '                                row-data="row"\n' +
            '                                index="(currentPage-1)*itemsPerPage + $parent.$parent.$index + 1"\n' +
            '                            />\n' +
            '                        </td>\n' +
            '                    </tr>\n' +
            '                </tbody>\n' +
            '            </table>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="row" ng-show="showPagination">\n' +
            '    	<div class="col-sm-6">\n' +
            '    	    <label>\n' +
            '        		<select class="form-control input-sm" ng-model="itemsPerPage" convert-to-number>\n' +
            '        			<option value="10">10</option>\n' +
            '        			<option value="20">20</option>\n' +
            '        			<option value="50">50</option>\n' +
            '        			<option value="100">100</option>\n' +
            '        			<option value="200">200</option>\n' +
            '        		</select>\n' +
            '    	    </label>\n' +
            '    	    <label for="">\n' +
            '    	        Showing {{(currentPage-1)*itemsPerPage + 1}} to {{ Math.min(currentPage*itemsPerPage, rowCount)}} of {{rowCount}} rows\n' +
            '    	    </label>\n' +
            '    	</div>\n' +
            '    	<div class="col-sm-6">\n' +
            '    		<div class="pull-right">\n' +
            '    			<pagination\n' +
            '    				total-items="rowCount"\n' +
            '    				items-per-page="itemsPerPage"\n' +
            '    				max-size="10"\n' +
            '    				ng-model="currentPage"\n' +
            '    				ng-change="_pageChange()"\n' +
            '                                                   ' +
            '    				rotate="false"\n' +
            '    				boundary-links="true"\n' +
            '    				class="pagination-sm"\n' +
            '    				previous-text="&lsaquo;"\n' +
            '    				next-text="&rsaquo;"\n' +
            '    				first-text="&laquo;"\n' +
            '    				last-text="&raquo;">\n' +
            '    			</pagination>\n' +
            '    		</div>\n' +
            '    	</div>\n' +
            '    </div>\n' +
            '</div>\n' +
            "");
        }
    ])

    .run(["$templateCache", function($templateCache) {
        $templateCache.put("templates/visorGrid/visor-grid-cell.html",
            '<td width="100" ng-transclude></td>\n' +
            "");
        }
    ]);

})(angular);