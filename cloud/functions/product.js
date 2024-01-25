const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');

Parse.Cloud.define('get-product-list', async (req) => {
	const queryProducts = new Parse.Query(Product);

	//condictions

	if(req.params.title != null){
		queryProducts.fullText('title', req.params.title);
		//queryProducts.matches('title', '.*' + req.params.title + '.*');
	}

	if(req.params.categoryId != null) {
		const category = new Category();
		category.id = req.params.categoryId;

		queryProducts.equalTo('category', category);
	}

	const itemsPerPage = req.params.itemsPerPage || 10;
	if(itemsPerPage > 100) throw 'Invalid number of items per page';

	queryProducts.skip(itemsPerPage * req.params.page || 0);
	queryProducts.limit(itemsPerPage);

	queryProducts.include('category')

	const resultProducts = await queryProducts.find({useMasterKey: true});

	return resultProducts.map(function (p){
		p = p.toJSON();
		return formatProduct(p);
	});
});

Parse.Cloud.define('get-category-list', async (req) => {
	const queryCategories = new Parse.Query(Category);

	//condictions

	const resultCategories = await queryCategories.find({useMasterKey: true});
	return resultCategories.map(function (c) {
		c = c.toJSON();
		return {
			title: c.title,
			id: c.objectId
		}

	});
});

function formatProduct(productJason) {
	return {
		id: productJason.objectId,
		title: productJason.title,
		description: productJason.description,
		price: productJason.price,
		unit: productJason.unit,
		picture: productJason.picture != null ? productJason.picture.url : null,
		category: {
			title: productJason.category.title,
			id: productJason.category.objectId
		},
	}
}

module.exports = {formatProduct}