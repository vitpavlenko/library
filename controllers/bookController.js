const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.index = async function (req, res) {

    try {
        const results = {
            book_count: await Book.count(),
            book_instance_count: await BookInstance.count(),
            book_instance_available_count: await BookInstance.count({ status: 'Available' }),
            author_count: await Author.count(),
            genre_count: await Genre.count()
        }
        res.render('index', { title: 'Local Library Home', error: null, data: results });
    } catch (err) {
        res.render('index', { title: 'Local Library Home', error: err, data: null });
    }

};

// Display list of all books.
exports.book_list = async function (req, res, next) {

    try {
        const list_books = await Book.find({}, 'title author ')
            .populate('author');
        res.render('book_list', { title: 'Book List', book_list: list_books });
    } catch (err) {
        return next(err);
    }

};

// Display detail page for a specific book.
exports.book_detail = async function (req, res, next) {

    try {
        const results = {
            book: await Book.findById(req.params.id)
                .populate('author')
                .populate('genre'),
            book_instance: await BookInstance.find({ 'book': req.params.id })
        }
        if (results.book == null) { // No results.
            const err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance });
    } catch (err) {
        return next(err);
    }

};

// Display book create form on GET.
exports.book_create_get = async function (req, res, next) {

    try {
        const results = {
            authors: await Author.find(),
            genres: await Genre.find()
        };
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    } catch (err) {
        return next(err);
    }

};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('*').trim().escape(),
    sanitizeBody('genre.*').trim().escape(),
    // Process request after validation and sanitization.
    async (req, res, next) => {


        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        const book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            });

        if (!errors.isEmpty()) {
            try {
                const results = {
                    authors: await Author.find(),
                    genres: await Genre.find()
                };
                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            } catch (err) {
                return next(err);
            }
            return;
        }
        else {
            // Data from form is valid. Save book.
            try {
                await book.save();
                // Successful - redirect to new book record.
                res.redirect(book.url);
            } catch (err) {
                return next(err);
            }
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = async function (req, res, next) {

    try {
        const results = {
            book: await Book.findById(req.params.id).populate('author').populate('genre'),
            book_bookinstances: await BookInstance.find({ 'book': req.params.id })
        };
        if (results.book == null) { // No results.
            res.redirect('/catalog/books');
        }
        // Successful, so render.
        res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_bookinstances });
    } catch (err) {
        return next(err)
    }

};

// Handle book delete on POST.
exports.book_delete_post = async function (req, res, next) {

    // Assume the post has valid id (ie no validation/sanitization).
    try {
        const results = {
            book: await Book.findById(req.params.id).populate('author').populate('genre'),
            authors: await Author.find(),
            genres: await Genre.find()
        };
        if (results.book == null) { // No results.
            const err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        // Mark our selected genres as checked.
        for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
    } catch (err) {
        return next(err);
    }

};

// Display book update form on GET.
exports.book_update_get = async function (req, res, next) {

    // Get book, authors and genres for form.
    try {
        const results = {
            book: await Book.findById(req.params.id).populate('author').populate('genre'),
            authors: await Author.find(),
            genres: await Genre.find()
        };
        if (results.book == null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        // Mark our selected genres as checked.
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
    } catch (err) {
        return next(err);
    }

};


// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('title').trim().escape(),
    sanitizeBody('author').trim().escape(),
    sanitizeBody('summary').trim().escape(),
    sanitizeBody('isbn').trim().escape(),
    sanitizeBody('genre.*').trim().escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id: req.params.id // This is required, or a new ID will be assigned!
            });
        try {
            if (!errors.isEmpty()) {
                // There are errors. Render form again with sanitized values/error messages.
                // Get all authors and genres for form
                const results = {
                    authors: await Author.find(),
                    genres: await Genre.find()
                };
                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
                return;
            }
            else {
                // Data from form is valid. Update the record.
                const thebook = await Book.findByIdAndUpdate(req.params.id, book, {})
                // Successful - redirect to book detail page.
                res.redirect(thebook.url);
            }
        } catch (err) {
            return next(err);
        }
    }
];

