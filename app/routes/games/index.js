// Okay so what the hell is happening here.
// src.pbk.org/games/:game_id should be the ONLY ROUTE DEFINED HERE
// The any addtl logic can live here as REDIRECTS.
// src.pbk.org/games/:game_id POST - create a new game
// src.pbk.org/games/:game_id GET - display game info
// src.pbk.org/games/:game_id PATCH - update game info

var router = require('express').Router(),
	privileges = require('../../helpers/access').privilege,
	Game = require('../../models/game'),
	Pagination = require('../../helpers/pagination');
const { renderPage, postPage, defaultCapabilities, validateRequest } = require('./helpers');

router.get('/:order(alphabetical|latest)?/:local(page)?/:number([0-9]+)?', function(req, res)
{
	var order = req.params.order || 'alphabetical';
	Game.getAll().count(function(err, count)
	{
		var nav = new Pagination('/games/'+order, count, req.params.number);
		res.render('games/index',
		{
			pagination: nav.result,
			order: order,
			games: Game.getAll()
				.select('title slug thumbnail releases')
				.sort(order == 'alphabetical' ? 'title' : '-updated')
				.skip(nav.start || 0)
				.limit(nav.itemsPerPage)
		});
	});
});

router.get('/:slug', function(req, res)
{
	renderPage(req, res, 'games/game');
});

router.get('/:slug/privileges', function(req, res)
{
	// have to pass addt'l param to resolve Group objects
	renderPage(req, res, 'games/privileges', ['groups.group']);
});

router.get('/:slug/releases', function(req, res)
{
	// have to pass addt'l param to resolve Release objects
	renderPage(req, res, 'games/releases', ['releases']);
});

router.get('/:slug/release/:commit_id', function(req, res)
{
	res.redirect('/games/game/' + req.params.slug + '/releases');
});

router.post('/:slug', function(req, res)
{
	let errors = validateRequest(req);
	if (errors) return done(errors);
	
});

router.patch('/:slug', function(req, res){
	console.log('in patch');
	let errors = validateRequest(req);
	if (errors) return done(errors);

	defaultCapabilities(req.body.capabilities);

	req.body.updated = Date.now();

	Game.getBySlug(req.params.slug)
	.then(game => {
		return Game.findByIdAndUpdate(game._id, req.body);
	})
	.then(()=>{
		res.redirect('/games/' + req.params.slug);
	});
});

router.delete('/:slug', function(req, res){
	console.log('in delete');
	
	Game.getBySlug(req.params.slug)
	.then(game => {
		if (game.isArchived){
			game.remove();
		}
		else {
			game.isArchived = true;
		}
		game.save(function(err)
		{
			if (err)
			{
				return done(err);
			}
		});
	})
	.then(() => {
		res.redirect('/');
	})
		
});

module.exports = router;