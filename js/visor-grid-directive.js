(function(angular) {

    angular.module('visorGridDirective', ['ui.bootstrap'])

    .directive('visorGrid',function($compile, $rootScope, $filter, $timeout) {
        return {
            scope: {
                rows: '=',
                rowCount: '=',
                control: '=?',

                showPagination: '=?',
                _pageChange: '&?pageChange',
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
                $scope.itemsPerPage = $scope.itemsPerPage || 10;
                $scope.showPagination = $scope.showPagination===undefined?true:$scope.showPagination;


                // properties
                var columns = $scope.columns = $scope.control.columns = [];
                var rowConfig = this.rowConfig = $scope.rowConfig = $scope.control.rowConfig = {};

                // methods
                this.setRowConfig = setRowConfig;
                this.addColumn = addColumn;
                this.changeColumnVisibility = $scope.control.changeColumnVisibility = changeColumnVisibility;
                $scope.changeSortBy = changeSortBy;
                $scope.pageChange = pageChange;
                $scope.control.getHeaders = getHeaders;

                $scope.$watch('itemsPerPage', function() {
                    $scope.pageChange();
                });

                $scope.$watch('columns', function() {
                    $scope.$$phase || $scope.$root.$$phase || $rootScope.$apply();
                });



                // methods implementation
                // ---------------------------------------


                function setRowConfig(rowConfigScope) {
                    rowConfig = this.rowConfig = $scope.rowConfig = $scope.control.rowConfig = rowConfigScope;
                }

                function addColumn(colScope) {
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
                }

                function changeColumnVisibility(header, visible) {
                    columns.forEach(function(cell) {
                        if ( cell.header == header ) {
                            cell.visible = !!visible;
                        }
                    });
                }

                function changeSortBy(col) {
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
                }

                function pageChange() {
                    $timeout(function() {
                        if ($scope._pageChange) $scope._pageChange();
                    });
                }

                function getHeaders() {
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
                }
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

    .directive('visorGridRowConfig',function($compile) {
        return {
            require: '^visorGrid',
            scope: {
                css: '@'
            },
            restrict: 'E',
            replace: true,

            controller: function($scope, $element) {
            },
            link: function(scope, elem, attrs, gridCtrl) {
                gridCtrl.setRowConfig(scope);
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
            templateUrl: 'templates/visorGrid/visor-grid-col.html',
            controller: function($scope, $element) {
            },
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

    .directive('visorGridCell', function($compile, $interpolate) {
        return {
            require: '^visorGrid',
            scope: {
                col: '=',
                rowData: '=',
                row: '=',
                index: '='
            },
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'templates/visorGrid/visor-grid-cell.html',
            controller: function($scope, $element) {
            },
            link: function(scope, elem, attrs, gridCtrl) {
                scope.rowData = scope.rowData || {};
                scope.rowData.__vGridIndex = scope.index;

                // compile row class
                scope.css = $interpolate('{{' + (gridCtrl.rowConfig && gridCtrl.rowConfig.css || '') + '}}')(scope.rowData);

                // compile cell template
                var cellTemplate = scope.col.cellTemplate;
                if (scope.col.isIndex) {
                    cellTemplate = '<div>{{__vGridIndex}}</div>';
                }

                var compileScope = scope.$new(true);
                angular.extend(compileScope, scope.rowData);
                elem.html(cellTemplate);
                $compile(elem.contents())(compileScope);
                /*
                Alternative compile
                elem.html($interpolate(cellTemplate)(scope.rowData));
                */
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
            '    <div class="row">\n' +
            '        <div class="table-responsive" style="overflow: visible;">\n' +
            '            <table class="table table-striped table-hover">\n' +
            '                <thead>\n' +
            '                    <tr>\n' +
            '                        <td ng-repeat="col in columns" ng-if="col.visible" ng-click="changeSortBy(col)">\n' +
            '                            <strong>{{col.header}}</strong>\n' +
            '                            <span ng-if="col.sorted" class="order" ng-class="{\'-1\':\'dropup\', \'1\':\'dropdown\'}[col.sortOrder]">\n' +
            '                                <span class="caret" style="margin: 10px 5px;"></span>\n' +
            '                            </span>\n' +
            '                        </td>\n' +
            '                        <td width="20" style="background: #fff;">\n' +//#d6e8ff;
            '                           <div class="dropdown vg-col-dropdown">\n' +
            '                               <a id="dLabel" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\n' +
            '                                   <i class="fa fa-chevron-down"></i>\n' +
            '                               </a>\n' +
            '                               <ul class="dropdown-menu" role="menu" aria-labelledby="dLabel" style="right: 0;left: auto;">\n' +
            '                                   <li ng-repeat="col in columns">\n' +
            '                                       <a href="javascript: void();" ng-click="selectColumn($event, col)">\n' +
            '                                           <input type="checkbox" ng-model="col.visible" ng-click="$event.preventDefault()" />\n' +
            '                                           {{col.header}}\n' +
            '                                       </a>\n' +
            '                                   </li>\n' +
            '                               </ul>\n' +
            '                           </div>\n' +
            '                        </td>\n' +
            '                    </tr>\n' +
            '                </thead>\n' +
            '                <tbody>\n' +
            '                    <tr ng-repeat="row in rows">\n' +
            '                       <td visor-grid-cell\n' +
            '                           ng-repeat="col in columns"\n' +
            '                           ng-if="col.visible"\n' +
            '                           colspan="{{$last?2:1}}"\n' +
            '                           col="col"\n' +
            '                           row-data="row"\n' +
            '                           index="(currentPage-1)*itemsPerPage + $parent.$parent.$index + 1"\n' +
            '                       ></td>\n' +
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
            '    			<uib-pagination\n' +
            '    				total-items="rowCount"\n' +
            '    				items-per-page="itemsPerPage"\n' +
            '    				max-size="10"\n' +
            '    				ng-model="currentPage"\n' +
            '    				ng-change="pageChange()"\n' +
            '                                                   ' +
            '    				rotate="false"\n' +
            '    				boundary-links="true"\n' +
            '    				class="pagination-sm"\n' +
            '    				previous-text="&lsaquo;"\n' +
            '    				next-text="&rsaquo;"\n' +
            '    				first-text="&laquo;"\n' +
            '    				last-text="&raquo;">\n' +
            '    			</uib-pagination>\n' +
            '    		</div>\n' +
            '    	</div>\n' +
            '    </div>\n' +
            '</div>\n' +
            "");
        }
    ])

    .run(["$templateCache", function($templateCache) {
        $templateCache.put("templates/visorGrid/visor-grid-col.html",
            '<div ng-transclude></div>\n' +
            "");
        }
    ])

    .run(["$templateCache", function($templateCache) {
        $templateCache.put("templates/visorGrid/visor-grid-cell.html",
            '<td ng-transclude ng-colspan="colspan" ng-class="css"></td> ' +
            "");
        }
    ]);


})(angular);