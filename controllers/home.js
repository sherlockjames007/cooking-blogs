const db = require('../models/index');
const createError = require('http-errors');
const redis = require('redis');

let redisClient;

(async () => {
	redisClient = redis.createClient();

	redisClient.on("error", (error) => console.error(`Error : ${error}`));

	await redisClient.connect();
})();

async function categories(req, res, next){
    try {
        req.query.limit = req.query.limit? parseInt(req.query.limit): 6;
        let result = {};
        const cacheResults = await redisClient.get('categories#' + req.query.limit);
        if (cacheResults) {
            result = JSON.parse(cacheResults);
            res.status(200).json(result);
            return;
        }
        result.categories = await db.Category.findAll({
            limit: req.query.limit,
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            }
        });
        result.totalCategories = await db.Category.count();
        await redisClient.set('categories#' + req.query.limit, JSON.stringify(result));
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
    categories,
}