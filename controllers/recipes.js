const db = require('../models/index');
const createError = require('http-errors');
const redis = require('redis');

let redisClient;

(async () => {
	redisClient = redis.createClient();

	redisClient.on("error", (error) => console.error(`Error : ${error}`));

	await redisClient.connect();
})();

async function suggestions(req, res, next){
    // Endpoint: [api-endpoint]/recipes/suggestions?perPage={val}&categoryId={val}    
    try {
        let result = {};
        req.query.perPage = req.query.perPage? parseInt(req.query.perPage): 4;
        req.query.categoryId = req.query.categoryId? parseInt(req.query.categoryId): null;
        const cacheResults = await redisClient.get('suggestions#' + req.query.perPage + '#' + req.query.categoryId);
        if (cacheResults) {
            result = JSON.parse(cacheResults);
            res.status(200).json(result);
            return;
        }
        if (req.query.categoryId){
            result.recipes = await db.Recipe.findAll({
                limit: req.query.perPage,
                where: {
                    CategoryId: req.query.categoryId,
                },
                attributes: {
                    exclude: [
                        'ingredients', 'directions', 'cookingTime', 'nutritionInformation',
                        'nutritionDetails', 'shortDescription', 'AuthorId', 'CategoryId', 'updatedAt',
                    ],
                },
                include: [{
                    model: db.Author,
                    attributes: ['firstName', 'lastName']
                }, {
                    model: db.Category,
                    attributes: ['value'],
                }]
            });
            result.totalRecipesOfCategory = await db.Recipe.count({
                where: {
                    CategoryId: req.query.categoryId,
                }
            });
        }
        else {
            result.recipes = await db.Recipe.findAll({
                limit: req.query.perPage,
                order: db.sequelize.random(),
                attributes: {
                    exclude: [
                        'ingredients', 'directions', 'cookingTime', 'nutritionInformation',
                        'nutritionDetails', 'shortDescription', 'AuthorId', 'CategoryId', 'updatedAt',
                    ]
                },
                include: [{
                    model: db.Author,
                    attributes: ['firstName', 'lastName']
                }, {
                    model: db.Category,
                    attributes: ['value'],
                }],
            });
            result.totalRecipes = await db.Recipe.count({
                where: {
                    CategoryId: req.query.categoryId,
                }
            });
        }
        await redisClient.set('suggestions#' + req.query.perPage + '#' + req.query.categoryId, JSON.stringify(result));
        res.status(200).json(result);
        return;
    }
    catch (err){
        console.log(err);
        next(createError(500, "Something went wrong"));
        return;
    }
}

async function recipes(req, res, next){
    try {
        req.query.pageNo = parseInt(req.query.pageNo);
        req.query.pageNo = !req.query.pageNo? 1: req.query.pageNo;
        let result = {};
        const cacheResults = await redisClient.get('recipes#' + req.query.pageNo);
        if (cacheResults) {
            result = JSON.parse(cacheResults);
            res.status(200).json(result);
            return;
        }
        result.blogs = await db.Recipe.findAll({
            limit: 6,
            offset: (req.query.pageNo - 1) * 6,
            attributes: {
                exclude: ['updatedAt', 'content', 'AuthorId', 'nutritionDetails', 'nutritionInformation',
                    'preparationTime', 'cookingTime', 'directions', 'ingredients'],
            },
            include: {
                model: db.Author,
                attributes: ['firstName', 'lastName', 'image'],
            }
        });
        result.totalRecipes = await db.Recipe.count();
        await redisClient.set('recipes#' + req.query.pageNo, JSON.stringify(result));
        res.status(200).json(result);
        return;
    }
    catch (err){
        console.log(err);
        next(createError(500, "Something went wrong"));
        return;
    }
}

async function singleRecipe(req, res, next){
    try {
        let result;
        const cacheResults = await redisClient.get('recipe#' + req.params.recipeId);
        if (cacheResults) {
            result = JSON.parse(cacheResults);
            res.status(200).json(result);
            return;
        }
        result = await db.Recipe.findByPk(req.params.recipeId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'AuthorId', 'CategoryId'],
            },
            include: [{
                model: db.Author,
                attributes: ['firstName', 'lastName']
            }, {
                model: db.Category,
                attributes: ['value'],
            }],
        });
        if (result === null){
            next(createError(404, "Recipe not found"));
            return;
        }
        await redisClient.set('recipe#', req.params.recipeId, JSON.stringify(result));
        res.status(200).json(result);
        return;
    }
    catch (err){
        console.log(err);
        next(createError(500, "Something went wrong"));
        return;
    }    
}

module.exports = {
    recipes,
    suggestions,
    singleRecipe,
}