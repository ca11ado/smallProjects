/**
 * Created by tos on 21.09.14.
 */
$(document).ready(function() {

    var arr1 = [2,4,1,3,5,6],
        arr2 = [];
    var min = 0,
        max = 6,
        current = 1,
        direction = 'up';

    sortElevatorQueue();

    function sortElevatorQueue() {
        if (arr1.indexOf(current) != -1) arr1.splice(arr1.indexOf(current),1);
        arr1 = (direction=='up') ? arr1.sort(function(a,b){return a>b;}) :arr1.sort(function(a,b){return a<b;}) ;
        console.log(arr1);
        for (var i=0, len=arr1.length; i < len; i++) {
            if (direction == 'up' && arr1[i] < current) {
                arr1.splice(len,0,arr1[i]);
                arr1[i] = undefined;
            } else if (direction == 'down' && arr1[i] > current) {
                arr1.splice(len,0,arr1[i]);
                arr1[i] = undefined;
            }
        }
        arr1 = arr1.filter(function(n){ return n !== undefined; });
        console.log('arr1 %o, arr2 %o', arr1, arr2);
    }

    var test = {
        init: function(elevators, floors) {
            var behavior = new Behavior();

            elevators.forEach(function(elevator, i, arr){
                elevator.on('idle', function () {
                    //console.log('%cEvent idle getFloorFromQueue %o', 'color:orange',behavior.getFloorFromQueue());
                    var goToFloor = behavior.getFloorFromQueue();
                    if (goToFloor) {
                        this.goToFloor(goToFloor);
                    } else {
                        if (this.currentFloor() != '0') {
                            this.goToFloor(0);
                        } else {
                            behavior.addElevatorFree(elevator);
                        }
                    }
                });
                elevator.on('passing_floor', function (floorNum, direction) {
                    // Если лифт не переполнен и впереди есть пассажир в том же направлении
                    var floorWaits = behavior.getFloorFromQueueInDirection(floorNum, direction);
                    if (floorWaits && this.loadFactor() < 0.6) {
                        this.destinationQueue.push(floorNum);
                        this.destinationQueue = this.destinationQueue.filter(onlyUnique);
                        if (direction == 'up') {
                            this.destinationQueue.sort(function(a,b){
                                return a > b;
                            });
                        } else {
                            this.destinationQueue.sort(function (a, b) {
                                return a < b;
                            });
                        }
                        this.checkDestinationQueue();
                    }
                    //console.log('passing(' + i + ') floor %o dir %o floorWaits %o, elQueue %o', floorNum, direction, floorWaits,this.destinationQueue);
                    //console.log('%cQueue up %o down %o', 'color:green', behavior.getFloorQueue().up, behavior.getFloorQueue().down);
                });
                elevator.on('floor_button_pressed', function (floorNum) {
                    // добавить в очередь лифта. Очистить дубликаты
                    this.destinationQueue.push(floorNum);
                    this.destinationQueue = this.destinationQueue.filter(onlyUnique);
                    this.checkDestinationQueue();
                    // удалить нажатый этаж из общей очереди
                    behavior.deleteFloorFromQueue(floorNum);
                    //console.log('floor_button_pressed queue %o', this.destinationQueue);
                    //if (this.loadFactor() < 0.6 && elevator.currentFloor() == 0) this.stop();
                });
                elevator.on('stopped_at_floor', function (floorNum) {
                    behavior.deleteFloorFromQueue(floorNum); // удалить этаж из общей очереди
                    behavior.deleteNotPressedFloor(floorNum);// удалить этаж из списка других лифтов, только если туда не хочет кто-то из текущих пассажиров этих лифтов
                    //console.log('stop floorNum %o floorsQueueUP %o floorsQueueDown %o', floorNum, behavior.getFloorQueue().up,behavior.getFloorQueue().down);
                });
            });

            floors.forEach(function(floor, i, arr){
                floor.on('up_button_pressed', function () {
                    behavior.addFloorToQueue(this.floorNum(), 'up');
                });
                floor.on('down_button_pressed', function () {
                    behavior.addFloorToQueue(this.floorNum(), 'down');
                });
            });

            function Behavior(){
                var elevatorsFree = [];
                var floorsQueue = {
                    'up': [],
                    'down': []
                };

                this.addFloorToQueue = function (floorNum,direction) {
                    var freeEl = this.getElevatorFree();
                    if (freeEl) {
                        freeEl.goToFloor(floorNum);
                    } else {
                        floorsQueue[direction].push(floorNum);
                        floorsQueue['up'] = floorsQueue['up'].filter(onlyUnique);
                        floorsQueue['down'] = floorsQueue['down'].filter(onlyUnique);
                    }
                    //console.log('%cBehavior addFloorToQueue down %o up %o','color:green',floorsQueue.down, floorsQueue.up);
                };
                this.getFloorFromQueue = function () {
                    var result;
                    //console.log('%cBehavior floorsQueue down %o up %o','color:green',floorsQueue.down, floorsQueue.up);
                    if (floorsQueue.down.length>0) {
                        result = floorsQueue.down.shift();
                    } else if(floorsQueue.up.length > 0) {
                        result = floorsQueue.up.shift();
                    }
                    return result;
                };
                this.getFloorFromQueueInDirection = function (floorNum,direction) {
                    var result;
                    if (floorsQueue[direction].indexOf(floorNum) != -1) {
                        result = floorsQueue[direction][floorsQueue[direction].indexOf(floorNum)];
                        floorsQueue[direction].splice(floorsQueue[direction].indexOf(floorNum+''),1)
                    }
                    return result;
                    /*var result = [];
                     for (var i=0; i < floorsQueue[direction].length; i++) {
                     if (direction == 'up') {
                     if (floorsQueue[direction][i] >= floorNum) {
                     result.push(floorsQueue[direction][i]);
                     }
                     } else {
                     if (floorsQueue[direction][i] <= floorNum) {
                     result.push(floorsQueue[direction][i]);
                     }
                     }
                     }
                     return result;*/
                };
                this.getFloorQueue = function () {
                    return floorsQueue;
                };
                this.deleteFloorFromQueue = function(floorNum) {
                    //console.log('deleteFloorFromQueue after floorNum %o QueueUp %o QueueDown %o', floorNum, floorsQueue.up, floorsQueue.down);
                    for (var key in floorsQueue) {
                        if (floorsQueue.hasOwnProperty(key)) {
                            if (floorsQueue[key].indexOf(floorNum) != -1) floorsQueue[key].splice(floorsQueue[key].indexOf(floorNum), 1);
                        }
                    }
                    //console.log('deleteFloorFromQueue before floorNum %o QueueUp %o QueueDown %o', floorNum, floorsQueue.up, floorsQueue.down);
                };

                this.deleteNotPressedFloor = function(floorNum) {
                    elevators.forEach(function(el, i, arr2){
                        var elQueue = el.destinationQueue,
                            pressed = el.getPressedFloors();
                        elQueue = diff(elQueue, pressed);
                        if (elQueue[0]) {
                            el.destinationQueue.splice(el.destinationQueue.indexOf(elQueue[0]), 1);
                            console.log('%cTrue', 'color:green;');
                        }
                    });
                };

                // elevators
                this.addElevatorFree = function (elevator) {
                    elevatorsFree.push(elevator);
                };
                this.getElevatorFree = function () {
                    return (elevatorsFree.length>0) ? elevatorsFree.shift() : false;
                };



            }

            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            function diff(A, B)
            {
                var M = A.length, N = B.length, c = 0, C = [];
                for (var i = 0; i < M; i++)
                {
                    var j = 0, k = 0;
                    while (B[j] !== A[ i ] && j < N) j++;
                    while (C[k] !== A[ i ] && k < c) k++;
                    if (j == N && k == c) C[c++] = A[ i ];
                }
                return C;
            }
        },
        update: function(dt, elevators, floors) {
        }
    }

});