function r(arr){
  let acc = 0

  for(let element of arr){
    acc += element
  }

  let m = acc / arr.length

  return m
}

console.log(r([1, 2, 3, 4]))