export default function filterMap (array, callback) {
  const newArray = []
  
  for (const el of array) {
    const res = callback(el)
    if (res) {
      newArray.push(res)
    }
  }
  
  return newArray
}
