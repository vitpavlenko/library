const Genre = require('../models/genre');
const Book = require('../models/book');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = async function (req, res, next) {

    try {
        const list_genres = await Genre.find()
            .sort([['name', 'ascending']]);
        res.render('genre_list', { title: 'Genre List', list_genres: list_genres });
    } catch (err) {
        return next(err);
    }

};

// Display detail page for a specific Genre.
exports.genre_detail = async function (req, res, next) {

    try {
        const results = {
            genre: await Genre.findById(req.params.id),
            genre_books: await Book.find({ 'genre': req.params.id })
        };
        if (results.genre == null) { // No results.
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    } catch (err) {
        return next(err);
    }

};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [

    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre(
            { name: req.body.name }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            try {
                const found_genre = await Genre.findOne({ 'name': req.body.name });
                // Check if Genre with same name already exists.
                if (found_genre) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                }
                else {
                    await genre.save();
                    res.redirect(genre.url);
                }
            } catch (err) {
                return next(err);
            }
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = async function (req, res, next) {

    try {
        const results = {
            genre: await
                Genre.findById(req.params.id),
            genre_books: await
                Book.find({ 'genre': req.params.id })
        };
        if (results.genre == null) { // No results.
            res.redirect('/catalog/genres');
        }
        // Successful, so render.
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
    } catch (err) {
        return next(err);
    }

};

// Handle Genre delete on POST.
exports.genre_delete_post = async function (req, res, next) {

    try {
        const results = {
            genre: await
                Genre.findById(req.params.id),
            genre_books: await
                Book.find({ 'genre': req.params.id })
        };
        // Success
        if (results.genre_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
            return;
        }
        else {
            // Genre has no books. Delete object and redirect to the list of genres.
            await Genre.findByIdAndRemove(req.body.id)
            // Success - go to genres list.
            res.redirect('/catalog/genres');
        }
    } catch (err) {
        return next(err);
    }

};

// Display Genre update form on GET.
exports.genre_update_get = async function (req, res, next) {

    try {
        const genre = await Genre.findById(req.params.id);
        if (genre == null) { // No results.
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('genre_form', { title: 'Update Genre', genre: genre });
    } catch (err) {
        return next(err);
    }

};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request .
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data (and the old id!)
        const genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id
            }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            try {
                // Data from form is valid. Update the record.
                const thegenre = await Genre.findByIdAndUpdate(req.params.id, genre, {})
                // Successful - redirect to genre detail page.
                res.redirect(thegenre.url);
            } catch (err) {
                return next(err);
            } 
        }
    }
];
