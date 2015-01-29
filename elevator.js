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