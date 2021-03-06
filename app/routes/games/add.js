var router = require('express').Router(),
  Game = require('../../models/game.js'),
  log = require('../../helpers/logger'),
  uuid = require('uuid/v1');

router.post('/', function(req, res) {
  // Validation
  req.checkBody('title', 'Title is required').notEmpty();
  req.checkBody('slug', 'Slug is required').isSlug();
  req.checkBody('repository', 'Repository needs to be a URL').isURL();
  req.checkBody('location', 'Location needs to be a URL').isURL();
  req.checkBody('description').optional();

  var errors = req.validationErrors();

  if (errors) {
    res.render('games/add', {
      errors: errors
    });
    return;
  }

  var values = Object.assign({}, req.body);
  values.created = values.updated = Date.now();
  var game = new Game(values);
  game.bundleId = uuid();
  game.releases = [];
  game.groups = [];

  game.save(function(err, game) {
    if (err) {
      log.error(err);
      return res.render('game/add', {
        error: 'Unable to add the game'
      });
    }
    res.render('games/add', {
      success: 'Game added successfully'
    });
  });
});

router.get('/', function(req, res) {
  res.render('games/add');
});

module.exports = router;
