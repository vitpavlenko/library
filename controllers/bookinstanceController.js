const BookInstance = require('../models/bookinstance')
const Book = require('../models/book')
// const async = require('async')

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = async function (req, res, next) {

    try {
        const list_bookinstances = await BookInstance.find()
            .populate('book');
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    } catch (err) {
        return next(err);
    }

};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async function (req, res, next) {

    try {
        const bookinstance = BookInstance.findById(req.params.id)
            .populate('book');
        if (bookinstance == null) { // No results.
            const err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
    } catch (err) {
        return next(err);
    }

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = async function (req, res, next) {

    try {
        const books = await Book.find({}, 'title');
        // Successful, so render.
        res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
    } catch (err) {
        return next(err);
    }

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            });
        try {
            if (!errors.isEmpty()) {
                // There are errors. Render form again with sanitized values and error messages.
                const books = await Book.find({}, 'title');
                // Successful, so render.
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
                return;
            }
            else {
                // Data from form is valid
                await bookinstance.save()
                // Successful - redirect to new record.
                res.redirect(bookinstance.url);
            }
        } catch (err) {
            return next(err);
        }
    }
];



// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async function (req, res, next) {

    try {
        const bookinstance = await BookInstance.findById(req.params.id)
            .populate('book');
        if (bookinstance == null) { // No results.
            res.redirect('/catalog/bookinstances');
        }
        // Successful, so render.
        res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: bookinstance });
    } catch (err) {
        return next(err);
    }

};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async function (req, res, next) {

    // Assume valid BookInstance id in field.
    try {
        await BookInstance.findByIdAndRemove(req.body.id);
        // Success, so redirect to list of BookInstance items.
        res.redirect('/catalog/bookinstances');
    } catch (err) {
        return next(err);
    }

};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async function (req, res, next) {

    // Get book, authors and genres for form.
    try {
        const results = {
            bookinstance: await BookInstance.findById(req.params.id).populate('book'),
            books: await Book.find()
        };
        if (results.bookinstance == null) { // No results.
            const err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('bookinstance_form', { title: 'Update  BookInstance', book_list: results.books, selected_book: results.bookinstance.book._id, bookinstance: results.bookinstance });
    } catch (err) {
        return next(err);
    }

};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped/trimmed data and current id.
        const bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            });

        try {
            if (!errors.isEmpty()) {
                // There are errors so render the form again, passing sanitized values and errors.
                const books = await Book.find({}, 'title')

                // Successful, so render.
                res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
                return;
            }
            else {
                // Data from form is valid.
                const thebookinstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
                // Successful - redirect to detail page.
                res.redirect(thebookinstance.url);
            }
        } catch (err) {
            return next(err);
        }
    }
];
