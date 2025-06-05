let timespan = { start: 0, end: 0, set: null, getSecondBetween: null }
timespan.set = () => {
  if(timespan.start > 0)
    timespan.end = Date.now()
  else
    timespan.start = Date.now()
}
timespan.getSecondBetween = () => {
  const seconds = Math.floor((timespan.end - timespan.start) / 1000)
  timespan.start = 0
  timespan.end = 0
  return seconds
}
module.exports = {
  timespan: timespan
}