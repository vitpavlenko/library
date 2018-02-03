const Author = require('../models/author');
const Book = require('../models/book');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Authors.
exports.author_list = async function (req, res, next) {

    try {
        const list_authors = await Author.find()
            .sort([['family_name', 'ascending']]);
        // Successful, so render.
        res.render('author_list', { title: 'Author List', author_list: list_authors });
    } catch (err) {
        return next(err);
    }

};

// Display detail page for a specific Author.
exports.author_detail = async function (req, res, next) {

    try {
        const author = Author.findById(req.params.id);
        const authors_books = Book.find({ 'author': req.params.id }, 'title summary');
        const results = {
            author: await author,
            authors_books: await authors_books
        };
        if (results.author == null) {
            const err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });
    } catch (err) {
        return next(err);
    }

};

// Display Author create form on GET.
exports.author_create_get = function (req, res, next) {
    res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST.
exports.author_create_post = [

    // Validate fields.
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            try {
                const author = await new Author(
                    {
                        first_name: req.body.first_name,
                        family_name: req.body.family_name,
                        date_of_birth: req.body.date_of_birth,
                        date_of_death: req.body.date_of_death
                    }).save();
                res.redirect(author.url);
            } catch (err) {
                return next(err);
            }
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = async function (req, res, next) {

    try {
        const author = Author.findById(req.params.id);
        const authors_books = Book.find({ 'author': req.params.id });
        const results = {
            author: await author,
            authors_books: await authors_books
        };
        if (results.author == null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books });
    } catch (err) {
        return next(err);
    }

};

// Handle Author delete on POST.
exports.author_delete_post = async function (req, res, next) {

    try {
        const author = Author.findById(req.body.authorid);
        const author_books = Book.find({ 'author': req.body.authorid });
        const results = {
            author: await author,
            authors_books: await author_books
        };
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', author: results.author, authors_books: results.authors_books });
            return;
        } else {
            // Author has no books. Delete object and redirect to the list of authors.
            await Author.findByIdAndRemove(req.body.authorid);
            // Success - go to author list.
            res.redirect('/catalog/authors')
        }
    } catch (err) {
        return next(err);
    }

};

// Display Author update form on GET.
exports.author_update_get = async function (req, res, next) {

    try {
        const author = await Author.findById(req.params.id);
        if (author == null) { // No results.
            const err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('author_form', { title: 'Update Author', author: author });
    } catch (err) {
        return next(err);
    }

};

// Handle Author update on POST.
exports.author_update_post = [

    // Validate fields.
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        const author = new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id
            }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('author_form', { title: 'Update Author', author: author, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            try {
                const theauthor = Author.findByIdAndUpdate(req.params.id, author, {});
                res.redirect(theauthor.url);
            } catch (err) {
                return next(err);
            }
        }
    }
];
