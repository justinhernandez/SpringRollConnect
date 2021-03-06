var router = require('express').Router(),
	Game = require('../../models/game'),
	Release = require('../../models/release'),
	Pagination = require('../../helpers/pagination'),
	Access = require('../../helpers/access');
const { renderPage, handleError, defaultCapabilities, validateRequest } = require('./helpers');

router.get('/:order(alphabetical|latest)?/:local(page)?/:number([0-9]+)?', function(req, res)
{
	var order = req.params.order || 'alphabetical';
	if (req.originalUrl.startsWith('/games')){
		Game.getAll().count( function(err, count)
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
	}
	else if (req.originalUrl.startsWith('/archive')){
		Game.getAllArchived().count( function(err, count)
		{
			var nav = new Pagination('/games/'+order, count, req.params.number);
			res.render('games/index',
			{
				pagination: nav.result,
				order: order,
				games: Game.getAllArchived()
					.select('title slug thumbnail releases')
					.sort(order == 'alphabetical' ? 'title' : '-updated')
					.skip(nav.start || 0)
					.limit(nav.itemsPerPage)
			});
		});
	}

});

router.use('/:slug/privileges', Access.isAdmin);

router.get('/:slug', function(req, res)
{
	renderPage(req, res, 'games/game');
});

router.get('/:slug/privileges', function(req, res)
{
	// have to pass addt'l param to resolve Group objects
	renderPage(req, res, 'games/privileges', 'groups.group');
});

router.post('/:slug/privileges', function(req, res)
{
	Game.getBySlug(req.params.slug).then(game => {
		const render = () => renderPage(req, res, 'games/privileges', 'groups.group');
		switch (req.body.action) {
			case 'addGroup':
				Game.addGroup(game._id, req.body.group, req.body.permission, render);
				break;
			case 'changePermission':
				game.changePermission(req.body.group, req.body.permission, render);
				break;
			case 'removeGroup':
				game.removeGroup(req.body.group, render);
				break;
			default:
				render();
				break;
		}
	}).catch(err => {
		console.error("Privileges error", err);
		res.status(404).render('404');
	});
});

router.get('/:slug/releases', function(req, res)
{
	// have to pass addt'l param to resolve Release objects
	renderPage(req, res, 'games/releases', 'releases');
});

router.patch('/:slug/releases/:commit_id', async function(req, res)
{
	// 307 maintains PATCH verb
	res.redirect(307, '/releases/' + req.body.commitId);
});

router.patch('/:slug', function(req, res){
	let errors = validateRequest(req);
	if (errors) {
		return handleError(errors);
	}

	defaultCapabilities(req.body.capabilities);

	req.body.updated = Date.now();

	Game.getBySlug(req.params.slug)
	.then(game => {
		return Game.findByIdAndUpdate(game._id, req.body);
	})
	.then(game => {
		// have to re-get because slug may have changed
		Game.findById(game._id).then(game => {
			if (game.isArchived){
				res.redirect('/archive/' + game.slug);
			}
			else {
				res.redirect('/games/' + game.slug);
			}
		});
	});
});

router.delete('/:slug', function(req, res){
	Game.getBySlug(req.params.slug)
	.then(game => {
		if (game.isArchived){
			game.remove();
		}
		else {
			game.isArchived = true;
			game.save(function(err) {
				if (err)
				{
					return done(err);
				}
			});
		}
	})
	.then(() => {
		res.redirect('/');
	});

});

module.exports = router;