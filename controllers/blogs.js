const db = require('../models/index');
const createError = require('http-errors');
const redis = require("redis");

let redisClient;

(async () => {
	redisClient = redis.createClient();

	redisClient.on("error", (error) => console.error(`Error : ${error}`));

	await redisClient.connect();
})();

async function blogs(req, res, next){
    try {
        req.query.pageNo = parseInt(req.query.pageNo);
        req.query.pageNo = !req.query.pageNo? 1: req.query.pageNo;
        let result = {};
        const cacheResults = await redisClient.get('blogs#' + req.query.pageNo);
        if (cacheResults) {
            result = JSON.parse(cacheResults);
            res.status(200).json(result);
            return;
        }
        result.blogs = await db.Blog.findAll({
            limit: 6,
            offset: (req.query.pageNo - 1) * 6,
            attributes: {
                exclude: ['updatedAt', 'content', 'AuthorId'],
            },
            include: {
                model: db.Author,
                attributes: ['firstName', 'lastName', 'image'],
            }
        });
        result.totalBlogs = await db.Blog.count();
        await redisClient.set('blogs#' + req.query.pageNo, JSON.stringify(result));
        res.status(200).json(result);
        return;
    }
    catch (err){
        console.log(err);
        next(createError(500, "Something went wrong"));
        return;
    }
}

async function singleBlog(req, res, next){
    try {
        let result;
        const cacheResults = await redisClient.get('blog#' + req.params.blogId);
        if (cacheResults) {
            result = JSON.parse(cacheResults);
            res.status(200).json(result);
            return;
        }
        result = await db.Blog.findByPk(req.params.blogId, {
            attributes: {
                exclude: ['AuthorId', 'updatedAt'],
            },
            include: {
                model: db.Author,
                attributes: ['firstName', 'lastName', 'image'],
            }
        });
        if (!result){
            next(createError(404, "Blog not found"));
            return;
        }
        await redisClient.set('blog#' + req.params.blogId, JSON.stringify(result));
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
    blogs,
    singleBlog,
}