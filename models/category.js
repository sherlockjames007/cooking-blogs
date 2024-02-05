'use strict';
const {
	Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Category extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			Category.hasMany(models.Recipe);
		}
	}
	Category.init({
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		value: {
			type: DataTypes.STRING(50),
			allowNull: false,
			unique: true,
		},
		image: {
			type: DataTypes.STRING(1000),
			allowNull: false,
		}
	}, {
		sequelize,
		freezeTableName: true,
	});
	return Category;
};