'use strict'

const hpStackTracePattern = /at\s{1}(?:.*\.)?plugin\s{1}.*\n\s*(.*)/
const fileNamePattern = /(\w*(\.\w*)*)\..*/

module.exports = function extractPluginName(stack) {
  const m = stack.match(hpStackTracePattern)

  // get last section of path and match for filename
  return m
    ? m[1]
        .split(/[/\\]/)
        .slice(-1)[0]
        .match(fileNamePattern)[1]
    : 'anonymous'
}
