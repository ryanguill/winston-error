"use strict";

var clone = require("lodash.clone");
var pick = require("lodash.pick");
var partial = require("lodash.partial");
var defaults = require("lodash.defaults");
var keys = require("lodash.keys");
var drop = require("lodash.drop");

/**
 * Expose module.
 */

module.exports = function winstonLoggerDecorator(logger, options) {
  var originalLogger = clone(logger); // not deep

  options = options || {};
  options.decoratedLevels = options.decoratedLevels || ["error"];
  options.pickedFields = options.pickedFields || {
    name: undefined,
    message: undefined,
    stack: undefined
  };
  var pickedKeys = keys(options.pickedFields);

  function winstonCallRewriter(loggerMethod, message, metadata) {
    if (!(message instanceof Error)) {
      // this decorator isn't needed
      return loggerMethod.apply(logger, drop(arguments, 1));
    }

    var error = message;

    // Keep original metadata safe.
    metadata = clone(metadata || {});

    // Copy only whitelisted error fields in metadata,
    // providing an optional default value
    metadata.error = defaults(pick(error, pickedKeys), options.pickedFields);

    // Replace message by error message.
    message = error.message;

    // Log with arguments re-arranged.
    var args = [message, metadata].concat(drop(arguments, 3));
    loggerMethod.apply(logger, args);
  }

  options.decoratedLevels.forEach(function(level) {
    logger[level] = partial(winstonCallRewriter, originalLogger[level]);
  });
};
